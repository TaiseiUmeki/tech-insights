#!/bin/bash
set -e

BASE_BRANCH="${GITHUB_BASE_REF:-main}"
SHOWCASE_DIR="src/app/dev/ui/_components"
FAILED=false
MISSING=()

# PR で新規追加された UI コンポーネントファイルを取得
ADDED=$(git diff --name-only --diff-filter=A "origin/${BASE_BRANCH}...HEAD" \
  | grep -E '^frontend/src/(shared/ui|widgets)/[^/]+/ui/[A-Z][a-zA-Z]+\.tsx$' \
  || true)

if [ -z "$ADDED" ]; then
  echo "✅ No new UI component files detected."
  exit 0
fi

echo "🔍 New UI component files:"
echo "$ADDED"
echo ""

for filepath in $ADDED; do
  # ファイル名からコンポーネント名を取得（拡張子除く）
  filename=$(basename "$filepath" .tsx)

  # ショーケースに含まれているか確認
  if grep -rqE "\b${filename}\b" "frontend/${SHOWCASE_DIR}" --include="*.tsx" 2>/dev/null; then
    echo "✅ $filename — found in showcase"
  else
    echo "❌ $filename — NOT found in showcase"
    MISSING+=("$filename ($filepath)")
    FAILED=true
  fi
done

if [ "$FAILED" = true ]; then
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "❌ Showcase sync check failed!"
  echo ""
  echo "以下のコンポーネントがショーケース（/dev/ui）に未登録です:"
  for item in "${MISSING[@]}"; do
    echo "  - $item"
  done
  echo ""
  echo "対応方法:"
  echo "  1. 対応する *Showcase.tsx に ShowcaseSection を追加する"
  echo "  2. page.tsx の navSections に id を追加する"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  exit 1
fi

echo ""
echo "✅ All new components are registered in the showcase!"
