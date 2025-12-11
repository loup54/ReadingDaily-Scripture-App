#!/bin/bash

# Reset password for test@readingdaily.dev using Firebase Auth REST API
# Run with: bash scripts/reset-test-password.sh

API_KEY="AIzaSyDJIfZfHCif6ohNG_J-_NkaNPY2A-Ek2fc"
EMAIL="test@readingdaily.dev"
NEW_PASSWORD="TestPassword123!"

echo "🔐 Resetting password for $EMAIL..."
echo ""

# Get the user's Firebase UID first
echo "📝 Step 1: Looking up user..."
LOOKUP_RESPONSE=$(curl -s -X POST "https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=$API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"email\":[\"$EMAIL\"]}")

echo "Response: $LOOKUP_RESPONSE"
echo ""

# Extract UID from response
UID=$(echo "$LOOKUP_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('users', [{}])[0].get('localId', ''))" 2>/dev/null)

if [ -z "$UID" ]; then
  echo "❌ Error: Could not find user $EMAIL"
  exit 1
fi

echo "✅ Found user UID: $UID"
echo ""

# Update password using Firebase Admin REST API endpoint
echo "🔧 Step 2: Updating password..."
UPDATE_RESPONSE=$(curl -s -X POST "https://identitytoolkit.googleapis.com/v1/accounts:update?key=$API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"localId\":\"$UID\",\"password\":\"$NEW_PASSWORD\"}")

echo "Response: $UPDATE_RESPONSE"
echo ""

# Check if successful
if echo "$UPDATE_RESPONSE" | grep -q "\"localId\""; then
  echo "✅ Password updated successfully!"
  echo ""
  echo "📝 Test credentials:"
  echo "   Email: $EMAIL"
  echo "   Password: $NEW_PASSWORD"
  echo ""
  echo "✨ You can now sign in with these credentials in the app."
else
  echo "❌ Error updating password. Check the response above for details."
  exit 1
fi
