import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import { PipelineConstruct } from '../../lib/constructs/pipeline';

describe('PipelineConstruct', () => {
  let stack: cdk.Stack;
  let repository: ecr.Repository;
  let service: ecs.FargateService;

  beforeEach(() => {
    const app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack', {
      env: { account: '123456789012', region: 'ap-northeast-1' },
    });

    const vpc = new ec2.Vpc(stack, 'Vpc');
    repository = new ecr.Repository(stack, 'Repository');

    const cluster = new ecs.Cluster(stack, 'Cluster', { vpc });
    const taskDefinition = new ecs.FargateTaskDefinition(stack, 'TaskDef');
    taskDefinition.addContainer('web', {
      image: ecs.ContainerImage.fromRegistry('amazon/amazon-ecs-sample'),
      memoryLimitMiB: 512,
    });

    service = new ecs.FargateService(stack, 'Service', {
      cluster,
      taskDefinition,
    });
  });

  test('S3ソースバケットが作成される', () => {
    new PipelineConstruct(stack, 'Pipeline', { repository, service });

    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::S3::Bucket', {
      VersioningConfiguration: {
        Status: 'Enabled',
      },
    });
  });

  test('CodeBuildプロジェクトが作成される', () => {
    new PipelineConstruct(stack, 'Pipeline', { repository, service });

    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::CodeBuild::Project', {
      Environment: {
        ComputeType: 'BUILD_GENERAL1_SMALL',
        Image: 'aws/codebuild/standard:7.0',
        PrivilegedMode: true,
        EnvironmentVariables: Match.arrayWith([
          Match.objectLike({ Name: 'AWS_ACCOUNT_ID' }),
          Match.objectLike({ Name: 'AWS_DEFAULT_REGION' }),
          Match.objectLike({ Name: 'IMAGE_REPO_NAME' }),
        ]),
      },
    });
  });

  test('CodePipelineが3ステージで作成される', () => {
    new PipelineConstruct(stack, 'Pipeline', { repository, service });

    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
      Stages: [
        { Name: 'Source' },
        { Name: 'Build' },
        { Name: 'Deploy' },
      ],
    });
  });

  test('カスタムソースオブジェクトキーが設定される', () => {
    new PipelineConstruct(stack, 'Pipeline', {
      repository,
      service,
      sourceObjectKey: 'custom-source.zip',
    });

    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
      Stages: Match.arrayWith([
        Match.objectLike({
          Name: 'Source',
          Actions: Match.arrayWith([
            Match.objectLike({
              Configuration: Match.objectLike({
                S3ObjectKey: 'custom-source.zip',
              }),
            }),
          ]),
        }),
      ]),
    });
  });

  test('プロパティが公開される', () => {
    const pipeline = new PipelineConstruct(stack, 'Pipeline', { repository, service });

    expect(pipeline.sourceBucket).toBeDefined();
    expect(pipeline.pipeline).toBeDefined();
  });

  test('CodeBuildにECRへのアクセス権限が付与される', () => {
    new PipelineConstruct(stack, 'Pipeline', { repository, service });

    const template = Template.fromStack(stack);

    // CodeBuildのIAMポリシーにECR関連の権限が含まれていることを確認
    template.hasResourceProperties('AWS::IAM::Policy', {
      PolicyDocument: {
        Statement: Match.arrayWith([
          Match.objectLike({
            Action: Match.arrayWith([
              'ecr:BatchCheckLayerAvailability',
              'ecr:GetDownloadUrlForLayer',
              'ecr:BatchGetImage',
            ]),
          }),
        ]),
      },
    });
  });
});
