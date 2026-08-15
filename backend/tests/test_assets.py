class TestGeneratedAssets:
    def test_qrcode_is_png(self, client, register_payload, auth_headers, document_payload):
        client.post("/api/auth/register", json=register_payload)
        doc = client.post("/api/documents", headers=auth_headers, json=document_payload).json()

        response = client.get(f"/api/documents/{doc['id']}/qrcode", headers=auth_headers)
        assert response.status_code == 200
        assert response.headers["content-type"] == "image/png"
        assert response.content.startswith(b"\x89PNG\r\n\x1a\n")

    def test_pdf_generated(self, client, register_payload, auth_headers, document_payload):
        client.post("/api/auth/register", json=register_payload)
        doc = client.post("/api/documents", headers=auth_headers, json=document_payload).json()

        response = client.get(f"/api/documents/{doc['id']}/pdf", headers=auth_headers)
        assert response.status_code == 200
        assert response.headers["content-type"] == "application/pdf"
        assert response.content.startswith(b"%PDF-")

    def test_assets_require_auth(self, client, register_payload, auth_headers, document_payload):
        client.post("/api/auth/register", json=register_payload)
        doc = client.post("/api/documents", headers=auth_headers, json=document_payload).json()
        assert client.get(f"/api/documents/{doc['id']}/qrcode").status_code == 401
        assert client.get(f"/api/documents/{doc['id']}/pdf").status_code == 401
