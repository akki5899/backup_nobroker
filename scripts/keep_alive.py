#!/usr/bin/env python3
"""Keep the Render free-tier backend awake by pinging /health on a loop.

Render spins free web services down after ~15 minutes of inactivity, adding a
30-60s cold start to the next request. Run this from any always-on machine
(your laptop, a VPS, a Raspberry Pi) to keep the instance warm.

IMPORTANT: This must run on a machine OTHER than the Render instance itself.
A self-ping cannot wake a sleeping instance, because the app isn't running
once Render has put it to sleep.

Usage:
    python scripts/keep_alive.py
    KEEP_ALIVE_URL=https://your-app.onrender.com/health python scripts/keep_alive.py

Stop with Ctrl+C.
"""
import os
import time
import urllib.request
from datetime import datetime, timezone

URL = os.environ.get(
    "KEEP_ALIVE_URL",
    "https://nobroker-replica-raghu.onrender.com/health",
)
# Ping interval in seconds. 10 minutes stays comfortably under Render's
# ~15-minute sleep threshold.
INTERVAL = int(os.environ.get("KEEP_ALIVE_INTERVAL", "600"))


def ping() -> None:
    stamp = datetime.now(timezone.utc).isoformat(timespec="seconds")
    try:
        # max 90s to tolerate a cold start while the instance wakes up.
        with urllib.request.urlopen(URL, timeout=90) as resp:
            print(f"[{stamp}] {URL} -> HTTP {resp.status}", flush=True)
    except Exception as exc:  # network error, timeout, non-2xx, etc.
        print(f"[{stamp}] ping failed: {exc}", flush=True)


def main() -> None:
    print(f"Keep-alive started. Pinging {URL} every {INTERVAL}s.", flush=True)
    while True:
        ping()
        time.sleep(INTERVAL)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nKeep-alive stopped.", flush=True)
