import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { LaravelSecretsConstruct } from '../../lib/constructs/laravel-secrets';

describe('LaravelSecretsConstruct', () => {
  let template: Template;

  beforeAll(() => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');
    new LaravelSecretsConstruct(stack, 'TestSecrets');
    template = Template.fromStack(stack);
  });

  test('Secrets Managerシークレットが作成される', () => {
    template.resourceCountIs('AWS::SecretsManager::Secret', 1);
  });

  test('シークレットにデフォルトのプレフィックスが設定される', () => {
    template.hasResourceProperties('AWS::SecretsManager::Secret', {
      Name: 'laravel/app-secrets',
    });
  });

  test('シークレットが削除されないポリシーを持つ', () => {
    template.hasResource('AWS::SecretsManager::Secret', {
      DeletionPolicy: 'Retain',
      UpdateReplacePolicy: 'Retain',
    });
  });

  describe('カスタムプレフィックス', () => {
    let customTemplate: Template;

    beforeAll(() => {
      const app = new cdk.App();
      const stack = new cdk.Stack(app, 'CustomStack');
      new LaravelSecretsConstruct(stack, 'TestSecrets', {
        secretNamePrefix: 'myapp',
      });
      customTemplate = Template.fromStack(stack);
    });

    test('カスタムプレフィックスでシークレットが作成される', () => {
      customTemplate.hasResourceProperties('AWS::SecretsManager::Secret', {
        Name: 'myapp/app-secrets',
      });
    });
  });
});
