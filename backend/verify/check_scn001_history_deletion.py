from __future__ import annotations

import sys
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

from fastapi.testclient import TestClient
from sqlalchemy import func, select
from sqlalchemy.orm import Session

REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT))

from backend.app.db import engine, get_db
from backend.app.dependencies.auth import require_current_user
from backend.app.models.before_review_job import BeforeReviewJob
from backend.app.models.bridge_run import BridgeRun
from backend.app.models.user import User
from backend.app.routers import scn001 as scn001_router_module
from backend.main import app


ANSWER_PAYLOAD = {
    "query": "Use the displayed prior review summary to explain wage response options.",
    "top_k": 5,
    "ef_search": 100,
}


def main() -> None:
    connection = engine.connect()
    transaction = connection.begin()
    session = Session(bind=connection)

    owner = _new_user("owner")
    other_user = _new_user("other")
    session.add_all([owner, other_user])
    session.flush()

    ids = _seed_rows(session, owner=owner, other_user=other_user)
    session.commit()

    def override_get_db():
        yield session

    def override_current_user() -> User:
        return owner

    original_generate_answer_response = scn001_router_module.generate_answer_response
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[require_current_user] = override_current_user

    try:
        client = TestClient(app)

        _check_delete_before_job(client, session, ids, owner)
        _check_delete_bridge_run(client, session, ids, owner)
        _check_history_visibility(client, ids)
        _check_hidden_before_blocks_bridge_creation(client, session, ids)
        _check_hidden_bridge_answer_blocks_before_generation(
            client,
            ids,
            original_generate_answer_response=original_generate_answer_response,
        )
    finally:
        scn001_router_module.generate_answer_response = original_generate_answer_response
        app.dependency_overrides.clear()
        session.close()
        transaction.rollback()
        connection.close()

    print("ok scn001_history_deletion")


def _check_delete_before_job(
    client: TestClient,
    session: Session,
    ids: dict[str, str],
    owner: User,
) -> None:
    response = client.delete(f"/api/v1/scn001/before-review-jobs/{ids['delete_before']}")
    assert response.status_code == 204, response.text
    assert response.content == b""
    session.expire_all()

    deleted_job = session.get(BeforeReviewJob, ids["delete_before"])
    assert deleted_job is not None
    assert deleted_job.user_hidden_at is not None
    assert deleted_job.user_hidden_by_user_id == owner.id

    response = client.delete("/api/v1/scn001/before-review-jobs/missing-before-job")
    assert response.status_code == 204, response.text

    response = client.delete(f"/api/v1/scn001/before-review-jobs/{ids['other_before']}")
    assert response.status_code == 204, response.text
    session.expire_all()
    other_job = session.get(BeforeReviewJob, ids["other_before"])
    assert other_job is not None
    assert other_job.user_hidden_at is None

    hidden_before = session.get(BeforeReviewJob, ids["already_hidden_before"])
    assert hidden_before is not None
    hidden_at = hidden_before.user_hidden_at
    response = client.delete(
        f"/api/v1/scn001/before-review-jobs/{ids['already_hidden_before']}"
    )
    assert response.status_code == 204, response.text
    session.expire_all()
    hidden_before = session.get(BeforeReviewJob, ids["already_hidden_before"])
    assert hidden_before is not None
    assert hidden_before.user_hidden_at == hidden_at


def _check_delete_bridge_run(
    client: TestClient,
    session: Session,
    ids: dict[str, str],
    owner: User,
) -> None:
    response = client.delete(f"/api/v1/scn001/bridge-runs/{ids['delete_bridge']}")
    assert response.status_code == 204, response.text
    assert response.content == b""
    session.expire_all()

    deleted_bridge = session.get(BridgeRun, ids["delete_bridge"])
    assert deleted_bridge is not None
    assert deleted_bridge.user_hidden_at is not None
    assert deleted_bridge.user_hidden_by_user_id == owner.id

    source_job = session.get(BeforeReviewJob, ids["visible_before"])
    assert source_job is not None
    assert source_job.user_hidden_at is None

    response = client.delete("/api/v1/scn001/bridge-runs/missing-bridge-run")
    assert response.status_code == 204, response.text

    response = client.delete(f"/api/v1/scn001/bridge-runs/{ids['other_bridge']}")
    assert response.status_code == 204, response.text
    session.expire_all()
    other_bridge = session.get(BridgeRun, ids["other_bridge"])
    assert other_bridge is not None
    assert other_bridge.user_hidden_at is None

    hidden_bridge = session.get(BridgeRun, ids["already_hidden_bridge"])
    assert hidden_bridge is not None
    hidden_at = hidden_bridge.user_hidden_at
    response = client.delete(
        f"/api/v1/scn001/bridge-runs/{ids['already_hidden_bridge']}"
    )
    assert response.status_code == 204, response.text
    session.expire_all()
    hidden_bridge = session.get(BridgeRun, ids["already_hidden_bridge"])
    assert hidden_bridge is not None
    assert hidden_bridge.user_hidden_at == hidden_at


def _check_history_visibility(client: TestClient, ids: dict[str, str]) -> None:
    response = client.get("/api/v1/scn001/before-review-jobs")
    assert response.status_code == 200, response.text
    before_ids = {item["before_review_job_id"] for item in response.json()}
    assert ids["visible_before"] in before_ids
    assert ids["delete_before"] not in before_ids
    assert ids["already_hidden_before"] not in before_ids
    assert ids["source_hidden_before"] not in before_ids
    assert ids["other_before"] not in before_ids

    response = client.get(f"/api/v1/scn001/before-review-jobs/{ids['visible_before']}")
    assert response.status_code == 200, response.text
    response = client.get(f"/api/v1/scn001/before-review-jobs/{ids['delete_before']}")
    assert response.status_code == 404, response.text
    response = client.get(
        f"/api/v1/scn001/before-review-jobs/{ids['already_hidden_before']}"
    )
    assert response.status_code == 404, response.text
    response = client.get(f"/api/v1/scn001/before-review-jobs/{ids['other_before']}")
    assert response.status_code == 404, response.text

    response = client.get("/api/v1/scn001/bridge-runs")
    assert response.status_code == 200, response.text
    bridge_ids = {item["bridge_run_id"] for item in response.json()}
    assert ids["visible_bridge"] in bridge_ids
    assert ids["delete_bridge"] not in bridge_ids
    assert ids["already_hidden_bridge"] not in bridge_ids
    assert ids["source_hidden_bridge"] not in bridge_ids
    assert ids["other_bridge"] not in bridge_ids

    response = client.get(f"/api/v1/scn001/bridge-runs/{ids['visible_bridge']}")
    assert response.status_code == 200, response.text
    response = client.get(f"/api/v1/scn001/bridge-runs/{ids['delete_bridge']}")
    assert response.status_code == 404, response.text
    response = client.get(
        f"/api/v1/scn001/bridge-runs/{ids['already_hidden_bridge']}"
    )
    assert response.status_code == 404, response.text
    response = client.get(f"/api/v1/scn001/bridge-runs/{ids['source_hidden_bridge']}")
    assert response.status_code == 404, response.text


def _check_hidden_before_blocks_bridge_creation(
    client: TestClient,
    session: Session,
    ids: dict[str, str],
) -> None:
    before_count = _bridge_run_count(session)
    response = client.post(
        "/api/v1/scn001/bridge-runs",
        json={"before_review_job_id": ids["source_hidden_before"]},
    )
    assert response.status_code == 404, response.text
    session.expire_all()
    assert _bridge_run_count(session) == before_count


def _check_hidden_bridge_answer_blocks_before_generation(
    client: TestClient,
    ids: dict[str, str],
    *,
    original_generate_answer_response: Any,
) -> None:
    generation_calls: list[str] = []

    def fail_if_called(*args: Any, **kwargs: Any) -> Any:
        generation_calls.append("called")
        return original_generate_answer_response(*args, **kwargs)

    scn001_router_module.generate_answer_response = fail_if_called
    try:
        response = client.post(
            f"/api/v1/scn001/bridge-runs/{ids['already_hidden_bridge']}/answer",
            json=ANSWER_PAYLOAD,
        )
        assert response.status_code == 404, response.text

        response = client.post(
            f"/api/v1/scn001/bridge-runs/{ids['source_hidden_bridge']}/answer",
            json=ANSWER_PAYLOAD,
        )
        assert response.status_code == 404, response.text
    finally:
        scn001_router_module.generate_answer_response = original_generate_answer_response

    assert generation_calls == []


def _seed_rows(
    session: Session,
    *,
    owner: User,
    other_user: User,
) -> dict[str, str]:
    ids = {
        "visible_before": _id("before-visible"),
        "delete_before": _id("before-delete"),
        "already_hidden_before": _id("before-hidden"),
        "source_hidden_before": _id("before-src-hidden"),
        "other_before": _id("before-other"),
        "visible_bridge": _id("bridge-visible"),
        "delete_bridge": _id("bridge-delete"),
        "already_hidden_bridge": _id("bridge-hidden"),
        "source_hidden_bridge": _id("bridge-src-hidden"),
        "other_bridge": _id("bridge-other"),
    }
    hidden_at = datetime.now(timezone.utc) - timedelta(minutes=5)

    session.add_all(
        [
            _before_job(ids["visible_before"], owner),
            _before_job(ids["delete_before"], owner),
            _before_job(
                ids["already_hidden_before"],
                owner,
                hidden_at=hidden_at,
                hidden_by=owner.id,
            ),
            _before_job(
                ids["source_hidden_before"],
                owner,
                hidden_at=hidden_at,
                hidden_by=owner.id,
            ),
            _before_job(ids["other_before"], other_user),
            _bridge_run(ids["visible_bridge"], owner, ids["visible_before"]),
            _bridge_run(ids["delete_bridge"], owner, ids["visible_before"]),
            _bridge_run(
                ids["already_hidden_bridge"],
                owner,
                ids["visible_before"],
                hidden_at=hidden_at,
                hidden_by=owner.id,
            ),
            _bridge_run(ids["source_hidden_bridge"], owner, ids["source_hidden_before"]),
            _bridge_run(ids["other_bridge"], other_user, ids["other_before"]),
        ]
    )
    return ids


def _before_job(
    job_id: str,
    user: User,
    *,
    hidden_at: datetime | None = None,
    hidden_by: str | None = None,
) -> BeforeReviewJob:
    return BeforeReviewJob(
        job_id=job_id,
        user_id=user.id,
        user_hidden_at=hidden_at,
        user_hidden_by_user_id=hidden_by,
        status="completed",
        steps=[],
        error=None,
        result=_before_result(job_id),
    )


def _bridge_run(
    bridge_run_id: str,
    user: User,
    before_review_job_id: str,
    *,
    hidden_at: datetime | None = None,
    hidden_by: str | None = None,
) -> BridgeRun:
    return BridgeRun(
        bridge_run_id=bridge_run_id,
        user_id=user.id,
        user_hidden_at=hidden_at,
        user_hidden_by_user_id=hidden_by,
        before_review_job_id=before_review_job_id,
        scenario_id="SCN-001",
        source_scenario="before_review",
        preset_id=None,
        user_visible_summary="Wage payment terms and contract clauses need review.",
        issue_categories=["wage"],
        risk_tags=["wage"],
        detected_issues=[],
        law_refs=["Labor Standards Act Article 36"],
        recommended_next_actions=["Organize wage payment records."],
        after_query_seed_hash="a" * 64,
        artifact_refs=[],
    )


def _before_result(label: str) -> dict[str, Any]:
    return {
        "review_id": f"review-{label}",
        "summary": "Wage payment terms and contract clauses need review.",
        "overall_result": "WARNING",
        "overall_severity": "MEDIUM",
        "scenario_tags": ["wage"],
        "contract_info": {
            "type": "employment contract",
            "employee": "test employee",
            "employer": "test employer",
        },
        "user_explanation": {
            "headline": "Wage payment terms need review",
            "plain_language_summary": "Wage payment terms should be checked.",
            "important_points": [
                {
                    "title": "Wage payment",
                    "severity": "MEDIUM",
                    "law_ref": "Labor Standards Act Article 36",
                    "description": "Check final wage payment obligations.",
                }
            ],
        },
        "risk_summary": {},
    }


def _new_user(label: str) -> User:
    return User(
        id=str(uuid.uuid4()),
        auth_provider="verify",
        provider_subject=f"{label}-{uuid.uuid4().hex}",
        display_name=None,
        email=None,
        last_login_at=datetime.now(timezone.utc),
    )


def _id(prefix: str) -> str:
    return f"{prefix[:10]}{uuid.uuid4().hex}"[:32]


def _bridge_run_count(session: Session) -> int:
    value = session.execute(select(func.count()).select_from(BridgeRun)).scalar_one()
    return int(value)


if __name__ == "__main__":
    main()
