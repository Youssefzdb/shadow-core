---
name: e5tira9-recon
description: "Reconnaissance otomatique — nmap, subfinder, whatweb, gobuster, dig. Phase lewwla fel e5tira9. Parle b Darija."
---

# E5tira9 Recon — Reconnaissance Autonome

Skill mte3 reconnaissance profonde. Bech tlawej 3la kol Hajja: ports, subdomains, tech stack, directories, DNS.

## Qawa3d

1. MATSE2EL CHI HAJA — inti tdecide w t'act
2. Kol action, exporti feed line:
   `[FEED] HH:MM:SS | RECON | <action> | <result>`
3. Bech te5dem le SAE3AT — mch 5 dolar
4. Loota ma tlqot chi Hajja, pivot w jarrab technique okhra

## Workflow (kollha otomatique)

### Step 1: Docker Init
```
shannon_docker_init
[FEED] 14:00:00 | RECON | docker init | container started
```

### Step 2: Port Scan — KOL ports
```
shannon_recon command="nmap -sV -sC -p- -T4 <target>"
[FEED] 14:00:05 | RECON | nmap full port scan | started
```

Loota nmap yl9a 20 ports → testihom KOLLHOM. Mat9afch ba3d port 1.

### Step 3: NSE Vuln Scripts
```
shannon_recon command="nmap --script vuln <target>"
[FEED] 14:10:00 | RECON | nmap vuln scripts | scanning
```

### Step 4: Tech Fingerprinting
```
shannon_recon command="whatweb <target>"
shannon_recon command="curl -sI <target>"
[FEED] 14:15:00 | RECON | tech fingerprint | Nginx 1.18, PHP 7.4
```

### Step 5: Subdomain Enumeration
```
shannon_recon command="subfinder -d <domain> -silent"
shannon_recon command="dig <domain> ANY"
shannon_recon command="whois <domain>"
[FEED] 14:20:00 | RECON | subfinder | 15 subdomains found
```

### Step 6: Directory Brute Force — KETLA wordlists
```
shannon_recon command="gobuster dir -u <target> -w /usr/share/wordlists/dirb/common.txt -t 50"
shannon_recon command="gobuster dir -u <target> -w /usr/share/wordlists/dirb/big.txt -t 50"
shannon_recon command="ffuf -u <target>/FUZZ -w /usr/share/wordlists/dirb/common.txt -t 100"
[FEED] 14:25:00 | RECON | gobuster | 30 directories found
```

### Step 7: API & Config Discovery
```
shannon_exec command="for path in /api /rest /graphql /swagger /openapi.json /config /.env /robots.txt /sitemap.xml /metrics /actuator /debug /trace /ftp /backup /.git; do curl -sk -o /dev/null -w '%{http_code} $path\n' <target>$path; done"
[FEED] 14:30:00 | RECON | API discovery | /api/v1 found, /.git found
```

### Step 8: JS Bundle Analysis
```
shannon_js_analyze target="<target>" url="<target>/main.js"
[FEED] 14:35:00 | RECON | JS analysis | 3 API keys, 12 endpoints found
```

### Step 9: TLS/SSL Scan
```
shannon_tls_scan target="<target>"
[FEED] 14:40:00 | RECON | TLS scan | TLS 1.0 supported (weak)
```

### Step 10: Subdomain Takeover Check
```
shannon_subdomain_takeover target="<target>"
[FEED] 14:45:00 | RECON | subdomain takeover | 2 vulnerable subdomains
```

## Loota ma tlqot chi Hajja

- Jarrab wordlists kbar: `big.txt`, `directory-list-2.3-medium.txt`
- Jarrab extensions: `-x php,html,js,json,xml,txt,bak,old`
- Zid threads: `-t 100` wala `-t 200`
- Jarrab nmap m3a `-sA` (aggressive)
- Fuzz b `ffuf` m3a wordlists mokhtelfin
- Check virtual hosts: `gobuster vhost`
- Scan m3a `masscan` 3la range kbar

## Output

Ba3d kol step, exporti [FEED] line. Loota kemelt kol steps, rawen lel DISCOVERY phase bela ma ts2el.

Ken lqit service versions → rawen lel DISCOVERY bech tlawej 3la CVEs.
Ken lqit JS bundles → analysihom m3a shannon_js_analyze.
Ken lqit subdomains → testihom KOLLHOM lel takeover.

MAT9AFCH — e5tira9 mch 5 dolar.
