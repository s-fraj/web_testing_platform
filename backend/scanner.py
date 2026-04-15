"""
scanner.py — mr7.ai security scanner
Streams results as SSE events: {type, category, check, status, detail, severity}
severity: "ok" | "warning" | "critical" | "info"
"""
import asyncio, socket, time, ssl, re
from urllib.parse import urlparse, urljoin
from datetime import datetime
from typing import AsyncGenerator
import requests
from bs4 import BeautifulSoup
from sqlalchemy.orm import Session
import models
from utils import extract_host

TIMEOUT = 6

# ── HELPERS ───────────────────────────────────────────────────────────
def _event(category, check, status, detail, severity="info"):
    return {"type": "result", "category": category, "check": check,
            "status": status, "detail": detail, "severity": severity}

def _info(category, check, detail):
    return _event(category, check, "INFO", detail, "info")

def _ok(category, check, detail):
    return _event(category, check, "OK", detail, "ok")

def _warn(category, check, detail):
    return _event(category, check, "WARNING", detail, "warning")

def _crit(category, check, detail):
    return _event(category, check, "CRITICAL", detail, "critical")

# ── 1. HTTP BASICS ────────────────────────────────────────────────────
def test_http_basics(url):
    results = []
    try:
        start = time.time()
        r = requests.get(url, timeout=TIMEOUT, allow_redirects=True)
        elapsed = round(time.time() - start, 2)
        s = r.status_code

        if s < 400:
            results.append(_ok("HTTP", "Status Code", f"HTTP {s} — site reachable"))
        else:
            results.append(_crit("HTTP", "Status Code", f"HTTP {s} — error response"))

        if elapsed > 4:
            results.append(_crit("HTTP", "Response Time", f"{elapsed}s — very slow"))
        elif elapsed > 2:
            results.append(_warn("HTTP", "Response Time", f"{elapsed}s — above average"))
        else:
            results.append(_ok("HTTP", "Response Time", f"{elapsed}s — fast"))

        redirects = len(r.history)
        if redirects > 4:
            results.append(_warn("HTTP", "Redirections", f"{redirects} redirects — excessive"))
        elif redirects > 0:
            results.append(_ok("HTTP", "Redirections", f"{redirects} redirect(s) — normal"))
        else:
            results.append(_ok("HTTP", "Redirections", "No redirects"))

        # Check HTTPS upgrade
        if url.startswith("http://"):
            try:
                https = requests.get(url.replace("http://", "https://"), timeout=5)
                if https.status_code < 400:
                    results.append(_warn("HTTP", "HTTPS Upgrade", "HTTP works but HTTPS also available — consider forcing HTTPS"))
                else:
                    results.append(_crit("HTTP", "HTTPS Upgrade", "Site running over HTTP only — no encryption"))
            except:
                results.append(_crit("HTTP", "HTTPS Upgrade", "Site running over HTTP only — no HTTPS available"))
        else:
            results.append(_ok("HTTP", "HTTPS Upgrade", "Site uses HTTPS"))

    except requests.exceptions.ConnectionError:
        results.append(_crit("HTTP", "Connectivity", "Unable to connect to target"))
    except requests.exceptions.Timeout:
        results.append(_crit("HTTP", "Connectivity", "Connection timed out"))
    except Exception as e:
        results.append(_crit("HTTP", "Connectivity", str(e)))
    return results

# ── 2. SSL/TLS ────────────────────────────────────────────────────────
def test_ssl(url):
    results = []
    host = extract_host(url)
    if not url.startswith("https"):
        results.append(_crit("SSL/TLS", "Certificate", "No HTTPS — SSL/TLS not configured"))
        return results
    try:
        ctx = ssl.create_default_context()
        with ctx.wrap_socket(socket.socket(), server_hostname=host) as s:
            s.settimeout(TIMEOUT)
            s.connect((host, 443))
            cert = s.getpeercert()
            expire_str = cert.get("notAfter", "")
            if expire_str:
                exp = datetime.strptime(expire_str, "%b %d %H:%M:%S %Y %Z")
                days_left = (exp - datetime.utcnow()).days
                if days_left < 0:
                    results.append(_crit("SSL/TLS", "Certificate Expiry", f"Certificate EXPIRED {abs(days_left)} days ago"))
                elif days_left < 15:
                    results.append(_crit("SSL/TLS", "Certificate Expiry", f"Expires in {days_left} days — renew URGENTLY"))
                elif days_left < 30:
                    results.append(_warn("SSL/TLS", "Certificate Expiry", f"Expires in {days_left} days — renew soon"))
                else:
                    results.append(_ok("SSL/TLS", "Certificate Expiry", f"Valid for {days_left} more days"))
            # TLS version
            version = s.version()
            if version in ("TLSv1", "TLSv1.1", "SSLv2", "SSLv3"):
                results.append(_crit("SSL/TLS", "Protocol Version", f"{version} — outdated, vulnerable"))
            else:
                results.append(_ok("SSL/TLS", "Protocol Version", f"{version} — modern, secure"))
    except ssl.SSLCertVerificationError as e:
        results.append(_crit("SSL/TLS", "Certificate Validity", f"SSL verification failed: {e}"))
    except Exception as e:
        results.append(_warn("SSL/TLS", "Certificate", f"Could not inspect SSL: {e}"))
    return results

# ── 3. SECURITY HEADERS ───────────────────────────────────────────────
def test_security_headers(url):
    results = []
    try:
        r = requests.get(url, timeout=TIMEOUT)
        h = {k.lower(): v for k, v in r.headers.items()}

        checks = [
            ("strict-transport-security",   "HSTS",              "Enforces HTTPS"),
            ("x-frame-options",              "X-Frame-Options",   "Prevents clickjacking"),
            ("x-content-type-options",      "X-Content-Type",    "Prevents MIME sniffing"),
            ("content-security-policy",     "CSP",               "Controls resource loading"),
            ("x-xss-protection",            "XSS Protection",    "Legacy XSS filter"),
            ("referrer-policy",             "Referrer Policy",   "Controls referrer info"),
            ("permissions-policy",          "Permissions Policy","Restricts browser features"),
        ]
        for header, name, desc in checks:
            if header in h:
                results.append(_ok("Headers", name, f"Present — {desc} ({h[header][:60]})"))
            else:
                results.append(_warn("Headers", name, f"Missing — {desc} not enforced"))

        # Server info disclosure
        server = h.get("server", "")
        if server:
            results.append(_warn("Headers", "Server Disclosure", f"Server header reveals: '{server}'"))
        else:
            results.append(_ok("Headers", "Server Disclosure", "Server header hidden"))

        x_powered = h.get("x-powered-by", "")
        if x_powered:
            results.append(_warn("Headers", "X-Powered-By", f"Reveals tech stack: '{x_powered}'"))
        else:
            results.append(_ok("Headers", "X-Powered-By", "X-Powered-By header hidden"))

    except Exception as e:
        results.append(_crit("Headers", "Header Analysis", str(e)))
    return results

# ── 4. PORT SCAN ──────────────────────────────────────────────────────
def test_ports(url):
    results = []
    host = extract_host(url).split(":")[0]
    ports = {
        21: ("FTP",   "warning"),
        22: ("SSH",   "warning"),
        23: ("Telnet","critical"),
        25: ("SMTP",  "info"),
        53: ("DNS",   "info"),
        80: ("HTTP",  "ok"),
        443: ("HTTPS","ok"),
        3306: ("MySQL","critical"),
        5432: ("PostgreSQL","critical"),
        6379: ("Redis","critical"),
        8080: ("HTTP-Alt","warning"),
        8443: ("HTTPS-Alt","info"),
        27017: ("MongoDB","critical"),
    }
    for port, (service, sev) in ports.items():
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(0.8)
        try:
            state = "Open" if sock.connect_ex((host, port)) == 0 else "Closed"
            if state == "Open":
                if sev == "critical":
                    results.append(_crit("Ports", f"Port {port} ({service})", f"OPEN — database/sensitive service exposed!"))
                elif sev == "warning":
                    results.append(_warn("Ports", f"Port {port} ({service})", f"OPEN — verify this is intentional"))
                else:
                    results.append(_ok("Ports", f"Port {port} ({service})", f"OPEN — expected"))
            else:
                results.append(_ok("Ports", f"Port {port} ({service})", "Closed"))
        except:
            results.append(_info("Ports", f"Port {port} ({service})", "Filtered/Unreachable"))
        finally:
            sock.close()
    return results

# ── 5. SQL INJECTION ──────────────────────────────────────────────────
def test_sql_injection(url):
    results = []
    payloads = [
        ("Classic single quote",  "'"),
        ("Double quote",          '"'),
        ("OR bypass",             "' OR '1'='1"),
        ("UNION probe",           "' UNION SELECT NULL--"),
        ("Boolean blind",         "' AND 1=1--"),
        ("Error-based",           "'; SELECT * FROM information_schema.tables--"),
    ]
    sql_errors = [
        "sql syntax", "mysql_fetch", "syntax error", "warning: mysql",
        "unclosed quotation", "odbc", "pdo", "ora-", "pg_query",
        "sqlite_query", "sqlstate", "db2_", "sybase"
    ]
    vulnerable = False
    try:
        for name, payload in payloads:
            r = requests.get(url + payload, timeout=TIMEOUT)
            content = r.text.lower()
            if any(e in content for e in sql_errors):
                results.append(_crit("SQL Injection", name, f"SQL error triggered by payload: {payload}"))
                vulnerable = True
            else:
                results.append(_ok("SQL Injection", name, f"No SQL error with payload: {payload}"))
        if not vulnerable:
            results.append(_ok("SQL Injection", "Summary", "No obvious SQL injection points detected"))
    except Exception as e:
        results.append(_warn("SQL Injection", "Test", f"Could not complete test: {e}"))
    return results

# ── 6. XSS PROBES ─────────────────────────────────────────────────────
def test_xss(url):
    results = []
    payloads = [
        ("<script>alert(1)</script>",           "Basic script tag"),
        ("<img src=x onerror=alert(1)>",        "Image onerror"),
        ("javascript:alert(1)",                 "JS protocol"),
        ("'\"><script>alert(1)</script>",       "Attribute escape"),
        ("<svg onload=alert(1)>",               "SVG onload"),
    ]
    try:
        for payload, name in payloads:
            r = requests.get(url, params={"q": payload, "search": payload}, timeout=TIMEOUT)
            if payload.lower() in r.text.lower():
                results.append(_crit("XSS", name, f"Payload reflected in response — potential XSS!"))
            else:
                results.append(_ok("XSS", name, "Payload not reflected"))
    except Exception as e:
        results.append(_warn("XSS", "Test", f"Could not complete XSS test: {e}"))
    return results

# ── 7. API SECURITY ───────────────────────────────────────────────────
def test_api_security(url):
    results = []
    try:
        r = requests.get(url, timeout=TIMEOUT)
        h = {k.lower(): v for k, v in r.headers.items()}

        if r.status_code == 200:
            results.append(_warn("API", "Authentication", "Endpoint accessible without auth (check if expected)"))
        elif r.status_code in (401, 403):
            results.append(_ok("API", "Authentication", "Authentication required — protected"))
        else:
            results.append(_info("API", "Authentication", f"Status: {r.status_code}"))

        ct = h.get("content-type", "")
        if "application/json" in ct:
            results.append(_ok("API", "Content-Type", "Returns JSON"))
        else:
            results.append(_info("API", "Content-Type", f"Content-Type: {ct or 'not set'}"))

        cors = h.get("access-control-allow-origin", "")
        if cors == "*":
            results.append(_crit("API", "CORS Policy", "Wildcard CORS (*) — any origin allowed"))
        elif cors:
            results.append(_ok("API", "CORS Policy", f"Restricted CORS: {cors}"))
        else:
            results.append(_info("API", "CORS Policy", "No CORS header present"))

        opts = requests.options(url, timeout=TIMEOUT)
        methods = opts.headers.get("Allow", opts.headers.get("access-control-allow-methods", "Not specified"))
        results.append(_info("API", "Allowed Methods", f"Methods: {methods}"))
        if "DELETE" in methods or "PUT" in methods:
            results.append(_warn("API", "Dangerous Methods", f"DELETE/PUT exposed — ensure auth is required"))

    except Exception as e:
        results.append(_warn("API", "Test", f"API test failed: {e}"))
    return results

# ── 8. CONTENT ANALYSIS ───────────────────────────────────────────────
def test_content(url):
    results = []
    try:
        r = requests.get(url, timeout=TIMEOUT)
        soup = BeautifulSoup(r.text, "html.parser")

        # Broken links
        broken = []
        links = soup.find_all("a", href=True)[:20]  # limit for speed
        for link in links:
            full = urljoin(url, link["href"])
            try:
                lr = requests.get(full, timeout=3)
                if lr.status_code >= 400:
                    broken.append(full)
            except:
                broken.append(full)
        if broken:
            results.append(_warn("Content", "Broken Links", f"{len(broken)} broken link(s) found"))
        else:
            results.append(_ok("Content", "Broken Links", f"All {len(links)} links reachable"))

        # Forms
        forms = soup.find_all("form")
        if forms:
            results.append(_warn("Content", "Forms", f"{len(forms)} form(s) detected — verify input validation"))
        else:
            results.append(_info("Content", "Forms", "No forms found"))

        # Sensitive info exposure
        text = r.text.lower()
        sensitive = {
            "email disclosure": r"[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}",
            "IP address":       r"\b(?:\d{1,3}\.){3}\d{1,3}\b",
        }
        for name, pattern in sensitive.items():
            matches = re.findall(pattern, text)
            if matches:
                results.append(_warn("Content", name.title(), f"{len(matches)} instance(s) found in page source"))
            else:
                results.append(_ok("Content", name.title(), "None found in source"))

        # robots.txt
        try:
            robots = requests.get(urljoin(url, "/robots.txt"), timeout=3)
            if robots.status_code == 200:
                results.append(_info("Content", "robots.txt", "File exists — check for sensitive path disclosures"))
            else:
                results.append(_ok("Content", "robots.txt", "Not found"))
        except:
            results.append(_ok("Content", "robots.txt", "Not accessible"))

    except Exception as e:
        results.append(_warn("Content", "Analysis", str(e)))
    return results

# ── 9. DIRECTORY EXPOSURE ─────────────────────────────────────────────
def test_directory_exposure(url):
    results = []
    paths = [
        "/.git/config", "/.env", "/config.php", "/wp-config.php",
        "/admin", "/admin/", "/phpmyadmin", "/backup", "/backup.zip",
        "/.htaccess", "/server-status", "/api/docs", "/swagger.json",
        "/openapi.json", "/.well-known/security.txt",
    ]
    for path in paths:
        try:
            r = requests.get(url.rstrip("/") + path, timeout=3)
            if r.status_code == 200:
                if path in ("/.git/config", "/.env", "/wp-config.php", "/config.php"):
                    results.append(_crit("Exposure", path, f"EXPOSED — sensitive file accessible!"))
                elif path in ("/admin", "/admin/", "/phpmyadmin"):
                    results.append(_warn("Exposure", path, "Admin panel accessible — ensure auth is strong"))
                else:
                    results.append(_info("Exposure", path, f"Accessible (HTTP 200)"))
            elif r.status_code == 403:
                results.append(_warn("Exposure", path, "Forbidden (403) — path exists but blocked"))
            else:
                results.append(_ok("Exposure", path, f"Not found ({r.status_code})"))
        except:
            results.append(_ok("Exposure", path, "Not accessible"))
    return results

# ── MASTER RUNNER ─────────────────────────────────────────────────────
async def run_all_tests(url: str, scan_id: int, db: Session) -> AsyncGenerator:
    all_results = []
    risk = 0

    test_groups = [
        ("HTTP Basics",          test_http_basics),
        ("SSL/TLS",              test_ssl),
        ("Security Headers",     test_security_headers),
        ("Port Scan",            test_ports),
        ("SQL Injection",        test_sql_injection),
        ("XSS Probes",           test_xss),
        ("API Security",         test_api_security),
        ("Content Analysis",     test_content),
        ("Directory Exposure",   test_directory_exposure),
    ]

    # Mark scan as running
    scan = db.query(models.Scan).filter(models.Scan.id == scan_id).first()
    if scan:
        scan.status = "running"
        db.commit()

    for group_name, fn in test_groups:
        yield {"type": "group_start", "group": group_name}
        await asyncio.sleep(0.01)

        try:
            loop = asyncio.get_event_loop()
            group_results = await loop.run_in_executor(None, fn, url)
        except Exception as e:
            group_results = [_crit(group_name, "Error", str(e))]

        for r in group_results:
            all_results.append(r)
            if r["severity"] == "critical": risk += 15
            elif r["severity"] == "warning": risk += 5
            yield r
            await asyncio.sleep(0.03)

        yield {"type": "group_end", "group": group_name}

    # Clamp risk score
    risk = min(100, risk)

    # Save to DB
    if scan:
        scan.status = "done"
        scan.results = all_results
        scan.risk_score = risk
        scan.finished_at = datetime.utcnow()
        db.commit()
