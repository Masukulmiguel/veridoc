import io

import qrcode

from app.core.config import settings


def verification_url(code: str) -> str:
    base = settings.VERIDOC_PUBLIC_URL.rstrip("/")
    return f"{base}/verificar/{code}"


def generate_qr_png(code: str) -> bytes:
    url = verification_url(code)
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10,
        border=4,
    )
    qr.add_data(url)
    qr.make(fit=True)
    image = qr.make_image(fill_color="black", back_color="white")
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    return buffer.getvalue()
