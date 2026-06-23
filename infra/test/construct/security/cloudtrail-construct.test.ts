import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as logs from 'aws-cdk-lib/aws-logs';
import { CloudTrailConstruct } from '../../../lib/construct/security/cloudtrail-construct';

describe('CloudTrailConstruct', () => {
  describe('Default Configuration', () => {
    let template: Template;
    let construct: CloudTrailConstruct;

    beforeEach(() => {
      const app = new cdk.App();
      const stack = new cdk.Stack(app, 'TestStack');
      const bucket = new s3.Bucket(stack, 'TestBucket');

      construct = new CloudTrailConstruct(stack, 'TestTrail', {
        trailName: 'test-trail',
        logBucket: bucket,
      });

      template = Template.fromStack(stack);
    });

    it('should create a CloudTrail Trail', () => {
      template.resourceCountIs('AWS::CloudTrail::Trail', 1);
    });

    it('should export trail property', () => {
      expect(construct.trail).toBeDefined();
    });

    it('should have correct trail name', () => {
      template.hasResourceProperties('AWS::CloudTrail::Trail', {
        TrailName: 'test-trail',
      });
    });

    it('should enable multi-region', () => {
      template.hasResourceProperties('AWS::CloudTrail::Trail', {
        IsMultiRegionTrail: true,
      });
    });

    it('should include global service events', () => {
      template.hasResourceProperties('AWS::CloudTrail::Trail', {
        IncludeGlobalServiceEvents: true,
      });
    });

    it('should enable log file validation', () => {
      template.hasResourceProperties('AWS::CloudTrail::Trail', {
        EnableLogFileValidation: true,
      });
    });

    it('should use default S3 key prefix', () => {
      template.hasResourceProperties('AWS::CloudTrail::Trail', {
        S3KeyPrefix: 'cloudtrail',
      });
    });

    it('should not send to CloudWatch Logs by default', () => {
      template.hasResourceProperties('AWS::CloudTrail::Trail', {
        CloudWatchLogsLogGroupArn: Match.absent(),
      });
    });
  });

  describe('With CloudWatch Logs', () => {
    it('should send to CloudWatch Logs when logGroup is provided', () => {
      const app = new cdk.App();
      const stack = new cdk.Stack(app, 'TestStack');
      const bucket = new s3.Bucket(stack, 'TestBucket');
      const logGroup = new logs.LogGroup(stack, 'TestLogGroup');

      new CloudTrailConstruct(stack, 'TestTrail', {
        trailName: 'test-trail',
        logBucket: bucket,
        cloudWatchLogGroup: logGroup,
      });

      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::CloudTrail::Trail', {
        CloudWatchLogsLogGroupArn: Match.anyValue(),
      });
    });
  });

  describe('Custom S3 Key Prefix', () => {
    it('should use custom S3 key prefix', () => {
      const app = new cdk.App();
      const stack = new cdk.Stack(app, 'TestStack');
      const bucket = new s3.Bucket(stack, 'TestBucket');

      new CloudTrailConstruct(stack, 'TestTrail', {
        trailName: 'test-trail',
        logBucket: bucket,
        s3KeyPrefix: 'custom-prefix',
      });

      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::CloudTrail::Trail', {
        S3KeyPrefix: 'custom-prefix',
      });
    });
  });
});
