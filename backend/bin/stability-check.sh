#!/usr/bin/env bash
# PredictPix Stability Check Script
# Tests DigitalOcean droplet, Supabase connectivity, and basic API functionality

set -euo pipefail

# Configuration
BACKEND_URL="${BACKEND_URL:-http://127.0.0.1:8001}"
SUPABASE_URL="${SUPABASE_URL:-}"
PI_API_TEST="${PI_API_TEST:-false}"

echo "🔍 PredictPix Stability Check"
echo "=============================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

check_service() {
    local name="$1"
    local url="$2"
    local expected_code="${3:-200}"

    echo -n "Testing $name... "
    if code=$(curl -s -L -o /dev/null -w '%{http_code}' "$url" 2>/dev/null || true); then
        if [ "$code" = "$expected_code" ]; then
            log_info "$name responding correctly ($code)"
            return 0
        else
            log_error "$name returned $code (expected $expected_code)"
            return 1
        fi
    else
        log_error "$name unreachable"
        return 1
    fi
}

# 1. Backend Health Check
echo ""
echo "1. Backend Health Checks"
echo "------------------------"

# Basic connectivity
check_service "Backend API" "$BACKEND_URL/api/health" || exit 1

# OpenAPI schema
check_service "OpenAPI Schema" "$BACKEND_URL/openapi.json" || exit 1

# Markets endpoint
check_service "Markets API" "$BACKEND_URL/api/markets" || exit 1

# Stats endpoint
echo -n "Testing Markets Stats... "
if body=$(curl -fsS "$BACKEND_URL/api/markets/stats-list?limit=1" 2>/dev/null); then
    first=$(printf "%s" "$body" | tr -d '\r\n' | sed -E 's/^[[:space:]]*//; s/(.).*/\1/')
    if [ "$first" = "[" ]; then
        log_info "Markets Stats API working"
    else
        log_error "Markets Stats API returned invalid format"
        exit 1
    fi
else
    log_error "Markets Stats API failed"
    exit 1
fi

# 2. Database Connectivity (via API)
echo ""
echo "2. Database Connectivity"
echo "------------------------"

echo -n "Testing database via API... "
if curl -fsS "$BACKEND_URL/api/markets?limit=1" >/dev/null 2>&1; then
    log_info "Database connectivity OK"
else
    log_error "Database connectivity failed"
    exit 1
fi

# 3. Supabase Connectivity (if configured)
if [ -n "$SUPABASE_URL" ]; then
    echo ""
    echo "3. Supabase Connectivity"
    echo "------------------------"

    check_service "Supabase" "$SUPABASE_URL/rest/v1/" || log_warn "Supabase check failed"
else
    echo ""
    echo "3. Supabase Connectivity"
    echo "------------------------"
    log_warn "SUPABASE_URL not configured, skipping"
fi

# 4. Pi Network API (optional)
if [ "$PI_API_TEST" = "true" ]; then
    echo ""
    echo "4. Pi Network API Test"
    echo "----------------------"

    echo -n "Testing Pi API connectivity... "
    if curl -fsS "https://api.minepi.com/v2/me" -H "Authorization: Key test" >/dev/null 2>&1; then
        log_warn "Pi API responded (may be auth error, but connectivity OK)"
    else
        log_error "Pi API unreachable"
        exit 1
    fi
else
    echo ""
    echo "4. Pi Network API Test"
    echo "----------------------"
    echo "Skipping Pi API test (set PI_API_TEST=true to enable)"
fi

# 5. System Resources
echo ""
echo "5. System Resources"
echo "-------------------"

echo -n "Checking disk usage... "
if disk_usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//'); then
    if [ "$disk_usage" -gt 90 ]; then
        log_error "High disk usage: ${disk_usage}%"
        exit 1
    elif [ "$disk_usage" -gt 75 ]; then
        log_warn "Moderate disk usage: ${disk_usage}%"
    else
        log_info "Disk usage OK: ${disk_usage}%"
    fi
else
    log_warn "Could not check disk usage"
fi

echo -n "Checking memory usage... "
if free_mem=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}'); then
    if [ "$free_mem" -gt 90 ]; then
        log_error "High memory usage: ${free_mem}%"
        exit 1
    elif [ "$free_mem" -gt 75 ]; then
        log_warn "Moderate memory usage: ${free_mem}%"
    else
        log_info "Memory usage OK: ${free_mem}%"
    fi
else
    log_warn "Could not check memory usage"
fi

# 6. Process Check
echo ""
echo "6. Process Status"
echo "-----------------"

echo -n "Checking for backend processes... "
if pgrep -f "uvicorn\|gunicorn" >/dev/null 2>&1; then
    log_info "Backend process running"
else
    log_error "No backend process found"
    exit 1
fi

echo -n "Checking for database connections... "
if netstat -tln 2>/dev/null | grep ":5432 " >/dev/null; then
    log_info "Database port accessible"
else
    log_warn "Database port not found (may be remote)"
fi

# Final Summary
echo ""
echo "🎉 Stability Check Complete!"
echo "============================"
log_info "All critical systems operational"
echo ""
echo "Next steps:"
echo "- Monitor logs: tail -f /opt/predictpix/server.log"
echo "- Check metrics: curl $BACKEND_URL/api/health"
echo "- Beta testing ready when Pi SDK migration completes"

exit 0
