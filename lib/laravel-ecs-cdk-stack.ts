import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecs_patterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as path from 'path';

export class LaravelEcsCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // VPC
    const vpc = new ec2.Vpc(this, 'LaravelVpc', {
      maxAzs: 2,
      natGateways: 1, // Cost saving for demo
    });

    // Cluster
    const cluster = new ecs.Cluster(this, 'LaravelCluster', {
      vpc: vpc,
    });

    // Application Load Balanced Fargate Service
    const loadBalancedFargateService = new ecs_patterns.ApplicationLoadBalancedFargateService(this, 'LaravelService', {
      cluster: cluster,
      cpu: 256,
      desiredCount: 1,
      taskImageOptions: {
        image: ecs.ContainerImage.fromAsset(path.join(__dirname, '../laravel')),
        containerPort: 80,
      },
      memoryLimitMiB: 512,
      publicLoadBalancer: true,
    });

    // Health check
    loadBalancedFargateService.targetGroup.configureHealthCheck({
      path: '/',
    });
  }
}
