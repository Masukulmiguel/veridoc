import secrets
import uuid

_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"


def generate_uuid() -> str:
    return str(uuid.uuid4())


def random_code(length: int = 12) -> str:
    return "".join(secrets.choice(_ALPHABET) for _ in range(length))


def generate_verification_code() -> str:
    return f"VD-{random_code(10)}"


def generate_document_number(institution_short: str = "INST", year: int | None = None) -> str:
    import datetime

    current_year = year or datetime.date.today().year
    seq = random_code(6)
    return f"{institution_short.upper()}-{current_year}-{seq}"
