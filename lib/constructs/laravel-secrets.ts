import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';

export interface LaravelSecretsConstructProps {
  /**
   * シークレット名のプレフィックス
   * @default 'laravel'
   */
  secretNamePrefix?: string;
}

export class LaravelSecretsConstruct extends Construct {
  public readonly appSecret: secretsmanager.Secret;

  constructor(scope: Construct, id: string, props: LaravelSecretsConstructProps = {}) {
    super(scope, id);

    const { secretNamePrefix = 'laravel' } = props;

    // Laravelアプリケーション用シークレット
    // APP_KEY, DB接続情報などを格納
    this.appSecret = new secretsmanager.Secret(this, 'AppSecret', {
      secretName: `${secretNamePrefix}/app-secrets`,
      description: 'Laravel application secrets (APP_KEY, DB credentials, etc.)',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          APP_KEY: '', // デプロイ後に手動で設定が必要
        }),
        generateStringKey: 'GENERATED_SECRET',
        excludePunctuation: true,
      },
      removalPolicy: cdk.RemovalPolicy.RETAIN, // 機密情報は削除しない
    });
  }
}
