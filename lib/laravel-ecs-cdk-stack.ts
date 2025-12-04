import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { NetworkConstruct } from './constructs/network';
import { LaravelServiceConstruct } from './constructs/laravel-service';
import { PipelineConstruct } from './constructs/pipeline';

export class LaravelEcsCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ネットワーク層
    const network = new NetworkConstruct(this, 'Network', {
      maxAzs: 2,
      natGateways: 1, // デモ用のコスト削減
    });

    // アプリケーション層
    const laravelService = new LaravelServiceConstruct(this, 'Laravel', {
      vpc: network.vpc,
      cpu: 512,
      memoryLimitMiB: 1024,
      desiredCount: 1,
    });

    // CI/CD層
    const pipeline = new PipelineConstruct(this, 'Pipeline', {
      repository: laravelService.repository,
      service: laravelService.service,
    });

    // S3バケット名を出力
    new cdk.CfnOutput(this, 'SourceBucketName', {
      value: pipeline.sourceBucket.bucketName,
    });
  }
}
