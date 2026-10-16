from app.db.models import Evidence, Investigation, User


def test_persist_user_investigation_evidence(db_session):
    user = User(email="engineer@example.com", display_name="Engineer")
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    investigation = Investigation(user_id=user.id, title="Pod crashloop", kind="kubernetes")
    db_session.add(investigation)
    db_session.commit()
    db_session.refresh(investigation)

    evidence = Evidence(
        source_type="kubernetes",
        severity="high",
        summary="CrashLoopBackOff — 14 restarts",
        payload={"restarts": 14},
    )
    investigation.evidence_records.append(evidence)
    db_session.commit()

    stored = db_session.query(Evidence).filter_by(investigation_id=investigation.id).one()
    assert stored.summary.startswith("CrashLoopBackOff")
    assert stored.payload == {"restarts": 14}
    assert stored.redacted is True
    assert stored.demo is False


def test_deleting_investigation_cascades_to_evidence(db_session):
    user = User(email="cascade@example.com")
    db_session.add(user)
    db_session.commit()

    investigation = Investigation(user_id=user.id, title="t", kind="general")
    investigation.evidence_records.append(
        Evidence(source_type="logs", severity="info", summary="line")
    )
    db_session.add(investigation)
    db_session.commit()

    db_session.delete(investigation)
    db_session.commit()

    assert db_session.query(Evidence).filter_by(investigation_id=investigation.id).count() == 0
