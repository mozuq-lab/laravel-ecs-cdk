import * as cdk from 'aws-cdk-lib';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import { Construct } from 'constructs';
import { NetworkConstruct } from './constructs/network';
import { LaravelServiceConstruct } from './constructs/laravel-service';
import { LaravelSecretsConstruct } from './constructs/laravel-secrets';
import { PipelineConstruct } from './constructs/pipeline';

export class LaravelEcsCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ネットワーク層
    const network = new NetworkConstruct(this, 'Network', {
      maxAzs: 2,
      natGateways: 1, // デモ用のコスト削減
    });

    // シークレット層
    const secrets = new LaravelSecretsConstruct(this, 'Secrets');

    // アプリケーション層
    const laravelService = new LaravelServiceConstruct(this, 'Laravel', {
      vpc: network.vpc,
      cpu: 512,
      memoryLimitMiB: 1024,
      desiredCount: 1,
      // 非機密の環境変数
      environment: {
        APP_NAME: 'Laravel',
        APP_ENV: 'production',
        APP_DEBUG: 'false',
        LOG_CHANNEL: 'stderr',
        LOG_LEVEL: 'warning',
        DB_CONNECTION: 'sqlite',
        SESSION_DRIVER: 'file',
        CACHE_STORE: 'file',
      },
      // 機密情報はSecrets Managerから取得
      secrets: {
        APP_KEY: ecs.Secret.fromSecretsManager(secrets.appSecret, 'APP_KEY'),
      },
    });

    // CI/CD層
    const pipeline = new PipelineConstruct(this, 'Pipeline', {
      repository: laravelService.repository,
      service: laravelService.service,
    });

    // 出力
    new cdk.CfnOutput(this, 'SourceBucketName', {
      value: pipeline.sourceBucket.bucketName,
      description: 'S3 bucket for source code uploads',
    });

    new cdk.CfnOutput(this, 'AppSecretArn', {
      value: secrets.appSecret.secretArn,
      description: 'Secrets Manager ARN - Set APP_KEY here after deployment',
    });
  }
}
