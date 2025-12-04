import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { LaravelServiceConstruct } from '../../lib/constructs/laravel-service';

describe('LaravelServiceConstruct', () => {
  let stack: cdk.Stack;
  let vpc: ec2.Vpc;

  beforeEach(() => {
    const app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack');
    vpc = new ec2.Vpc(stack, 'Vpc');
  });

  test('デフォルト設定でサービスが作成される', () => {
    new LaravelServiceConstruct(stack, 'Laravel', { vpc });

    const template = Template.fromStack(stack);

    template.resourceCountIs('AWS::ECS::Cluster', 1);
    template.resourceCountIs('AWS::ECS::Service', 1);
    template.resourceCountIs('AWS::ECR::Repository', 1);
    template.hasResourceProperties('AWS::ECS::TaskDefinition', {
      Cpu: '512',
      Memory: '1024',
    });
  });

  test('カスタムリソース設定が適用される', () => {
    new LaravelServiceConstruct(stack, 'Laravel', {
      vpc,
      cpu: 1024,
      memoryLimitMiB: 2048,
      desiredCount: 2,
    });

    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::ECS::TaskDefinition', {
      Cpu: '1024',
      Memory: '2048',
    });
    template.hasResourceProperties('AWS::ECS::Service', {
      DesiredCount: 2,
    });
  });

  test('コンテナ名がwebに設定される', () => {
    new LaravelServiceConstruct(stack, 'Laravel', { vpc });

    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::ECS::TaskDefinition', {
      ContainerDefinitions: [
        {
          Name: 'web',
          PortMappings: [
            {
              ContainerPort: 80,
              Protocol: 'tcp',
            },
          ],
        },
      ],
    });
  });

  test('ALBが作成される', () => {
    new LaravelServiceConstruct(stack, 'Laravel', { vpc });

    const template = Template.fromStack(stack);

    template.resourceCountIs('AWS::ElasticLoadBalancingV2::LoadBalancer', 1);
    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
      Scheme: 'internet-facing',
      Type: 'application',
    });
  });

  test('プロパティが公開される', () => {
    const service = new LaravelServiceConstruct(stack, 'Laravel', { vpc });

    expect(service.repository).toBeDefined();
    expect(service.cluster).toBeDefined();
    expect(service.service).toBeDefined();
  });
});
