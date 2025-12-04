#!/bin/bash
#
# CodePipeline用のソースZipを作成するスクリプト
# 使用方法: ./scripts/create-source-zip.sh
#

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LARAVEL_DIR="$PROJECT_ROOT/laravel"
OUTPUT_FILE="$PROJECT_ROOT/source.zip"

# 色付き出力
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}=== CodePipeline用ソースZip作成 ===${NC}"

# 既存のZipファイルを削除
if [ -f "$OUTPUT_FILE" ]; then
  rm "$OUTPUT_FILE"
  echo "既存のsource.zipを削除しました"
fi

cd "$LARAVEL_DIR"

# Zipを作成（不要なファイルを除外）
zip -r "$OUTPUT_FILE" . \
  -x "vendor/*" \
  -x "node_modules/*" \
  -x ".git/*" \
  -x ".env" \
  -x ".env.backup" \
  -x ".env.production" \
  -x "storage/logs/*" \
  -x "storage/framework/cache/data/*" \
  -x "storage/framework/sessions/*" \
  -x "storage/framework/views/*" \
  -x "bootstrap/cache/*" \
  -x ".phpunit.result.cache" \
  -x "tests/*" \
  -x ".DS_Store" \
  -x "*.log"

# ファイルサイズを表示
SIZE=$(du -h "$OUTPUT_FILE" | cut -f1)

echo ""
echo -e "${GREEN}作成完了!${NC}"
echo "ファイル: $OUTPUT_FILE"
echo "サイズ: $SIZE"
echo ""
echo "S3へのアップロード:"
echo "  aws s3 cp $OUTPUT_FILE s3://<SourceBucketName>/source.zip"
