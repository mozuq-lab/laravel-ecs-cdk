import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecs_patterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as path from 'path';

export interface LaravelServiceConstructProps {
  vpc: ec2.IVpc;
  cpu?: number;
  memoryLimitMiB?: number;
  desiredCount?: number;
}

export class LaravelServiceConstruct extends Construct {
  public readonly repository: ecr.Repository;
  public readonly cluster: ecs.Cluster;
  public readonly service: ecs.FargateService;

  constructor(scope: Construct, id: string, props: LaravelServiceConstructProps) {
    super(scope, id);

    const { vpc, cpu = 512, memoryLimitMiB = 1024, desiredCount = 1 } = props;

    // ECRリポジトリ
    this.repository = new ecr.Repository(this, 'Repository', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      emptyOnDelete: true,
    });

    // ECSクラスター
    this.cluster = new ecs.Cluster(this, 'Cluster', {
      vpc,
    });

    // Fargateサービス
    // 初期デプロイメントには fromAsset を使用し、
    // 以降はCodePipelineがECRからの新しいイメージでサービスを更新
    const loadBalancedFargateService = new ecs_patterns.ApplicationLoadBalancedFargateService(this, 'Service', {
      cluster: this.cluster,
      cpu,
      desiredCount,
      taskImageOptions: {
        image: ecs.ContainerImage.fromAsset(path.join(__dirname, '../../laravel')),
        containerPort: 80,
        containerName: 'web', // imagedefinitions.jsonにとって重要
      },
      memoryLimitMiB,
      publicLoadBalancer: true,
    });

    // ヘルスチェック
    loadBalancedFargateService.targetGroup.configureHealthCheck({
      path: '/',
    });

    this.service = loadBalancedFargateService.service;
  }
}
