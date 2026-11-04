from app.db.models import Evidence, Investigation, User, Workspace, WorkspaceMembership
from app.services.workspace_service import _slug_base, _unique_slug


def _personal_workspace(db_session, user: User) -> Workspace:
    """Create the personal workspace a user's rows belong to."""
    workspace = Workspace(
        slug=_unique_slug(db_session, _slug_base(user.display_name, user.email)),
        name=user.display_name or user.email or "Workspace",
        settings={},
    )
    db_session.add(workspace)
    db_session.flush()
    db_session.add(
        WorkspaceMembership(
            workspace_id=workspace.id, user_id=user.id, role="owner"
        )
    )
    db_session.commit()
    db_session.refresh(workspace)
    return workspace


def test_persist_user_investigation_evidence(db_session):
    user = User(email="engineer@example.com", display_name="Engineer")
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    workspace = _personal_workspace(db_session, user)

    investigation = Investigation(
        user_id=user.id,
        workspace_id=workspace.id,
        title="Pod crashloop",
        kind="kubernetes",
    )
    db_session.add(investigation)
    db_session.commit()
    db_session.refresh(investigation)

    evidence = Evidence(
        workspace_id=workspace.id,
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
    assert stored.workspace_id == workspace.id


def test_deleting_investigation_cascades_to_evidence(db_session):
    user = User(email="cascade@example.com")
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    workspace = _personal_workspace(db_session, user)

    investigation = Investigation(
        user_id=user.id,
        workspace_id=workspace.id,
        title="t",
        kind="general",
    )
    investigation.evidence_records.append(
        Evidence(
            workspace_id=workspace.id,
            source_type="logs",
            severity="info",
            summary="line",
        )
    )
    db_session.add(investigation)
    db_session.commit()

    db_session.delete(investigation)
    db_session.commit()

    assert db_session.query(Evidence).filter_by(investigation_id=investigation.id).count() == 0
