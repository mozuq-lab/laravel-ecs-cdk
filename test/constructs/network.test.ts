import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { NetworkConstruct } from '../../lib/constructs/network';

describe('NetworkConstruct', () => {
  test('デフォルト設定でVPCが作成される', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');

    new NetworkConstruct(stack, 'Network');

    const template = Template.fromStack(stack);

    template.resourceCountIs('AWS::EC2::VPC', 1);
    template.resourceCountIs('AWS::EC2::NatGateway', 1);
  });

  test('カスタム設定でVPCが作成される', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');

    new NetworkConstruct(stack, 'Network', {
      maxAzs: 3,
      natGateways: 2,
    });

    const template = Template.fromStack(stack);

    template.resourceCountIs('AWS::EC2::VPC', 1);
    template.resourceCountIs('AWS::EC2::NatGateway', 2);
  });

  test('VPCプロパティが公開される', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');

    const network = new NetworkConstruct(stack, 'Network');

    expect(network.vpc).toBeDefined();
  });
});
