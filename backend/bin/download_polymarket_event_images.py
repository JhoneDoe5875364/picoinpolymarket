#!/usr/bin/env python3
"""
Single-run Polymarket image downloader.

Flow:
1) run fixed curl requests 100 times (100 events per request),
2) for each response, extract image-related URLs immediately,
3) append extracted URLs to a log file immediately,
4) download the extracted images immediately as market-100000.png and up.
"""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, urlparse
from urllib.request import Request, urlopen

EVENTS_BASE_URL = "https://gamma-api.polymarket.com/events"
OUTPUT_DIR = Path("tmp/polymarket-event-images")
LOG_FILE = OUTPUT_DIR / "image-urls.log"
START_INDEX = 100000
TIMEOUT_SECONDS = 30
PAGE_LIMIT = 100
TOTAL_REQUESTS = 100


def is_http_url(value: str) -> bool:
    parsed = urlparse(value)
    return parsed.scheme in {"http", "https"} and bool(parsed.netloc)


def extract_image_urls_from_node(node: Any, found: list[str]) -> None:
    if isinstance(node, dict):
        for key, value in node.items():
            if isinstance(value, str) and "image" in key.lower() and is_http_url(value):
                found.append(value)
            else:
                extract_image_urls_from_node(value, found)
        return
    if isinstance(node, list):
        for item in node:
            extract_image_urls_from_node(item, found)


def decode_output(raw: bytes | None) -> str:
    if not raw:
        return ""
    return raw.decode("utf-8", errors="replace")


def build_events_url(offset: int) -> str:
    query = urlencode(
        {
            "limit": PAGE_LIMIT,
            "offset": offset,
            "order": "createdAt",
            "ascending": "false",
        }
    )
    return f"{EVENTS_BASE_URL}?{query}"


def fetch_events_page_with_curl(request_index: int) -> list[dict[str, Any]]:
    url = build_events_url(offset=request_index * PAGE_LIMIT)
    command = [
        "curl",
        "--request",
        "GET",
        "--url",
        url,
        "--max-time",
        str(TIMEOUT_SECONDS),
        "--silent",
        "--show-error",
    ]
    try:
        result = subprocess.run(command, check=True, capture_output=True)
    except FileNotFoundError as exc:
        raise RuntimeError("curl not found. Please install curl or add it to PATH.") from exc
    except subprocess.CalledProcessError as exc:
        stderr_output = decode_output(exc.stderr).strip()
        raise RuntimeError(
            f"curl request failed at request #{request_index + 1}: {stderr_output or exc}"
        ) from exc

    stdout_text = decode_output(result.stdout).strip()
    if not stdout_text:
        raise RuntimeError(f"Empty response from events API at request #{request_index + 1}.")

    try:
        payload = json.loads(stdout_text)
    except json.JSONDecodeError as exc:
        raise RuntimeError(
            f"Invalid JSON response from events API at request #{request_index + 1}: {exc}"
        ) from exc

    if not isinstance(payload, list):
        raise RuntimeError(
            f"Unexpected API response type at request #{request_index + 1}: {type(payload).__name__}"
        )

    return [item for item in payload if isinstance(item, dict)]


def download_file(url: str, destination: Path) -> None:
    req = Request(url, headers={"User-Agent": "PredictPix-PolymarketImageFetcher/1.0"})
    with urlopen(req, timeout=TIMEOUT_SECONDS) as response:  # nosec B310
        destination.write_bytes(response.read())


def initialize_log_file() -> None:
    LOG_FILE.write_text("count=0\n\n", encoding="utf-8")


def append_log_lines(lines: list[str]) -> None:
    with LOG_FILE.open("a", encoding="utf-8") as log_file:
        for line in lines:
            log_file.write(line + "\n")


def update_log_count(count: int) -> None:
    current = LOG_FILE.read_text(encoding="utf-8")
    LOG_FILE.write_text(f"count={count}\n" + current.split("\n", 1)[1], encoding="utf-8")


def main() -> int:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    initialize_log_file()

    fetched_events_count = 0
    seen_urls: set[str] = set()
    logged_urls_count = 0
    success_count = 0
    failure_count = 0
    current_index = START_INDEX

    for request_index in range(TOTAL_REQUESTS):
        try:
            page_events = fetch_events_page_with_curl(request_index)
        except RuntimeError as exc:
            print(f"Failed to fetch events: {exc}", file=sys.stderr)
            return 1

        fetched_events_count += len(page_events)

        page_urls: list[str] = []
        for event in page_events:
            extract_image_urls_from_node(event, page_urls)

        new_urls: list[str] = []
        for url in page_urls:
            if url in seen_urls:
                continue
            seen_urls.add(url)
            new_urls.append(url)

        if not new_urls:
            continue

        log_lines: list[str] = []
        for image_url in new_urls:
            logged_urls_count += 1
            log_lines.append(f"{logged_urls_count}\t{image_url}")
        append_log_lines(log_lines)
        update_log_count(logged_urls_count)

        for image_url in new_urls:
            target_path = OUTPUT_DIR / f"market-{current_index}.png"
            try:
                download_file(image_url, target_path)
                success_count += 1
                current_index += 1
            except (HTTPError, URLError, TimeoutError, OSError) as exc:
                failure_count += 1
                print(f"[WARN] download failed: {image_url} ({exc})", file=sys.stderr)

    print(f"Fetched events: {fetched_events_count}")
    print(f"Discovered image URLs: {logged_urls_count}")
    print(f"Downloaded: {success_count}")
    print(f"Failed: {failure_count}")
    print(f"Log file: {LOG_FILE.resolve()}")
    print(f"Output directory: {OUTPUT_DIR.resolve()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
