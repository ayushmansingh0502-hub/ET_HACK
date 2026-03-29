import json
import os
from pathlib import Path

from fastapi.testclient import TestClient


def run_smoke_test(force_fallback: bool = False) -> None:
    if force_fallback:
        os.environ["GEMINI_API_KEY"] = ""

    from app.main import app

    payload = json.loads(Path("test_payload.json").read_text(encoding="utf-8"))
    client = TestClient(app)

    checks = [
        ("GET", "/health", None),
        ("POST", "/api/money-health", payload),
        ("POST", "/api/fire-roadmap", payload),
    ]

    for method, path, body in checks:
        response = client.request(method, path, json=body)
        print(f"{method} {path} -> {response.status_code}")
        print(json.dumps(response.json(), indent=2))


if __name__ == "__main__":
    run_smoke_test(force_fallback=os.getenv("FORCE_FALLBACK") == "1")
