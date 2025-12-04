#!/bin/bash
#
# MFA認証スクリプト
# 使用方法: source ./scripts/mfa-login.sh
#

set -e

# 設定（環境に合わせて変更してください）
MFA_SERIAL="${AWS_MFA_SERIAL:-}"
PROFILE="${AWS_PROFILE:-default}"
DURATION="${AWS_SESSION_DURATION:-43200}"  # 12時間（秒）

# 色付き出力
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== AWS MFA 認証 ===${NC}"

# MFAシリアル番号の確認
if [ -z "$MFA_SERIAL" ]; then
  # プロファイルからユーザー情報を取得してMFAシリアルを推測
  ACCOUNT_ID=$(aws sts get-caller-identity --profile "$PROFILE" --query 'Account' --output text 2>/dev/null || true)
  USER_NAME=$(aws sts get-caller-identity --profile "$PROFILE" --query 'Arn' --output text 2>/dev/null | grep -oE '[^/]+$' || true)

  if [ -n "$ACCOUNT_ID" ] && [ -n "$USER_NAME" ]; then
    MFA_SERIAL="arn:aws:iam::${ACCOUNT_ID}:mfa/${USER_NAME}"
    echo -e "MFAデバイス: ${GREEN}${MFA_SERIAL}${NC}"
    read -p "このMFAデバイスを使用しますか？ [Y/n]: " CONFIRM
    if [[ "$CONFIRM" =~ ^[Nn] ]]; then
      read -p "MFAシリアル番号を入力: " MFA_SERIAL
    fi
  else
    echo -e "${RED}エラー: MFAシリアル番号を特定できません${NC}"
    echo "環境変数 AWS_MFA_SERIAL を設定するか、スクリプト内で設定してください"
    echo "例: export AWS_MFA_SERIAL=arn:aws:iam::123456789012:mfa/your-user"
    return 1 2>/dev/null || exit 1
  fi
fi

# MFAコード入力
read -p "MFAコードを入力: " MFA_CODE

if [ -z "$MFA_CODE" ]; then
  echo -e "${RED}エラー: MFAコードが入力されていません${NC}"
  return 1 2>/dev/null || exit 1
fi

echo "認証情報を取得中..."

# 一時認証情報を取得
CREDS=$(aws sts get-session-token \
  --serial-number "$MFA_SERIAL" \
  --token-code "$MFA_CODE" \
  --duration-seconds "$DURATION" \
  --profile "$PROFILE" \
  --output json 2>&1)

if [ $? -ne 0 ]; then
  echo -e "${RED}エラー: 認証に失敗しました${NC}"
  echo "$CREDS"
  return 1 2>/dev/null || exit 1
fi

# 環境変数に設定
export AWS_ACCESS_KEY_ID=$(echo "$CREDS" | jq -r '.Credentials.AccessKeyId')
export AWS_SECRET_ACCESS_KEY=$(echo "$CREDS" | jq -r '.Credentials.SecretAccessKey')
export AWS_SESSION_TOKEN=$(echo "$CREDS" | jq -r '.Credentials.SessionToken')

# プロファイル設定をクリア（一時認証情報を優先させるため）
unset AWS_PROFILE

# 有効期限を取得
EXPIRATION=$(echo "$CREDS" | jq -r '.Credentials.Expiration')

echo ""
echo -e "${GREEN}認証成功!${NC}"
echo -e "有効期限: ${YELLOW}${EXPIRATION}${NC}"
echo ""
echo "以下のコマンドが使用可能です:"
echo "  npx aws-cdk deploy"
echo "  npx aws-cdk diff"
echo "  aws s3 ls"
echo ""
