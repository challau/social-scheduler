"""
Rate Limiter Middleware — Pure FastAPI/Python implementation.
Tracks request counts per (IP, route) using an in-memory sliding window.
No external slowapi dependency required.
"""
import time
import asyncio
from collections import defaultdict
from typing import Dict, Tuple
from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

# Per-route limits:  route_prefix -> (max_requests, window_seconds)
ROUTE_LIMITS: Dict[str, Tuple[int, int]] = {
    "/auth/signup": (5, 60),       # 5 req / minute
    "/auth/login":  (10, 60),      # 10 req / minute
    "/ai/generate": (20, 60),      # 20 req / minute
}

# Sliding window store: (ip, route) -> list[timestamp]
_window: Dict[Tuple[str, str], list] = defaultdict(list)
_lock = asyncio.Lock()


def _get_client_ip(request: Request) -> str:
    # Honour X-Forwarded-For when behind Nginx proxy
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return "unknown"


class RateLimiterMiddleware(BaseHTTPMiddleware):
    """
    Sliding-window rate limiter applied per (client IP, endpoint prefix).
    Returns HTTP 429 with Retry-After header when a client exceeds the limit.
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        path = request.url.path
        method = request.method

        # Only apply limits to POST mutations (signup, login, AI generate)
        if method != "POST":
            return await call_next(request)

        limit_config = None
        for prefix, cfg in ROUTE_LIMITS.items():
            if path.startswith(prefix):
                limit_config = cfg
                break

        if not limit_config:
            return await call_next(request)

        max_requests, window_seconds = limit_config
        ip = _get_client_ip(request)
        key = (ip, path)
        now = time.time()
        cutoff = now - window_seconds

        async with _lock:
            # Prune old timestamps outside window
            _window[key] = [t for t in _window[key] if t > cutoff]
            count = len(_window[key])

            if count >= max_requests:
                oldest = _window[key][0] if _window[key] else now
                retry_after = int(window_seconds - (now - oldest)) + 1
                return JSONResponse(
                    status_code=429,
                    content={
                        "detail": f"Too many requests. Limit: {max_requests} per {window_seconds}s.",
                        "retry_after_seconds": retry_after
                    },
                    headers={"Retry-After": str(retry_after)}
                )

            _window[key].append(now)

        return await call_next(request)
