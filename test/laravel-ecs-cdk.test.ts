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
        HealthCheckPath: '/health',
        Port: 80,
        Protocol: 'HTTP',
      });
    });
  });

  describe('Secrets', () => {
    test('Secrets Managerシークレットが作成される', () => {
      template.resourceCountIs('AWS::SecretsManager::Secret', 1);
    });

    test('シークレットARNが出力される', () => {
      const outputs = template.findOutputs('AppSecretArn');
      expect(Object.keys(outputs).length).toBe(1);
    });
  });

  describe('Environment Variables', () => {
    // webコンテナを持つタスク定義を取得するヘルパー
    const getWebContainerDef = () => {
      const resources = template.findResources('AWS::ECS::TaskDefinition');
      for (const taskDef of Object.values(resources)) {
        const containers = taskDef.Properties?.ContainerDefinitions || [];
        const webContainer = containers.find((c: { Name: string }) => c.Name === 'web');
        if (webContainer) return webContainer;
      }
      return null;
    };

    test('タスク定義に本番環境用の環境変数が設定される', () => {
      const containerDef = getWebContainerDef();
      expect(containerDef).not.toBeNull();

      // 主要な環境変数が設定されていることを確認
      const envVars = containerDef.Environment as Array<{ Name: string; Value: string }>;
      const envMap = Object.fromEntries(envVars.map((e) => [e.Name, e.Value]));

      expect(envMap.APP_ENV).toBe('production');
      expect(envMap.APP_DEBUG).toBe('false');
      expect(envMap.LOG_CHANNEL).toBe('stderr');
    });

    test('タスク定義にシークレットが設定される', () => {
      const containerDef = getWebContainerDef();
      expect(containerDef).not.toBeNull();

      // APP_KEYシークレットが設定されていることを確認
      const secrets = containerDef.Secrets as Array<{ Name: string }>;
      const secretNames = secrets.map((s) => s.Name);
      expect(secretNames).toContain('APP_KEY');
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
