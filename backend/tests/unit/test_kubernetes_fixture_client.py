import pytest

from app.adapters.kubernetes.client import DEFAULT_FIXTURE, FixtureKubernetesClient
from app.core.errors import NotFoundError


@pytest.fixture(scope="module")
def client() -> FixtureKubernetesClient:
    return FixtureKubernetesClient.from_file(DEFAULT_FIXTURE)


def test_fixture_is_labelled_demo(client):
    assert client.demo is True
    assert client.cluster().demo is True


def test_list_namespaces(client):
    names = {n.name for n in client.list_namespaces()}
    assert {"prod", "staging"} <= names


def test_list_pods_filters_by_namespace(client):
    prod = client.list_pods("prod")
    assert prod
    assert all(p.namespace == "prod" for p in prod)
    staging = client.list_pods("staging")
    assert all(p.namespace == "staging" for p in staging)


def test_get_pod_and_missing(client):
    pod = client.get_pod("prod", "api-7d9f8b6c4-x2k9p")
    assert pod.name == "api-7d9f8b6c4-x2k9p"
    with pytest.raises(NotFoundError):
        client.get_pod("prod", "nope")


def test_events_are_filtered_by_object(client):
    events = client.list_events("prod", involved_object="api-7d9f8b6c4-x2k9p")
    assert events
    assert all(e.involved_object == "api-7d9f8b6c4-x2k9p" for e in events)


def test_logs_are_bounded_and_marked_demo(client):
    logs = client.get_pod_logs("prod", "api-7d9f8b6c4-x2k9p", tail_lines=2)
    assert logs.demo is True
    assert len(logs.lines) <= 2
