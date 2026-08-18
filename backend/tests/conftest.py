import os
import tempfile
from pathlib import Path

_TMP_DIR = Path(tempfile.gettempdir()) / "veridoc-tests"
_TMP_DIR.mkdir(parents=True, exist_ok=True)

os.environ["DATABASE_URL"] = f"sqlite:///{_TMP_DIR / 'test.db'}"
os.environ["PRIVATE_KEY_PATH"] = str(_TMP_DIR / "test_private.pem")
os.environ["PUBLIC_KEY_PATH"] = str(_TMP_DIR / "test_public.pem")
os.environ["ENVIRONMENT"] = "test"
os.environ["JWT_SECRET_KEY"] = "test-secret-key"

import pytest
from fastapi.testclient import TestClient

import app.models  # noqa: F401  (não mover para baixo: `import app.models` rebindeia o nome `app`)

from app.core.database import Base, engine
from app.main import app


@pytest.fixture(scope="session", autouse=True)
def _prepare_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield


@pytest.fixture(autouse=True)
def _clean_database():
    yield
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


@pytest.fixture(scope="session")
def client() -> TestClient:
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def register_payload() -> dict:
    return {
        "name": "Adelina Teste",
        "email": "adelina@inst.ao",
        "password": "Senha-segura-123!",
        "institution_name": "Instituto de Teste",
        "tax_id": "5410000000",
        "accept_terms": True,
    }


@pytest.fixture
def admin_credentials() -> dict:
    return {"email": "adelina@inst.ao", "password": "Senha-segura-123!"}


@pytest.fixture
def registered_admin(client, register_payload, admin_credentials) -> dict:
    response = client.post("/api/auth/register", json=register_payload)
    assert response.status_code == 201, response.text
    login = client.post("/api/auth/login", json=admin_credentials)
    assert login.status_code == 200, login.text
    return login.json()


@pytest.fixture
def auth_headers(registered_admin) -> dict:
    return {"Authorization": f"Bearer {registered_admin['access_token']}"}


@pytest.fixture
def document_payload() -> dict:
    return {
        "document_type": "CERTIFICATE",
        "title": "Certificado de Conclusão",
        "holder_name": "João Pedro",
        "description": "Conclusão do curso de Programação Java.",
        "fields": [
            {"label": "Nota final", "value": "18 valores"},
            {"label": "Duração", "value": "12 meses"},
        ],
    }

