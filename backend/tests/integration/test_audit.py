from app.services.audit import record_event


def test_audit_event_records_and_redacts(db_session):
    event = record_event(
        db_session,
        action="integration.update",
        actor="user",
        decision="allow",
        resource={"github_token": "ghp_abcdefghijklmnopqrstuvwxyz0123456789"},
        outcome={"status": "ok"},
    )
    assert event.id
    assert event.action == "integration.update"
    # Token must never be stored verbatim.
    assert "ghp_abcdefghijklmnopqrstuvwxyz0123456789" not in str(event.resource)
