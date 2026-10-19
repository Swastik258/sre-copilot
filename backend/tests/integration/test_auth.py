"""Integration tests for local signup/login and session handling."""

from sqlalchemy import select

from app.core.config import get_settings
from app.db.models import User

SIGNUP = "/api/v1/auth/signup"
LOGIN = "/api/v1/auth/login"
LOGOUT = "/api/v1/auth/logout"
ME = "/api/v1/auth/me"


def _signup(client, email="ada@example.com", password="correct-horse", name="Ada"):
    return client.post(
        SIGNUP,
        json={"email": email, "password": password, "display_name": name},
    )


def test_signup_creates_account_and_session(client):
    r = _signup(client)
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["user"]["email"] == "ada@example.com"
    assert body["user"]["display_name"] == "Ada"
    # The token is never exposed in the response body.
    assert "token" not in body
    assert "sre_session" in client.cookies

    me = client.get(ME)
    assert me.status_code == 200
    assert me.json()["email"] == "ada@example.com"


def test_session_cookie_is_httponly(client):
    r = _signup(client, email="cookie@example.com")
    set_cookie = r.headers["set-cookie"]
    assert "HttpOnly" in set_cookie
    assert "samesite=lax" in set_cookie.lower()


def test_password_is_hashed_not_stored_plaintext(client, db_session):
    password = "correct-horse"
    _signup(client, email="hashed@example.com", password=password)
    user = db_session.scalar(select(User).where(User.email == "hashed@example.com"))
    assert user is not None
    assert user.password_hash is not None
    assert password not in user.password_hash
    assert user.password_hash.startswith("scrypt$") or user.password_hash.startswith("pbkdf2$")


def test_duplicate_email_is_rejected(client):
    _signup(client, email="dup@example.com")
    r = _signup(client, email="dup@example.com")
    assert r.status_code == 409
    assert r.json()["error"]["code"] == "conflict"


def test_email_is_normalized(client):
    _signup(client, email="Mixed@Example.com")
    r = client.post(LOGIN, json={"email": "mixed@example.com", "password": "correct-horse"})
    assert r.status_code == 200
    assert r.json()["user"]["email"] == "mixed@example.com"


def test_signup_rejects_weak_password_and_bad_email(client):
    weak = client.post(SIGNUP, json={"email": "weak@example.com", "password": "short"})
    assert weak.status_code == 422
    bad = client.post(SIGNUP, json={"email": "not-an-email", "password": "correct-horse"})
    assert bad.status_code == 422


def test_login_with_wrong_password_fails(client):
    _signup(client, email="login@example.com")
    client.cookies.clear()
    r = client.post(LOGIN, json={"email": "login@example.com", "password": "wrong-password"})
    assert r.status_code == 401
    assert r.json()["error"]["code"] == "unauthorized"


def test_login_success_starts_a_session(client):
    _signup(client, email="return@example.com")
    client.cookies.clear()
    r = client.post(LOGIN, json={"email": "return@example.com", "password": "correct-horse"})
    assert r.status_code == 200
    assert client.get(ME).status_code == 200


def test_logout_revokes_session(client):
    _signup(client, email="bye@example.com")
    assert client.get(ME).status_code == 200
    out = client.post(LOGOUT)
    assert out.status_code == 204
    client.cookies.clear()
    assert client.get(ME).status_code == 401


def test_me_requires_authentication(client):
    client.cookies.clear()
    r = client.get(ME)
    assert r.status_code == 401
    assert r.json()["error"]["code"] == "unauthorized"


def test_bearer_token_also_authenticates(client):
    _signup(client, email="bearer@example.com")
    token = client.cookies.get("sre_session")
    client.cookies.clear()
    r = client.get(ME, headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200


def test_auth_required_flag_gates_data_routes(client):
    settings = get_settings()
    assert settings.auth_required is False  # default keeps the demo open
    # Default: read-only routes are open without a session.
    assert client.get("/api/v1/integrations").status_code == 200

    settings.auth_required = True
    try:
        blocked = client.get("/api/v1/integrations")
        assert blocked.status_code == 401
        assert blocked.json()["error"]["code"] == "unauthorized"

        # Health and auth stay public even when enforcement is on.
        assert client.get("/api/v1/health").status_code == 200

        # With a session the same route succeeds.
        client.cookies.clear()
        _signup(client, email="enforced@example.com")
        assert client.get("/api/v1/integrations").status_code == 200
    finally:
        settings.auth_required = False
