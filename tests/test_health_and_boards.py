import os
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"ok": True}


def test_openapi():
    r = client.get("/openapi.json")
    assert r.status_code == 200
    assert "paths" in r.json()


def test_boards_requires_api_key(monkeypatch):
    # monkeypatch supabase_client.select to return empty list
    class Dummy:
        def table(self, t):
            return self
        def select(self, *args, **kwargs):
            return self
        def eq(self, k, v):
            return self
        def execute(self):
            class R:
                status_code = 200
                data = []
                text = "[]"
            return R()

    monkeypatch.setattr("app.repositories.supabase_client._client", Dummy())

    r = client.get("/boards")
    assert r.status_code == 401 or r.status_code == 422
