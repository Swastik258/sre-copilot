"""Outbound URL policy.

Integration base URLs are operator-configured, never user-supplied. That reduces
but does not remove SSRF risk: a typo or a compromised environment variable can
point a credentialed client at a metadata service or an unintended internal
host. These checks reject malformed URLs, embedded credentials, and known
cloud-metadata endpoints. Production runtime validation additionally requires
HTTPS for every outbound base URL.
"""

from __future__ import annotations

import ipaddress
from urllib.parse import urlsplit

_METADATA_HOSTS = {
    "169.254.169.254",
    "metadata",
    "metadata.google.internal",
    "metadata.azure.internal",
    "metadata.oraclecloud.com",
}


def validate_base_url(value: str, *, field: str = "URL") -> str:
    text = value.strip()
    if not text:
        raise ValueError(f"{field} must not be empty.")
    if len(text) > 2000:
        raise ValueError(f"{field} is too long.")
    if "\\" in text or any(ch.isspace() for ch in text):
        raise ValueError(f"{field} contains invalid characters.")
    try:
        parsed = urlsplit(text)
        port = parsed.port
    except ValueError as exc:
        raise ValueError(f"{field} is not a valid URL.") from exc
    if parsed.scheme not in {"http", "https"}:
        raise ValueError(f"{field} must use http or https.")
    if not parsed.hostname:
        raise ValueError(f"{field} must include a hostname.")
    if parsed.username is not None or parsed.password is not None:
        raise ValueError(f"{field} must not embed credentials.")
    if parsed.query or parsed.fragment:
        raise ValueError(f"{field} must not include a query or fragment.")
    if port is not None and not (1 <= port <= 65535):
        raise ValueError(f"{field} has an invalid port.")
    if is_metadata_host(parsed.hostname):
        raise ValueError(f"{field} points at a blocked metadata endpoint.")
    return text


def is_metadata_host(hostname: str) -> bool:
    host = hostname.strip("[]").rstrip(".").lower()
    if host in _METADATA_HOSTS:
        return True
    try:
        address = ipaddress.ip_address(host)
    except ValueError:
        return False
    return address.is_link_local or address.is_unspecified


def https_required(value: str | None) -> bool:
    if not value:
        return True
    try:
        return urlsplit(value).scheme == "https"
    except ValueError:
        return False
