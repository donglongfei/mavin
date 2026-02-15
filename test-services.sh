#!/bin/bash
# Unit Tests for Mavin Service Scripts
# Tests start-services.sh and stop-services.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
START_SCRIPT="$SCRIPT_DIR/start-services.sh"
STOP_SCRIPT="$SCRIPT_DIR/stop-services.sh"

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Test result tracking
print_test_header() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  TEST: $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

assert_true() {
    local test_name=$1
    local command=$2

    TESTS_RUN=$((TESTS_RUN + 1))

    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}[PASS]${NC} $test_name"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        echo -e "${RED}[FAIL]${NC} $test_name"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

assert_false() {
    local test_name=$1
    local command=$2

    TESTS_RUN=$((TESTS_RUN + 1))

    if ! eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}[PASS]${NC} $test_name"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        echo -e "${RED}[FAIL]${NC} $test_name"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

assert_file_exists() {
    local test_name=$1
    local file=$2

    TESTS_RUN=$((TESTS_RUN + 1))

    if [ -f "$file" ]; then
        echo -e "${GREEN}[PASS]${NC} $test_name"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        echo -e "${RED}[FAIL]${NC} $test_name"
        echo -e "  Expected file: $file"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

assert_executable() {
    local test_name=$1
    local file=$2

    TESTS_RUN=$((TESTS_RUN + 1))

    if [ -x "$file" ]; then
        echo -e "${GREEN}[PASS]${NC} $test_name"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        echo -e "${RED}[FAIL]${NC} $test_name"
        echo -e "  File not executable: $file"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

# Print test suite header
echo ""
echo "======================================"
echo "  Mavin Service Scripts - Unit Tests"
echo "======================================"
echo ""

# Test 1: Script Files Exist
print_test_header "Script Files Existence"
assert_file_exists "start-services.sh exists" "$START_SCRIPT"
assert_file_exists "stop-services.sh exists" "$STOP_SCRIPT"

# Test 2: Scripts are Executable
print_test_header "Script Executability"
assert_executable "start-services.sh is executable" "$START_SCRIPT"
assert_executable "stop-services.sh is executable" "$STOP_SCRIPT"

# Test 3: Scripts Have Valid Bash Syntax
print_test_header "Script Syntax Validation"
assert_true "start-services.sh has valid syntax" "bash -n $START_SCRIPT"
assert_true "stop-services.sh has valid syntax" "bash -n $STOP_SCRIPT"

# Test 4: Docker Availability
print_test_header "Docker Environment"
assert_true "Docker is installed" "command -v docker"
assert_true "Docker daemon is running" "docker ps > /dev/null 2>&1"
assert_true "ASR Docker image exists" "docker images | grep -q 'local_asr_server'"

# Test 5: Docker Container Check
print_test_header "Docker Container Status"
if docker ps -a | grep -q "local_asr_server"; then
    echo -e "${GREEN}[PASS]${NC} ASR container exists"
    TESTS_PASSED=$((TESTS_PASSED + 1))

    # Check if container is running
    if docker ps | grep -q "local_asr_server"; then
        echo -e "${YELLOW}[INFO]${NC} ASR container is currently running"
    else
        echo -e "${YELLOW}[INFO]${NC} ASR container is stopped"
    fi
else
    echo -e "${YELLOW}[WARN]${NC} ASR container does not exist (will be created on first start)"
fi
TESTS_RUN=$((TESTS_RUN + 1))

# Test 6: Required Directories
print_test_header "Directory Structure"
assert_true "backend directory exists" "[ -d $SCRIPT_DIR/backend ]"
assert_true "backend/python directory exists" "[ -d $SCRIPT_DIR/backend/python ]"
assert_true "infra/docker directory exists" "[ -d $SCRIPT_DIR/infra/docker ]"

# Test 7: Backend Dependencies
print_test_header "Backend Environment"
assert_true "Node.js is installed" "command -v node"
assert_true "pnpm is installed" "command -v pnpm"
assert_true "Python3 is installed" "command -v python3"

# Test 8: Backend Files
print_test_header "Backend Files"
assert_file_exists "backend/package.json exists" "$SCRIPT_DIR/backend/package.json"
assert_file_exists "backend/src/index.ts exists" "$SCRIPT_DIR/backend/src/index.ts"

# Test 9: Frontend Files
print_test_header "Frontend Files"
assert_file_exists "apps/web/package.json exists" "$SCRIPT_DIR/apps/web/package.json"
assert_true "apps/web directory exists" "[ -d $SCRIPT_DIR/apps/web/client ]"

# Test 10: Python Scripts
print_test_header "Python Service Scripts"
if [ -f "$SCRIPT_DIR/backend/python/mt_litetts_ws_server.py" ]; then
    echo -e "${GREEN}[PASS]${NC} TTS service script exists"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${YELLOW}[WARN]${NC} TTS service script not found (optional)"
fi
TESTS_RUN=$((TESTS_RUN + 1))

# Test 11: OpenClaw CLI
print_test_header "OpenClaw Integration"
if command -v openclaw &> /dev/null; then
    echo -e "${GREEN}[PASS]${NC} OpenClaw CLI is available"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${YELLOW}[WARN]${NC} OpenClaw CLI not found in PATH (optional)"
fi
TESTS_RUN=$((TESTS_RUN + 1))

# Test 12: Port Availability (before starting services)
print_test_header "Port Availability Check"

check_port_free() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 1  # Port is in use
    else
        return 0  # Port is free
    fi
}

if check_port_free 8002; then
    echo -e "${GREEN}[PASS]${NC} Port 8002 (Backend) is available"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${YELLOW}[WARN]${NC} Port 8002 (Backend) is in use"
fi
TESTS_RUN=$((TESTS_RUN + 1))

if check_port_free 10095; then
    echo -e "${GREEN}[PASS]${NC} Port 10095 (ASR) is available"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${YELLOW}[WARN]${NC} Port 10095 (ASR) is in use"
fi
TESTS_RUN=$((TESTS_RUN + 1))

# Test 12: Script Helper Functions
print_test_header "Script Functions"

# Test that start script contains required functions
assert_true "start-services.sh has check_port function" "grep -q 'check_port()' $START_SCRIPT"
assert_true "start-services.sh has wait_for_port function" "grep -q 'wait_for_port()' $START_SCRIPT"

# Test that stop script contains required functions
assert_true "stop-services.sh has print_status function" "grep -q 'print_status()' $STOP_SCRIPT"

# Test 13: Docker Image File
print_test_header "ASR Docker Image"
ASR_IMAGE="$SCRIPT_DIR/infra/docker/m1000_local_asr_server.tar"
if [ -f "$ASR_IMAGE" ]; then
    echo -e "${GREEN}[PASS]${NC} ASR Docker image file exists"
    TESTS_PASSED=$((TESTS_PASSED + 1))

    # Check file size (should be substantial)
    IMAGE_SIZE=$(du -h "$ASR_IMAGE" | cut -f1)
    echo -e "${YELLOW}[INFO]${NC} ASR image size: $IMAGE_SIZE"
else
    echo -e "${YELLOW}[WARN]${NC} ASR Docker image file not found at: $ASR_IMAGE"
    echo -e "${YELLOW}[INFO]${NC} Image may already be loaded in Docker"
fi
TESTS_RUN=$((TESTS_RUN + 1))

# Test 14: Log and PID Directories
print_test_header "Runtime Directories"
if [ -d "$SCRIPT_DIR/logs" ] || [ -d "$SCRIPT_DIR/.pids" ]; then
    echo -e "${YELLOW}[INFO]${NC} Runtime directories exist (from previous runs)"
else
    echo -e "${YELLOW}[INFO]${NC} Runtime directories will be created on startup"
fi

# Print test summary
echo ""
echo "======================================"
echo "  Test Summary"
echo "======================================"
echo ""
echo "  Tests Run:    $TESTS_RUN"
echo -e "  Tests Passed: ${GREEN}$TESTS_PASSED${NC}"

if [ $TESTS_FAILED -gt 0 ]; then
    echo -e "  Tests Failed: ${RED}$TESTS_FAILED${NC}"
else
    echo -e "  Tests Failed: $TESTS_FAILED"
fi

echo ""

# Calculate pass rate
if [ $TESTS_RUN -gt 0 ]; then
    PASS_RATE=$((TESTS_PASSED * 100 / TESTS_RUN))
    echo "  Pass Rate:    $PASS_RATE%"
fi

echo ""
echo "======================================"

# Exit with appropriate code
if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}All critical tests passed!${NC}"
    echo ""
    echo "Ready to start services:"
    echo "  ./start-services.sh"
    exit 0
else
    echo -e "${RED}Some tests failed!${NC}"
    echo ""
    echo "Please fix the issues before starting services."
    exit 1
fi
