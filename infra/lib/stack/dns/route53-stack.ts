import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import { EnvironmentConfig } from '../../../config/environment';

export interface Route53StackProps extends cdk.StackProps {
  /**
   * 既存パブリックホストゾーン
   */
  hostedZoneId: string;
  zoneName: string;
  /**
   * ALB へ向ける A レコード（サブドメイン名の配列）
   */
  albRecordNames: string[];
  alb: elbv2.IApplicationLoadBalancer;
  /**
   * S3+CloudFront フロント用（指定かつ distribution があるときのみ作成）
   */
  cloudFrontRecordName?: string;
  distribution?: cloudfront.IDistribution;
}

/**
 * Route 53: 既存ホストゾーンへのエイリアス A レコード
 *
 * ホストゾーンの新規作成は行わない（事前に Route53 またはレジストラ側で用意すること）。
 * HTTPS カスタムドメインは ACM 証明書と ALB/CloudFront のドメイン設定が別途必要。
 */
export class Route53Stack extends cdk.Stack {
  public readonly hostedZone: route53.IHostedZone;

  constructor(
    scope: Construct,
    id: string,
    config: EnvironmentConfig,
    props: Route53StackProps
  ) {
    super(scope, id, props);

    this.hostedZone = route53.HostedZone.fromHostedZoneAttributes(
      this,
      'ImportedZone',
      {
        hostedZoneId: props.hostedZoneId,
        zoneName: props.zoneName,
      }
    );

    props.albRecordNames.forEach((name, i) => {
      const safeId = name.replace(/[^a-zA-Z0-9]/g, '') || `Record${i}`;
      new route53.ARecord(this, `AlbAlias${safeId}${i}`, {
        zone: this.hostedZone,
        recordName: name,
        target: route53.RecordTarget.fromAlias(
          new targets.LoadBalancerTarget(props.alb)
        ),
      });
    });

    if (props.cloudFrontRecordName && props.distribution) {
      new route53.ARecord(this, 'CloudFrontAlias', {
        zone: this.hostedZone,
        recordName: props.cloudFrontRecordName,
        target: route53.RecordTarget.fromAlias(
          new targets.CloudFrontTarget(props.distribution)
        ),
      });
    }

    new cdk.CfnOutput(this, 'Route53ZoneName', {
      value: props.zoneName,
      description: 'Route53 zone name (records created in this zone)',
      exportName: `${config.envName}-Route53ZoneName`,
    });

    cdk.Tags.of(this).add('Environment', config.envName);
    cdk.Tags.of(this).add('Project', config.tags.Project);
    cdk.Tags.of(this).add('ManagedBy', config.tags.ManagedBy);
    cdk.Tags.of(this).add('Layer', 'DNS');
  }
}
