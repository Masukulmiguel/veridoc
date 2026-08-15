import hashlib
import json
from datetime import datetime, timezone
from typing import Any


def sha256_hex(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def canonical_json(data: dict[str, Any]) -> bytes:
    return json.dumps(
        data, sort_keys=True, separators=(",", ":"), ensure_ascii=False
    ).encode("utf-8")


def document_hash(payload: dict[str, Any]) -> str:
    return sha256_hex(canonical_json(payload))


def canonical_datetime(value: datetime) -> str:
    """Formata uma data de forma determinística (UTC, sem sufixo de fuso).

    Datas 'naive' são tratadas como UTC, garantindo que o mesmo instante
    produz sempre o mesmo hash, independentemente do armazenamento.
    """
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    else:
        value = value.astimezone(timezone.utc)
    return value.replace(tzinfo=None).isoformat()


def as_utc(value: datetime | None) -> datetime | None:
    if value is None:
        return None
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)
