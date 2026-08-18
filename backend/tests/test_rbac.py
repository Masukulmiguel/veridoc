def _create_viewer(client, admin_headers):
    response = client.post(
        "/api/users",
        headers=admin_headers,
        json={
            "name": "Consulta Resende",
            "email": "consulta@inst.ao",
            "password": "Senha-segura-123!",
            "role": "VIEWER",
        },
    )
    assert response.status_code == 201, response.text
    login = client.post(
        "/api/auth/login",
        json={"email": "consulta@inst.ao", "password": "Senha-segura-123!"},
    )
    return login.json()


class TestRbac:
    def test_viewer_cannot_create_document(self, client, register_payload, auth_headers, document_payload):
        client.post("/api/auth/register", json=register_payload)
        viewer = _create_viewer(client, auth_headers)
        headers = {"Authorization": f"Bearer {viewer['access_token']}"}

        response = client.post("/api/documents", headers=headers, json=document_payload)
        assert response.status_code == 403

    def test_viewer_cannot_revoke(self, client, register_payload, auth_headers, document_payload):
        client.post("/api/auth/register", json=register_payload)
        doc = client.post("/api/documents", headers=auth_headers, json=document_payload)
        assert doc.status_code == 201, doc.text
        viewer = _create_viewer(client, auth_headers)
        headers = {"Authorization": f"Bearer {viewer['access_token']}"}

        response = client.post(
            f"/api/documents/{doc.json()['id']}/revoke",
            headers=headers,
            json={"reason": "tentativa não autorizada"},
        )
        assert response.status_code == 403

    def test_viewer_can_list_and_read(self, client, register_payload, auth_headers, document_payload):
        client.post("/api/auth/register", json=register_payload)
        doc = client.post("/api/documents", headers=auth_headers, json=document_payload)
        doc_id = doc.json()["id"]
        viewer = _create_viewer(client, auth_headers)
        headers = {"Authorization": f"Bearer {viewer['access_token']}"}

        assert client.get("/api/documents", headers=headers).status_code == 200
        assert client.get(f"/api/documents/{doc_id}", headers=headers).status_code == 200

    def test_anonymous_cannot_list(self, client):
        assert client.get("/api/documents").status_code == 401

    def test_non_admin_cannot_list_users(self, client, register_payload, auth_headers, document_payload):
        client.post("/api/auth/register", json=register_payload)
        viewer = _create_viewer(client, auth_headers)
        headers = {"Authorization": f"Bearer {viewer['access_token']}"}
        assert client.get("/api/users", headers=headers).status_code == 403

    def test_admin_cannot_revoke_own_role(self, client, register_payload, auth_headers):
        client.post("/api/auth/register", json=register_payload)
        user_id = client.get("/api/auth/me", headers=auth_headers).json()["id"]
        response = client.put(
            f"/api/users/{user_id}", headers=auth_headers, json={"role": "VIEWER"}
        )
        assert response.status_code == 422

    def test_admin_cannot_delete_self(self, client, register_payload, auth_headers):
        client.post("/api/auth/register", json=register_payload)
        user_id = client.get("/api/auth/me", headers=auth_headers).json()["id"]
        assert client.delete(f"/api/users/{user_id}", headers=auth_headers).status_code == 422
