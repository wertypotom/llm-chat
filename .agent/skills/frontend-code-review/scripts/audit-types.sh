#!/bin/bash
# Audit TypeScript files for 'any' type usage

echo "🔍 Auditing TypeScript for 'any' types..."

FOUND=0

# Search for 'any' keyword in TypeScript files
# Exclude: comments, type names containing 'any' (like 'Company'), node_modules
RESULTS=$(grep -r \
  --include="*.ts" \
  --include="*.tsx" \
  --exclude-dir="node_modules" \
  --exclude-dir=".next" \
  --exclude-dir="dist" \
  -n ": any" \
  app/ shared/ 2>/dev/null)

if [ -n "$RESULTS" ]; then
  echo "❌ Found 'any' type usage:"
  echo "$RESULTS"
  FOUND=1
else
  echo "✅ No 'any' types detected - type safety maintained"
fi

exit $FOUND
