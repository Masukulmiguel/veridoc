import base64
import logging
from functools import lru_cache
from pathlib import Path

from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding, rsa

from app.core.config import settings

logger = logging.getLogger(__name__)

ALGORITHM = "RS256"
_BACKEND_DIR = Path(__file__).resolve().parents[2]


def _key_path(value: str) -> Path:
    path = Path(value)
    if not path.is_absolute():
        path = _BACKEND_DIR / path
    return path


@lru_cache(maxsize=1)
def _private_key() -> rsa.RSAPrivateKey:
    private_path = _key_path(settings.PRIVATE_KEY_PATH)
    if private_path.exists():
        return serialization.load_pem_private_key(private_path.read_bytes(), password=None)

    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    private_path.parent.mkdir(parents=True, exist_ok=True)
    private_path.write_bytes(
        key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption(),
        )
    )
    public_path = _key_path(settings.PUBLIC_KEY_PATH)
    public_path.write_bytes(
        key.public_key().public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo,
        )
    )
    logger.info("Par de chaves RSA gerado em %s", private_path)
    return key


def _public_key() -> rsa.RSAPublicKey:
    return _private_key().public_key()


def public_key_pem() -> bytes:
    return _public_key().public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    )


def sign_bytes(data: bytes) -> str:
    signature = _private_key().sign(data, padding.PKCS1v15(), hashes.SHA256())
    return base64.b64encode(signature).decode("ascii")


def verify_signature(data: bytes, signature_b64: str) -> bool:
    try:
        signature = base64.b64decode(signature_b64)
        _public_key().verify(signature, data, padding.PKCS1v15(), hashes.SHA256())
        return True
    except Exception:
        return False
