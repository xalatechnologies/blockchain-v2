#!/bin/bash

echo "🔍 Analyzing folder structure..."
echo ""

echo "=== Frontend Folder ==="
if [ -d "frontend" ]; then
  echo "Size: $(du -sh frontend 2>/dev/null | cut -f1)"
  echo "Files: $(find frontend -type f 2>/dev/null | wc -l)"
fi
echo ""

echo "=== Services Folder ==="
if [ -d "services" ]; then
  echo "Size: $(du -sh services 2>/dev/null | cut -f1)"
  echo "Files: $(find services -type f 2>/dev/null | wc -l)"
fi
echo ""

echo "=== Validator Folders ==="
for dir in validator validator-1 validator-2 validator-3; do
  if [ -d "$dir" ]; then
    echo "$dir: $(du -sh $dir 2>/dev/null | cut -f1)"
  fi
done
echo ""

echo "=== Build Folders ==="
echo "artifacts/: $(du -sh artifacts 2>/dev/null | cut -f1)"
echo "cache/: $(du -sh cache 2>/dev/null | cut -f1)"
echo "deployments/: $(du -sh deployments 2>/dev/null | cut -f1)"
echo ""

echo "=== Public Folder ==="
if [ -d "public" ]; then
  echo "Size: $(du -sh public 2>/dev/null | cut -f1)"
  ls public/ 2>/dev/null | head -5
fi
