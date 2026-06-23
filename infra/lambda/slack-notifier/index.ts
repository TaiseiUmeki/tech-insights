import * as https from 'https';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';

const ssmClient = new SSMClient();
let cachedWebhookUrl: string | undefined;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5分

/**
 * SSM Parameter StoreからWebhook URLを取得（5分間キャッシュ）
 */
async function getWebhookUrl(): Promise<string> {
  if (cachedWebhookUrl && Date.now() - cacheTimestamp < CACHE_TTL_MS) {
    return cachedWebhookUrl;
  }

  const parameterName = process.env.SLACK_WEBHOOK_URL_PARAMETER_NAME;
  if (!parameterName) {
    throw new Error('SLACK_WEBHOOK_URL_PARAMETER_NAME が未設定です');
  }

  const result = await ssmClient.send(
    new GetParameterCommand({
      Name: parameterName,
      WithDecryption: true,
    })
  );

  const value = result.Parameter?.Value;
  if (!value) {
    throw new Error(`SSMパラメータ ${parameterName} の値が空です`);
  }

  cachedWebhookUrl = value;
  cacheTimestamp = Date.now();
  return value;
}

interface SNSRecord {
  Sns: {
    Subject?: string;
    Message: string;
    Timestamp: string;
  };
}

interface SNSEvent {
  Records: SNSRecord[];
}

interface SlackBlock {
  type: string;
  text?: { type: string; text: string };
  fields?: { type: string; text: string }[];
}

interface SlackPayload {
  blocks: SlackBlock[];
}

interface CloudTrailDetail {
  eventName?: string;
  eventSource?: string;
  userIdentity?: { arn?: string; userName?: string; type?: string };
  awsRegion?: string;
  eventTime?: string;
  recipientAccountId?: string;
}

interface CloudWatchAlarm {
  AlarmName: string;
  NewStateValue: string;
  NewStateReason: string;
  Region: string;
  StateChangeTime: string;
}

/**
 * SNSイベントを受け取り、Slack Incoming Webhookに通知するLambda関数
 */
export const handler = async (event: SNSEvent) => {
  let webhookUrl: string;
  try {
    webhookUrl = await getWebhookUrl();
  } catch (err) {
    console.error('Webhook URLの取得に失敗:', err);
    return { statusCode: 500, body: 'Webhook URLの取得に失敗しました' };
  }

  const results = await Promise.allSettled(
    event.Records.map((record) => {
      const snsMessage = record.Sns;
      const payload = buildSlackPayload(snsMessage);
      return postToSlack(webhookUrl, payload);
    })
  );

  const failures = results.filter(
    (r): r is PromiseRejectedResult => r.status === 'rejected'
  );
  if (failures.length > 0) {
    console.error(`${failures.length}件のSlack送信に失敗:`, failures.map((f) => f.reason));
    // 全件失敗時はエラーを投げてSNS側のリトライを促す
    if (failures.length === results.length) {
      throw new Error(`全${failures.length}件のSlack送信に失敗しました`);
    }
  }

  return { statusCode: 200 };
};

/**
 * SNSメッセージからSlack Block Kit形式のペイロードを構築
 */
function buildSlackPayload(snsMessage: SNSRecord['Sns']): SlackPayload {
  const subject = snsMessage.Subject || 'セキュリティアラート';
  let detail: CloudTrailDetail = {};

  try {
    const parsed = JSON.parse(snsMessage.Message);
    // EventBridge経由（CloudTrail APIイベント）
    if (parsed.detail) {
      detail = parsed.detail;
    }
    // CloudWatch Alarm経由
    if (parsed.AlarmName) {
      return buildAlarmPayload(parsed);
    }
  } catch {
    // JSON解析失敗時はプレーンテキストとしてそのまま通知
    return {
      blocks: [
        {
          type: 'header',
          text: { type: 'plain_text', text: `:rotating_light: ${subject}` },
        },
        {
          type: 'section',
          text: { type: 'mrkdwn', text: snsMessage.Message },
        },
      ],
    };
  }

  // EventBridge経由のセキュリティイベント
  const eventName = detail.eventName || '不明';
  const eventSource = detail.eventSource || '不明';
  const userIdentity = detail.userIdentity || {};
  const actor = userIdentity.arn || userIdentity.userName || userIdentity.type || '不明';
  const region = detail.awsRegion || '不明';
  const time = detail.eventTime || snsMessage.Timestamp || '不明';
  const accountId = detail.recipientAccountId || '不明';

  return {
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: `:rotating_light: ${subject}` },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*イベント:*\n${eventName}` },
          { type: 'mrkdwn', text: `*ソース:*\n${eventSource}` },
          { type: 'mrkdwn', text: `*実行者:*\n${actor}` },
          { type: 'mrkdwn', text: `*リージョン:*\n${region}` },
          { type: 'mrkdwn', text: `*アカウント:*\n${accountId}` },
          { type: 'mrkdwn', text: `*時刻:*\n${time}` },
        ],
      },
    ],
  };
}

/**
 * CloudWatch Alarm通知用のペイロードを構築
 */
function buildAlarmPayload(alarm: CloudWatchAlarm): SlackPayload {
  const stateEmoji = alarm.NewStateValue === 'ALARM' ? ':red_circle:' : ':large_green_circle:';
  return {
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: `${stateEmoji} ${alarm.AlarmName}` },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*状態:*\n${alarm.NewStateValue}` },
          { type: 'mrkdwn', text: `*理由:*\n${alarm.NewStateReason}` },
          { type: 'mrkdwn', text: `*リージョン:*\n${alarm.Region}` },
          { type: 'mrkdwn', text: `*時刻:*\n${alarm.StateChangeTime}` },
        ],
      },
    ],
  };
}

/**
 * Slack Webhookにペイロードを送信
 */
function postToSlack(webhookUrl: string, payload: SlackPayload): Promise<string> {
  return new Promise((resolve, reject) => {
    let parsed: URL;
    try {
      parsed = new URL(webhookUrl);
    } catch {
      const msg = 'SLACK_WEBHOOK_URL のフォーマットが不正です';
      console.error(msg);
      return reject(new Error(msg));
    }

    const data = JSON.stringify(payload);

    const options: https.RequestOptions = {
      hostname: parsed.hostname,
      path: parsed.pathname,
      method: 'POST',
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk: string) => { body += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(body);
        } else {
          console.error(`Slack APIエラー: ${res.statusCode} ${body}`);
          reject(new Error(`Slack APIエラー: ${res.statusCode}`));
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Slack APIへのリクエストがタイムアウトしました'));
    });

    req.on('error', (err: Error) => {
      console.error('Slack送信エラー:', err);
      reject(err);
    });

    req.write(data);
    req.end();
  });
}
