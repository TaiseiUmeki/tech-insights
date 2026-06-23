import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { CloudTrailBucketConstruct } from '../../../lib/construct/datastore/cloudtrail-bucket-construct';

describe('CloudTrailBucketConstruct', () => {
  describe('Default Configuration', () => {
    let template: Template;
    let construct: CloudTrailBucketConstruct;

    beforeEach(() => {
      const app = new cdk.App();
      const stack = new cdk.Stack(app, 'TestStack');

      construct = new CloudTrailBucketConstruct(stack, 'TestBucket', {
        bucketName: 'test-cloudtrail-logs',
      });

      template = Template.fromStack(stack);
    });

    it('should create an S3 bucket', () => {
      template.resourceCountIs('AWS::S3::Bucket', 1);
    });

    it('should export bucket property', () => {
      expect(construct.bucket).toBeDefined();
    });

    it('should have correct bucket name', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'test-cloudtrail-logs',
      });
    });

    it('should enable versioning', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    it('should block all public access', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    it('should disable Object Lock by default', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        ObjectLockEnabled: false,
      });
    });

    it('should have lifecycle rules for archiving', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              Id: 'archive-old-logs',
              Status: 'Enabled',
              Transitions: Match.arrayWith([
                Match.objectLike({
                  StorageClass: 'GLACIER',
                  TransitionInDays: 90,
                }),
              ]),
            }),
          ]),
        },
      });
    });

    it('should use KMS managed encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            Match.objectLike({
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'aws:kms',
              },
            }),
          ],
        },
      });
    });

    it('should have delete deny policy with CDK role exclusion', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Deny',
              Action: ['s3:DeleteObject', 's3:DeleteObjectVersion'],
              Principal: Match.anyValue(),
              Condition: {
                StringNotLike: {
                  'aws:PrincipalArn': Match.anyValue(),
                },
              },
            }),
          ]),
        },
      });
    });

    it('should have bucket delete deny policy with CDK role exclusion', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Deny',
              Action: 's3:DeleteBucket',
              Principal: Match.anyValue(),
              Condition: {
                StringNotLike: {
                  'aws:PrincipalArn': Match.anyValue(),
                },
              },
            }),
          ]),
        },
      });
    });
  });

  describe('Custom Configuration', () => {
    it('should use custom Object Lock retention days', () => {
      const app = new cdk.App();
      const stack = new cdk.Stack(app, 'TestStack');

      new CloudTrailBucketConstruct(stack, 'TestBucket', {
        bucketName: 'test-bucket',
        enableObjectLock: true,
        objectLockRetentionDays: 365,
      });

      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::S3::Bucket', {
        ObjectLockConfiguration: Match.objectLike({
          Rule: {
            DefaultRetention: {
              Mode: 'COMPLIANCE',
              Days: 365,
            },
          },
        }),
      });
    });

    it('should disable Object Lock when specified', () => {
      const app = new cdk.App();
      const stack = new cdk.Stack(app, 'TestStack');

      new CloudTrailBucketConstruct(stack, 'TestBucket', {
        bucketName: 'test-bucket',
        enableObjectLock: false,
      });

      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::S3::Bucket', {
        ObjectLockEnabled: false,
      });
    });
  });
});
