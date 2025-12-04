# Laravel ECS CDK Project

AWS CDKを使用して、LaravelアプリケーションをAmazon ECS (Fargate) 上で実行するためのプロジェクトです。
CodePipelineを使用したCI/CDパイプラインも構築します。

## アーキテクチャ

- **Compute**: Amazon ECS (Fargate)
- **Network**: VPC (2 AZ), ALB (Application Load Balancer)
- **Database**: なし (デモ用のためステートレス構成)
- **CI/CD**: AWS CodePipeline, AWS CodeBuild, Amazon ECR, Amazon S3
- **Web Server**: Nginx + PHP-FPM (Supervisor管理)

## 前提条件

- Node.js (v18+)
- Docker
- AWS CLI (設定済みであること)
- AWS CDK Toolkit (`npm install -g aws-cdk`)

## セットアップ

1. 依存関係のインストール
   ```bash
   npm install
   ```

2. Laravelプロジェクトの依存関係インストール (ローカル開発用)
   ```bash
   cd laravel
   composer install
   cd ..
   ```

## ローカルでの動作確認

Dockerを使用してローカルでアプリケーションを起動できます。

```bash
# イメージのビルド
docker build -t laravel-local ./laravel

# コンテナの起動 (ポート8081でアクセス)
docker run -d -p 8081:80 --name laravel-app laravel-local
```

ブラウザで `http://localhost:8081` にアクセスしてください。

> **注意**: デモ環境のため、セッションドライバは `file` に設定されています。

## デプロイ手順

### 1. インフラストラクチャのデプロイ

CDKを使用してAWSリソースをデプロイします。

```bash
npx aws-cdk deploy
```

デプロイが完了すると、以下の出力が表示されます。
- `LaravelEcsCdkStack.SourceBucketName`: ソースコードアップロード用のS3バケット名
- `LaravelEcsCdkStack.LaravelServiceLoadBalancerDNS...`: アプリケーションのURL (ALB)

### 2. アプリケーションのデプロイ (パイプライン始動)

ソースコードをZip圧縮してS3にアップロードすることで、CodePipelineがトリガーされます。

```bash
# ソースZipを作成（vendor/node_modules等は除外される）
./scripts/create-source-zip.sh

# S3にアップロード (バケット名はCDK出力のものに置き換えてください)
aws s3 cp source.zip s3://<SourceBucketName>/source.zip
```

アップロード後、AWSコンソールでCodePipelineを確認すると、ビルドとデプロイが進行します。
完了後、ALBのURLにアクセスして動作を確認してください。

## ディレクトリ構成

- `bin/`: CDKのエントリーポイント
- `lib/`: CDKスタック定義 (インフラストラクチャコード)
- `laravel/`: Laravelアプリケーションコード
    - `Dockerfile`: コンテナ定義
    - `buildspec.yml`: CodeBuild定義
    - `nginx/`: Nginx設定
