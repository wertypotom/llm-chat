#!/bin/bash
# Check for hardcoded English strings in TypeScript/React files

echo "🔍 Checking for hardcoded strings..."

# Find JSX/TSX files with potential hardcoded strings
# Exclude translation calls t('...')
# Look for quotes with English text

FOUND=0

# Search pattern: strings in quotes that look like English text (contain spaces and capital letters)
# Exclude: translation functions, imports, type definitions, console statements
RESULTS=$(grep -r \
  --include="*.tsx" \
  --include="*.ts" \
 --exclude-dir="node_modules" \
  --exclude-dir=".next" \
  --exclude-dir="dist" \
  -P '["'\''][A-Z][a-zA-Z\s]{3,}["'\'']' \
  app/ shared/ 2>/dev/null | \
  grep -v "import " | \
  grep -v "export " | \
  grep -v "t(" | \
  grep -v "console\." | \
  grep -v "// " | \
  grep -v "type " | \
  grep -v "interface ")

if [ -n "$RESULTS" ]; then
  echo "❌ Found potential hardcoded strings:"
  echo "$RESULTS"
  FOUND=1
else
  echo "✅ No hardcoded strings detected"
fi

exit $FOUND
