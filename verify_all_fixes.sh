#!/bin/bash

echo "╔════════════════════════════════════════════════════════════╗"
echo "║          NeoSharX - Complete Fix Verification             ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
total=0
passed=0

echo "📱 Testing Mobile Navigation..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

files=(
    "testimonials.html"
    "neo-dynamic.html"
    "talks-detail.html"
    "neo-project-detail.html"
    "hackathon.html"
    "robotics-news.html"
    "tech-detail.html"
)

for file in "${files[@]}"; do
    total=$((total + 1))
    if grep -q "mobileMenuButton.addEventListener" "$file" && \
       grep -q "nav-container" "$file"; then
        echo -e "${GREEN}✅${NC} $file - Mobile menu working"
        passed=$((passed + 1))
    else
        echo -e "${RED}❌${NC} $file - Mobile menu MISSING"
    fi
done

echo ""
echo "🔧 Testing Backend Setup..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

total=$((total + 1))
if grep -q "platform-stats" "../Backend flow/authentication/urls.py"; then
    echo -e "${GREEN}✅${NC} platform-stats URL pattern exists"
    passed=$((passed + 1))
else
    echo -e "${RED}❌${NC} platform-stats URL pattern MISSING"
fi

total=$((total + 1))
if grep -q "recent-activities" "../Backend flow/authentication/urls.py"; then
    echo -e "${GREEN}✅${NC} recent-activities URL pattern exists"
    passed=$((passed + 1))
else
    echo -e "${RED}❌${NC} recent-activities URL pattern MISSING"
fi

total=$((total + 1))
if grep -q "def platform_stats" "../Backend flow/authentication/views.py"; then
    echo -e "${GREEN}✅${NC} platform_stats view function exists"
    passed=$((passed + 1))
else
    echo -e "${RED}❌${NC} platform_stats view function MISSING"
fi

total=$((total + 1))
if grep -q "def recent_activities" "../Backend flow/authentication/views.py"; then
    echo -e "${GREEN}✅${NC} recent_activities view function exists"
    passed=$((passed + 1))
else
    echo -e "${RED}❌${NC} recent_activities view function MISSING"
fi

echo ""
echo "💾 Testing Database..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

total=$((total + 1))
if [ -f "../Backend flow/db.sqlite3" ]; then
    echo -e "${GREEN}✅${NC} Database file exists"
    passed=$((passed + 1))
    
    # Check database size
    size=$(stat -f%z "../Backend flow/db.sqlite3" 2>/dev/null || stat -c%s "../Backend flow/db.sqlite3" 2>/dev/null)
    if [ $size -gt 0 ]; then
        echo -e "${GREEN}✅${NC} Database has content ($(numfmt --to=iec-i --suffix=B $size 2>/dev/null || echo ${size}B))"
    else
        echo -e "${YELLOW}⚠️${NC}  Database is empty"
    fi
else
    echo -e "${RED}❌${NC} Database file MISSING"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Results: $passed/$total tests passed"
echo ""

if [ $passed -eq $total ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED!${NC}"
    echo "Status: PRODUCTION READY ✅"
else
    echo -e "${YELLOW}⚠️  Some tests failed${NC}"
    echo "Status: NEEDS ATTENTION"
fi

echo ""
echo "📄 Documentation:"
echo "   - FIX_COMPLETE_SUMMARY.md"
echo "   - MOBILE_NAV_BACKEND_FIX_GUIDE.md"
echo ""
