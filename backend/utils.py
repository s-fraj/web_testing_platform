from urllib.parse import urlparse
import re

def is_valid_url(url: str) -> bool:
    parsed = urlparse(url)
    return parsed.scheme in ("http", "https") and bool(parsed.netloc)

def is_valid_host(host: str) -> bool:
    domain_regex = r"^(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$"
    ip_regex     = r"^(?:\d{1,3}\.){3}\d{1,3}$"
    return bool(re.match(domain_regex, host) or re.match(ip_regex, host))

def extract_host(url: str) -> str:
    parsed = urlparse(url)
    return parsed.netloc or url
