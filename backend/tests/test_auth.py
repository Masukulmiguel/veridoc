class TestAuth:
    def test_register_and_login(self, client, register_payload, admin_credentials):
        reg = client.post("/api/auth/register", json=register_payload)
        assert reg.status_code == 201
        assert reg.json()["access_token"]

        login = client.post("/api/auth/login", json=admin_credentials)
        assert login.status_code == 200
        body = login.json()
        assert body["token_type"] == "Bearer"
        assert body["user"]["email"] == admin_credentials["email"]
        assert body["user"]["role"] == "ADMIN"

    def test_register_requires_terms(self, client, register_payload):
        payload = dict(register_payload, accept_terms=False)
        response = client.post("/api/auth/register", json=payload)
        assert response.status_code == 422

    def test_duplicate_email_rejected(self, client, register_payload):
        assert client.post("/api/auth/register", json=register_payload).status_code == 201
        response = client.post(
            "/api/auth/register", json=dict(register_payload, institution_name="Outra")
        )
        assert response.status_code == 409

    def test_login_wrong_password(self, client, register_payload, admin_credentials):
        client.post("/api/auth/register", json=register_payload)
        response = client.post(
            "/api/auth/login",
            json={**admin_credentials, "password": "palavra-errada-1"},
        )
        assert response.status_code == 401

    def test_login_unknown_email(self, client):
        response = client.post(
            "/api/auth/login",
            json={"email": "nobody@nowhere.ao", "password": "Senha-segura-123!"},
        )
        assert response.status_code == 401

    def test_me(self, client, register_payload, admin_credentials, auth_headers):
        client.post("/api/auth/register", json=register_payload)
        response = client.get("/api/auth/me", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["email"] == admin_credentials["email"]

    def test_me_without_token(self, client):
        assert client.get("/api/auth/me").status_code == 401

    def test_me_with_invalid_token(self, client):
        response = client.get("/api/auth/me", headers={"Authorization": "Bearer invalido"})
        assert response.status_code == 401

    def test_refresh_token(self, client, register_payload, admin_credentials):
        client.post("/api/auth/register", json=register_payload)
        login = client.post("/api/auth/login", json=admin_credentials).json()
        response = client.post(
            "/api/auth/refresh", json={"refresh_token": login["refresh_token"]}
        )
        assert response.status_code == 200
        assert response.json()["access_token"]

    def test_access_token_cannot_refresh(self, client, register_payload, admin_credentials):
        client.post("/api/auth/register", json=register_payload)
        login = client.post("/api/auth/login", json=admin_credentials).json()
        response = client.post(
            "/api/auth/refresh", json={"refresh_token": login["access_token"]}
        )
        assert response.status_code == 401
