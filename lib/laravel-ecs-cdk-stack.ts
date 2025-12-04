import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecs_patterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as path from 'path';

export class LaravelEcsCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // VPC
    const vpc = new ec2.Vpc(this, 'LaravelVpc', {
      maxAzs: 2,
      natGateways: 1, // デモ用のコスト削減
    });

    // ソースコード用S3バケット
    const sourceBucket = new s3.Bucket(this, 'SourceBucket', {
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // ECRリポジトリ
    const repository = new ecr.Repository(this, 'LaravelRepository', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      emptyOnDelete: true,
    });

    // ECSクラスター
    const cluster = new ecs.Cluster(this, 'LaravelCluster', {
      vpc: vpc,
    });

    // Fargateサービス (ECRイメージを使用)
    // 最初はプレースホルダーを使用するか、アセットからビルドしてサービスの作成が機能するようにします。
    // CodePipelineフローの場合、通常はサービスが何かで開始されることを望みます。
    // パイプラインで管理したいため、リポジトリを使用できます。
    // 初回のデプロイメントではリポジトリは空なので、ブートストラップするかContainerImage.fromAssetを使用する必要がありますが、
    // 更新にはECRに切り替えます。
    // 「Zipアップロードでデプロイをトリガーする」というリクエストに合わせてシンプルかつ一貫性を保つために、
    // サービスがECRイメージを使用するように定義しますが、「初回実行」の問題に対処する必要があります。
    // 一般的なパターンは、ダミーイメージをプッシュするか、初期スタックにfromAssetを使用することですが、
    // `fromEcrRepository`は、即座にデプロイする場合にイメージが存在することを期待します。
    //
    // 代替案: 最初は `ContainerImage.fromAsset` を使用しますが、これはパイプラインのECRにリンクしません。
    //
    // 「パイプラインがイメージをビルドする」フローに厳密に従いたい場合は、
    // プレースホルダーとして `ContainerImage.fromRegistry('amazon/amazon-ecs-sample')` を使用しましょう。
    // または、CDK管理のECRにビルドしてプッシュする `fromAsset` を使用することもできますが、
    // ユーザーは特定のECRとパイプラインを望んでいます。
    //
    // 初期状態には `fromAsset` を使用し、パイプラインのデプロイアクションでイメージを上書きしてみましょう。
    // 実際には、`ApplicationLoadBalancedFargateService` を使用すると、CDKコード内でイメージソースタイプを簡単に交換することが難しく、
    // ドリフトが発生する可能性があります。
    //
    // このタスクにとってより良いアプローチ:
    // 1. ECRを定義する。
    // 2. このECRにプッシュするためのCodeBuildを定義する。
    // 3. `ContainerImage.fromEcrRepository(repository, 'latest')` を使用してサービスを定義する。
    // 注意: 'latest' が存在しない場合、デプロイメントは失敗します。
    //
    // 初回デプロイでの失敗を避けるために:
    // 実質的に同じこと（ビルドとプッシュ）を行う `ContainerImage.fromAsset` を使用できますが、
    // ユーザーは「Zipアップロードがトリガー...」を望んでいます。
    //
    // 標準的なパターンを使用しましょう:
    // CDKスタックがパイプラインを定義します。
    // サービスはECRに依存します。
    // ユーザーが初期イメージをプッシュする必要があるか、パイプラインが実行されるまでサービスが安定しない可能性があることを許容すると想定します。
    // または、初期コードに `ContainerImage.fromAsset` を使用し、パイプラインがECRからの新しいイメージでサービスを更新するようにします。
    // しかし、`ECS Deploy Action` は新しいイメージURIでタスク定義を更新します。
    // したがって、`fromAsset` は安全な出発点です。

    const loadBalancedFargateService = new ecs_patterns.ApplicationLoadBalancedFargateService(this, 'LaravelService', {
      cluster: cluster,
      cpu: 512,
      desiredCount: 1,
      taskImageOptions: {
        image: ecs.ContainerImage.fromAsset(path.join(__dirname, '../laravel')), // 初期デプロイメント
        containerPort: 80,
        containerName: 'web', // imagedefinitions.jsonにとって重要
      },
      memoryLimitMiB: 1024,
      publicLoadBalancer: true,
    });

    // ヘルスチェック
    loadBalancedFargateService.targetGroup.configureHealthCheck({
      path: '/',
    });

    // CodeBuildプロジェクト
    const project = new codebuild.PipelineProject(this, 'LaravelBuildProject', {
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        privileged: true,
        environmentVariables: {
          AWS_ACCOUNT_ID: { value: cdk.Stack.of(this).account },
          AWS_DEFAULT_REGION: { value: cdk.Stack.of(this).region },
          IMAGE_REPO_NAME: { value: repository.repositoryName },
        },
      },
      buildSpec: codebuild.BuildSpec.fromSourceFilename('buildspec.yml'),
    });

    // CodeBuildにECRへのアクセス権限を付与
    repository.grantPullPush(project);

    // CodePipeline
    const sourceOutput = new codepipeline.Artifact();
    const buildOutput = new codepipeline.Artifact();

    new codepipeline.Pipeline(this, 'LaravelPipeline', {
      stages: [
        {
          stageName: 'Source',
          actions: [
            new codepipeline_actions.S3SourceAction({
              actionName: 'S3Source',
              bucket: sourceBucket,
              bucketKey: 'source.zip',
              output: sourceOutput,
            }),
          ],
        },
        {
          stageName: 'Build',
          actions: [
            new codepipeline_actions.CodeBuildAction({
              actionName: 'CodeBuild',
              project: project,
              input: sourceOutput,
              outputs: [buildOutput],
            }),
          ],
        },
        {
          stageName: 'Deploy',
          actions: [
            new codepipeline_actions.EcsDeployAction({
              actionName: 'ECSDeploy',
              service: loadBalancedFargateService.service,
              input: buildOutput,
            }),
          ],
        },
      ],
    });

    // S3バケット名を出力
    new cdk.CfnOutput(this, 'SourceBucketName', {
      value: sourceBucket.bucketName,
    });
  }
}
