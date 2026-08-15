class TestDashboardAndInstitution:
    def test_dashboard_stats(self, client, register_payload, auth_headers, document_payload):
        client.post("/api/auth/register", json=register_payload)
        client.post("/api/documents", headers=auth_headers, json=document_payload)
        client.post("/api/documents", headers=auth_headers, json=document_payload)

        response = client.get("/api/dashboard", headers=auth_headers)
        assert response.status_code == 200
        body = response.json()
        assert body["total_documents"] == 2
        assert body["valid_documents"] == 2
        assert body["revoked_documents"] == 0
        assert "recent_activity" in body
        assert any(e["action"] == "DOCUMENT_SIGNED" for e in body["recent_activity"])

    def test_institution_update_and_read(self, client, register_payload, auth_headers):
        client.post("/api/auth/register", json=register_payload)
        update = client.put(
            "/api/institutions/me",
            headers=auth_headers,
            json={"legal_name": "Instituto Renovado", "city": "Benguela", "website": "https://renovado.ao"},
        )
        assert update.status_code == 200
        assert update.json()["legal_name"] == "Instituto Renovado"

        read = client.get("/api/institutions/me", headers=auth_headers)
        assert read.status_code == 200
        assert read.json()["city"] == "Benguela"

    def test_audit_log_endpoint(self, client, register_payload, auth_headers):
        client.post("/api/auth/register", json=register_payload)
        response = client.get("/api/audit", headers=auth_headers)
        assert response.status_code == 200
        body = response.json()
        assert body["total"] >= 1
        actions = {entry["action"] for entry in body["items"]}
        assert {"USER_CREATED", "LOGIN"} <= actions

    def test_user_crud(self, client, register_payload, auth_headers):
        client.post("/api/auth/register", json=register_payload)
        created = client.post(
            "/api/users",
            headers=auth_headers,
            json={"name": "Emissor Ana", "email": "emissor@inst.ao", "password": "senha-segura-123", "role": "ISSUER"},
        )
        assert created.status_code == 201, created.text
        user_id = created.json()["id"]

        updated = client.put(
            f"/api/users/{user_id}", headers=auth_headers, json={"role": "VIEWER"}
        )
        assert updated.status_code == 200
        assert updated.json()["role"] == "VIEWER"

        listing = client.get("/api/users", headers=auth_headers)
        assert listing.status_code == 200
        assert len(listing.json()) == 2

        assert client.delete(f"/api/users/{user_id}", headers=auth_headers).status_code == 204
        assert len(client.get("/api/users", headers=auth_headers).json()) == 1

    def test_document_filtering(self, client, register_payload, auth_headers, document_payload):
        client.post("/api/auth/register", json=register_payload)
        client.post("/api/documents", headers=auth_headers, json=document_payload)
        second = dict(document_payload, document_type="DIPLOMA", title="Diploma de Mestre")
        client.post("/api/documents", headers=auth_headers, json=second)

        by_type = client.get("/api/documents?document_type=DIPLOMA", headers=auth_headers)
        assert by_type.status_code == 200
        assert by_type.json()["total"] == 1

        search = client.get("/api/documents?search=Diploma", headers=auth_headers)
        assert search.json()["total"] == 1

        by_status = client.get("/api/documents?status=VALID", headers=auth_headers)
        assert by_status.json()["total"] == 2

        paged = client.get("/api/documents?page=1&page_size=1", headers=auth_headers)
        assert paged.json()["total"] == 2
        assert len(paged.json()["items"]) == 1
