#!/bin/bash
# Validate Feature-Sliced Design (FSD) structure

echo "🔍 Validating FSD structure..."

ERRORS=0

# Check if features are in app/(dashboard)/
FEATURES=$(find app/\(dashboard\)/ -maxdepth 1 -type d 2>/dev/null | tail -n +2)

if [ -z "$FEATURES" ]; then
  echo "⚠️  No features found in app/(dashboard)/"
fi

# Required folders in each feature
REQUIRED=("types" "api" "components" "hooks" "ui" "page.tsx")
OPTIONAL=("store" "constants" "utils")

for FEATURE in $FEATURES; do
  FEATURE_NAME=$(basename "$FEATURE")
  echo "Checking $FEATURE_NAME..."
  
  # Check required folders/files
  for REQ in "${REQUIRED[@]}"; do
    if [[ "$REQ" == "page.tsx" ]]; then
      if [ ! -f "$FEATURE/$REQ" ]; then
        echo "  ❌ Missing required file: $REQ"
        ERRORS=$((ERRORS + 1))
      fi
    else
      if [ ! -d "$FEATURE/$REQ" ]; then
        echo "  ❌ Missing required folder: $REQ"
        ERRORS=$((ERRORS + 1))
      fi
    fi
  done
  
  # List any unexpected folders
  VALID_FOLDERS="types|api|components|hooks|ui|store|constants|utils"
  INVALID=$(find "$FEATURE" -maxdepth 1 -type d | tail -n +2 | while read dir; do
    DIRNAME=$(basename "$dir")
    if ! echo "$DIRNAME" | grep -qE "^($VALID_FOLDERS)$"; then
      echo "$DIRNAME"
    fi
  done)
  
  if [ -n "$INVALID" ]; then
    echo "  ⚠️  Unexpected folders: $INVALID"
  fi
done

if [ $ERRORS -eq 0 ]; then
  echo "✅ FSD structure valid"
  exit 0
else
  echo "❌ Found $ERRORS FSD structure violations"
  exit 1
fi
