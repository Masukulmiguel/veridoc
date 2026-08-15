import re

from app.core.database import SessionLocal
from app.models.document import Document


class TestDocumentFlow:
    def test_create_document_signed(self, client, register_payload, auth_headers, document_payload):
        client.post("/api/auth/register", json=register_payload)
        response = client.post("/api/documents", headers=auth_headers, json=document_payload)
        assert response.status_code == 201, response.text
        doc = response.json()

        assert doc["status"] == "VALID"
        assert re.fullmatch(r"VD-[A-Z0-9]{10}", doc["verification_code"])
        assert re.fullmatch(r"[A-Z]+-\d{4}-[A-Z0-9]{6}", doc["number"])
        assert len(doc["content_hash"]) == 64
        assert doc["signature"]["algorithm"] == "RS256"
        assert doc["signature"]["signed_by"] == "Adelina Teste"
        assert len(doc["fields"]) == 2
        assert any(entry["action"] == "DOCUMENT_SIGNED" for entry in doc["history"])

    def test_validation_payload(self, client, register_payload, auth_headers):
        client.post("/api/auth/register", json=register_payload)
        response = client.post(
            "/api/documents",
            headers=auth_headers,
            json={"document_type": "X", "title": "A", "holder_name": "B"},
        )
        assert response.status_code == 422

    def test_document_verification_cycle(self, client, register_payload, auth_headers, document_payload):
        client.post("/api/auth/register", json=register_payload)
        doc = client.post("/api/documents", headers=auth_headers, json=document_payload).json()
        code = doc["verification_code"]

        result = client.get(f"/api/verify/{code}").json()
        assert result["status"] == "VALID"
        assert result["signature"]["valid"] is True
        assert result["document"]["title"] == document_payload["title"]

        revoke = client.post(
            f"/api/documents/{doc['id']}/revoke",
            headers=auth_headers,
            json={"reason": "Emitido por engano"},
        )
        assert revoke.status_code == 200
        assert revoke.json()["status"] == "REVOKED"

        result = client.get(f"/api/verify/{code}").json()
        assert result["status"] == "REVOKED"
        assert "revogado" in result["message"].lower()

    def test_unknown_code_not_found(self, client):
        result = client.get("/api/verify/VD-XXXXXXXXXX").json()
        assert result["status"] == "INVALID"
        assert result["document"] is None

    def test_tampered_document_detected(self, client, register_payload, auth_headers, document_payload):
        client.post("/api/auth/register", json=register_payload)
        doc = client.post("/api/documents", headers=auth_headers, json=document_payload).json()

        with SessionLocal() as db:
            record = db.get(Document, doc["id"])
            record.title = "Título ALTERADO após emissão"
            db.commit()

        result = client.get(f"/api/verify/{doc['verification_code']}").json()
        assert result["status"] == "INVALID"
        assert result["signature"]["valid"] is False

    def test_expired_document(self, client, register_payload, auth_headers, document_payload):
        import datetime

        from app.core.database import SessionLocal as Session
        from app.models.document import Document as Doc

        client.post("/api/auth/register", json=register_payload)
        past = (datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=10)).isoformat()
        payload = dict(document_payload, expires_at=past)
        doc = client.post("/api/documents", headers=auth_headers, json=payload).json()

        result = client.get(f"/api/verify/{doc['verification_code']}").json()
        assert result["status"] == "EXPIRED"

    def test_document_isolated_per_institution(self, client, register_payload, auth_headers, document_payload):
        client.post("/api/auth/register", json=register_payload)
        doc = client.post("/api/documents", headers=auth_headers, json=document_payload).json()

        other = client.post(
            "/api/auth/register",
            json={
                "name": "Outra Instituição",
                "email": "outra@inst.ao",
                "password": "senha-segura-123",
                "institution_name": "Outra Empresa",
                "accept_terms": True,
            },
        ).json()
        headers = {"Authorization": f"Bearer {other['access_token']}"}

        assert client.get(f"/api/documents/{doc['id']}", headers=headers).status_code == 404
        assert client.get("/api/documents", headers=headers).json()["total"] == 0

    def test_public_verification_does_not_need_auth(self, client, register_payload, auth_headers, document_payload):
        client.post("/api/auth/register", json=register_payload)
        doc = client.post("/api/documents", headers=auth_headers, json=document_payload).json()
        assert client.get(f"/api/verify/{doc['verification_code']}").status_code == 200
