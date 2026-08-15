from app.core.security import hash_password, verify_password
from app.services.signature_service import sign_bytes, verify_signature
from app.utils.hashing import canonical_json, document_hash


class TestPasswordHashing:
    def test_hash_and_verify(self):
        stored = hash_password("senha-segura-123")
        assert stored.startswith("pbkdf2_sha256$")
        assert verify_password("senha-segura-123", stored) is True

    def test_wrong_password_rejected(self):
        stored = hash_password("senha-segura-123")
        assert verify_password("senha-errada", stored) is False

    def test_malformed_hash_rejected(self):
        assert verify_password("qualquer", "not-a-valid-hash") is False

    def test_same_password_different_salts(self):
        assert hash_password("abc") != hash_password("abc")


class TestSignatures:
    def test_sign_and_verify_roundtrip(self):
        data = b"conteudo autentico"
        signature = sign_bytes(data)
        assert verify_signature(data, signature) is True

    def test_tampered_data_rejected(self):
        signature = sign_bytes(b"conteudo original")
        assert verify_signature(b"conteudo ALTERADO", signature) is False

    def test_corrupted_signature_rejected(self):
        signature = sign_bytes(b"conteudo original")
        assert verify_signature(b"conteudo original", signature + "X") is False


class TestHashing:
    def test_document_hash_stable(self):
        payload = {"title": "A", "num": 1, "nested": {"b": 2, "a": 1}}
        assert document_hash(payload) == document_hash(payload)

    def test_canonical_json_key_order_independent(self):
        a = canonical_json({"b": 1, "a": 2})
        b = canonical_json({"a": 2, "b": 1})
        assert a == b

    def test_different_content_different_hash(self):
        assert document_hash({"x": 1}) != document_hash({"x": 2})
