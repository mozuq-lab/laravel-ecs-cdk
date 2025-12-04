import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { LaravelEcsCdkStack } from '../lib/laravel-ecs-cdk-stack';

describe('LaravelEcsCdkStack', () => {
  let template: Template;

  beforeAll(() => {
    const app = new cdk.App();
    const stack = new LaravelEcsCdkStack(app, 'TestStack');
    template = Template.fromStack(stack);
  });

  describe('Network', () => {
    test('VPCが作成される', () => {
      template.resourceCountIs('AWS::EC2::VPC', 1);
    });

    test('NATゲートウェイが1つ作成される', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 1);
    });
  });

  describe('ECS', () => {
    test('ECSクラスターが作成される', () => {
      template.resourceCountIs('AWS::ECS::Cluster', 1);
    });

    test('Fargateサービスが作成される', () => {
      template.resourceCountIs('AWS::ECS::Service', 1);
    });

    test('タスク定義が正しいリソース設定を持つ', () => {
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        Cpu: '512',
        Memory: '1024',
      });
    });
  });

  describe('ECR', () => {
    test('ECRリポジトリが作成される', () => {
      template.resourceCountIs('AWS::ECR::Repository', 1);
    });
  });

  describe('Load Balancer', () => {
    test('ALBが作成される', () => {
      template.resourceCountIs('AWS::ElasticLoadBalancingV2::LoadBalancer', 1);
    });

    test('ターゲットグループが作成される', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
        HealthCheckPath: '/',
        Port: 80,
        Protocol: 'HTTP',
      });
    });
  });

  describe('CI/CD Pipeline', () => {
    test('S3ソースバケットが作成される', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('CodeBuildプロジェクトが作成される', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Environment: {
          ComputeType: 'BUILD_GENERAL1_SMALL',
          Image: 'aws/codebuild/standard:7.0',
          PrivilegedMode: true,
        },
      });
    });

    test('CodePipelineが3つのステージを持つ', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Stages: [
          { Name: 'Source' },
          { Name: 'Build' },
          { Name: 'Deploy' },
        ],
      });
    });
  });

  describe('Outputs', () => {
    test('S3バケット名が出力される', () => {
      const outputs = template.findOutputs('SourceBucketName');
      expect(Object.keys(outputs).length).toBe(1);
    });
  });
});
