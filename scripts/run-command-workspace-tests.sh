#!/bin/bash

# Command Workspace Test Runner
# Comprehensive test suite for the Command Workspace architecture

echo "🚀 Command Workspace Test Suite"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test categories
CATEGORIES=(
  "shell:tests/command-workspace/shell"
  "commands:tests/command-workspace/commands"
  "views:tests/command-workspace/views"
  "ai-agents:tests/command-workspace/ai-agents"
  "performance:tests/command-workspace/performance"
  "accessibility:tests/command-workspace/accessibility"
)

# Results tracking
PASSED=0
FAILED=0
SKIPPED=0

# Function to run tests for a category
run_category_tests() {
  local category=$1
  local path=$2
  
  echo -e "${YELLOW}Running $category tests...${NC}"
  echo "Path: $path"
  echo ""
  
  # Run tests with Playwright (use glob pattern)
  if npx playwright test "${path}/" --reporter=list; then
    echo -e "${GREEN}✅ $category tests PASSED${NC}"
    ((PASSED++))
  else
    echo -e "${RED}❌ $category tests FAILED${NC}"
    ((FAILED++))
  fi
  
  echo ""
  echo "--------------------------------"
  echo ""
}

# Check if specific category requested
if [ "$1" ]; then
  case $1 in
    shell|commands|views|ai-agents|performance|accessibility)
      for category_path in "${CATEGORIES[@]}"; do
        IFS=':' read -r category path <<< "$category_path"
        if [ "$category" == "$1" ]; then
          run_category_tests "$category" "$path"
        fi
      done
      ;;
    all)
      for category_path in "${CATEGORIES[@]}"; do
        IFS=':' read -r category path <<< "$category_path"
        run_category_tests "$category" "$path"
      done
      ;;
    *)
      echo "Usage: $0 [shell|commands|views|ai-agents|performance|accessibility|all]"
      exit 1
      ;;
  esac
else
  # Run all tests by default
  for category_path in "${CATEGORIES[@]}"; do
    IFS=':' read -r category path <<< "$category_path"
    run_category_tests "$category" "$path"
  done
fi

# Summary
echo ""
echo "================================"
echo "Test Summary"
echo "================================"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"

if [ $FAILED -eq 0 ]; then
  echo ""
  echo -e "${GREEN}🎉 All Command Workspace tests passed!${NC}"
  exit 0
else
  echo ""
  echo -e "${RED}⚠️ Some tests failed. Please review the output above.${NC}"
  exit 1
fi