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
    assert body["user"]["role"] == "owner"
    # The token is never exposed in the response body.
    assert "token" not in body
    assert "sre_session" in client.cookies
    me = client.get(ME)
    assert me.status_code == 200
    assert me.json()["email"] == "ada@example.com"


def test_signup_never_grants_admin_from_email_or_account_order(client):
    first = _signup(client, email="first-signup@example.com")
    client.cookies.clear()
    second = _signup(client, email="admin@example.com")
    # Each independent signup owns a personal workspace; no account receives
    # administrator rights based on email address or signup order.
    assert first.json()["user"]["role"] == "owner"
    assert second.json()["user"]["role"] == "owner"
    assert first.json()["user"]["tenant_id"] != second.json()["user"]["tenant_id"]


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
    assert user.password_hash.startswith("$argon2id$")


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


def test_csrf_cookie_is_readable_and_pairs_with_session(client):
    _signup(client, email="csrf@example.com")
    assert "sre_session" in client.cookies
    assert "sre_csrf" in client.cookies
    # The session cookie is HttpOnly; the CSRF cookie is intentionally readable.
    assert client.cookies.get("sre_csrf")


def test_refresh_rotates_the_session_and_revokes_the_old_token(client):
    _signup(client, email="rotate@example.com")
    old_token = client.cookies.get("sre_session")
    old_csrf = client.cookies.get("sre_csrf")
    assert old_token and old_csrf

    rotated = client.post("/api/v1/auth/refresh")
    assert rotated.status_code == 200, rotated.text
    new_token = client.cookies.get("sre_session")
    assert new_token and new_token != old_token
    assert client.cookies.get("sre_csrf") != old_csrf

    client.cookies.clear()
    stale = client.get(ME, headers={"Authorization": f"Bearer {old_token}"})
    assert stale.status_code == 401


def test_failed_logins_lock_the_account_temporarily(client):
    _signup(client, email="lockout@example.com")
    client.cookies.clear()
    settings = get_settings()
    previous = settings.auth_max_failed_logins
    settings.auth_max_failed_logins = 3
    try:
        statuses = []
        for _ in range(3):
            response = client.post(
                LOGIN,
                json={"email": "lockout@example.com", "password": "wrong-password"},
            )
            statuses.append(response.status_code)
        assert statuses[:2] == [401, 401]
        assert statuses[2] == 429
        locked = client.post(
            LOGIN,
            json={"email": "lockout@example.com", "password": "correct-horse"},
        )
        assert locked.status_code == 429
        assert locked.json()["error"]["code"] == "rate_limited"
    finally:
        settings.auth_max_failed_logins = previous


def test_email_verification_flow(client, monkeypatch):
    captured: list[str] = []

    def fake_send(_settings, *, to, token):
        assert to.endswith("@example.com")
        captured.append(token)

    monkeypatch.setattr("app.api.v1.auth.send_verification_email", fake_send)
    settings = get_settings()
    previous_required = settings.email_verification_required
    previous_delivery = settings.email_delivery
    settings.email_verification_required = True
    settings.email_delivery = "console"
    try:
        signup = _signup(client, email="verify@example.com")
        assert signup.status_code == 201, signup.text
        assert signup.json()["verification_required"] is True
        assert client.get(ME).status_code == 401
        assert len(captured) == 1

        blocked = client.post(
            LOGIN,
            json={"email": "verify@example.com", "password": "correct-horse"},
        )
        assert blocked.status_code == 403
        assert blocked.json()["error"]["code"] == "email_not_verified"

        verified = client.post("/api/v1/auth/verify-email", json={"token": captured[0]})
        assert verified.status_code == 200, verified.text
        assert verified.json()["email_verified_at"] is not None

        login = client.post(
            LOGIN,
            json={"email": "verify@example.com", "password": "correct-horse"},
        )
        assert login.status_code == 200
    finally:
        settings.email_verification_required = previous_required
        settings.email_delivery = previous_delivery


def test_password_reset_flow_revokes_sessions(client, monkeypatch):
    captured: list[str] = []

    def fake_send(_settings, *, to, token):
        assert to.endswith("@example.com")
        captured.append(token)

    monkeypatch.setattr("app.api.v1.auth.send_password_reset_email", fake_send)
    settings = get_settings()
    previous_delivery = settings.email_delivery
    settings.email_delivery = "console"
    try:
        _signup(client, email="reset@example.com")
        old_session = client.cookies.get("sre_session")
        forgot = client.post("/api/v1/auth/forgot-password", json={"email": "reset@example.com"})
        assert forgot.status_code == 202
        assert len(captured) == 1

        reset = client.post(
            "/api/v1/auth/reset-password",
            json={"token": captured[0], "password": "new-correct-horse"},
        )
        assert reset.status_code == 204, reset.text

        client.cookies.clear()
        old = client.get(ME, headers={"Authorization": f"Bearer {old_session}"})
        assert old.status_code == 401
        old_login = client.post(
            LOGIN,
            json={"email": "reset@example.com", "password": "correct-horse"},
        )
        assert old_login.status_code == 401
        new_login = client.post(
            LOGIN,
            json={"email": "reset@example.com", "password": "new-correct-horse"},
        )
        assert new_login.status_code == 200
    finally:
        settings.email_delivery = previous_delivery


def test_forgot_password_does_not_enumerate_accounts(client):
    response = client.post("/api/v1/auth/forgot-password", json={"email": "nobody@example.com"})
    assert response.status_code == 202
    assert "If an account exists" in response.json()["message"]


def test_password_policy_rejects_common_password(client):
    response = client.post(
        SIGNUP,
        json={"email": "policy@example.com", "password": "passwordpassword"},
    )
    assert response.status_code == 422
