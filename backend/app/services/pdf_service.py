import base64
import os
from io import BytesIO

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.lib import colors

from app.models.document import Document
from app.models.institution import Institution
from app.services import qr_service

PUBLIC_DIR = os.environ.get("VERIDOC_PUBLIC_DIR", "/app/public")
_SEARCH_DIRS = [
    PUBLIC_DIR,
    os.path.join(os.path.dirname(__file__), "..", "..", "..", "public"),
]


def _find_asset(filename: str) -> str | None:
    for d in _SEARCH_DIRS:
        path = os.path.join(d, filename)
        if os.path.isfile(path):
            return path
    return None


def _data_url_to_bytes(data_url: str) -> bytes | None:
    if not data_url.startswith("data:"):
        return None
    try:
        _, rest = data_url.split(",", 1)
        return base64.b64decode(rest)
    except Exception:
        return None


def generate_document_pdf(
    doc: Document,
    institution: Institution,
    qr_png: bytes,
    institution_logo_data_url: str | None = None,
) -> BytesIO:
    buffer = BytesIO()
    page_w, page_h = A4

    c = canvas.Canvas(buffer, pagesize=A4)

    bg_path = _find_asset("modelo-fundo-doc.png")
    if bg_path:
        try:
            c.drawImage(bg_path, 0, 0, width=page_w, height=page_h,
                        preserveAspectRatio=True, anchor="c")
        except Exception:
            pass

    veridoc_logo_path = _find_asset("logotipo.png")
    if veridoc_logo_path and os.path.isfile(veridoc_logo_path):
        try:
            c.drawImage(veridoc_logo_path, 40, page_h - 72, width=90, height=48)
        except Exception:
            pass

    if institution_logo_data_url:
        logo_bytes = _data_url_to_bytes(institution_logo_data_url)
        if logo_bytes:
            try:
                from PIL import Image as PILImage
                img = PILImage.open(BytesIO(logo_bytes))
                temp = BytesIO()
                img.save(temp, format="PNG")
                temp.seek(0)
                c.drawImage(temp, page_w - 130, page_h - 72, width=90, height=48)
            except Exception:
                pass

    try:
        qr_buf = BytesIO(qr_png)
        c.drawImage(qr_buf, page_w - 115, page_h - 170, width=80, height=80,
                    preserveAspectRatio=True, anchor="nw")
        c.setFont("Helvetica", 6)
        c.setFillColor(colors.Color(0.47, 0.47, 0.47))
        c.drawCentredString(page_w - 75, page_h - 185, "Verifique a autenticidade")
        c.drawCentredString(page_w - 75, page_h - 193, "deste documento")
    except Exception:
        pass

    navy = colors.Color(18 / 255, 30 / 255, 69 / 255)
    grey = colors.Color(100 / 255, 100 / 255, 100 / 255)
    dark = colors.Color(20 / 255, 20 / 255, 20 / 255)

    y = page_h - 210

    c.setFont("Helvetica-Bold", 18)
    c.setFillColor(navy)
    c.drawCentredString(page_w / 2, y, doc.title.upper())
    y -= 22

    c.setFont("Helvetica", 11)
    c.setFillColor(grey)
    c.drawCentredString(page_w / 2, y, institution.legal_name)
    y -= 30

    c.setFont("Helvetica-Bold", 10)
    c.setFillColor(navy)
    c.drawString(50, y, "INFORMACOES DO DOCUMENTO")
    y -= 18

    fields = [
        ("Tipo de documento:", doc.document_type),
        ("Numero:", doc.document_number),
        ("Titular:", doc.holder_name),
        ("Data de emissao:", doc.issued_at.strftime("%d/%m/%Y") if doc.issued_at else "\u2014"),
        ("Estado:", doc.status),
        ("Codigo de validacao:", doc.verification_code),
    ]

    for label, value in fields:
        c.setFont("Helvetica", 9)
        c.setFillColor(grey)
        c.drawString(50, y, label)
        c.setFont("Helvetica-Bold", 9)
        c.setFillColor(dark)
        c.drawString(190, y, value)
        y -= 15

    y -= 10

    c.setFont("Helvetica-Bold", 10)
    c.setFillColor(navy)
    c.drawString(50, y, "SEGURANCA E INTEGRIDADE")
    y -= 16

    c.setFont("Helvetica", 9)
    c.setFillColor(grey)
    c.drawString(50, y, "Hash SHA-256:")
    y -= 14

    c.setFont("Courier", 7)
    c.setFillColor(dark)
    h = doc.content_hash
    c.drawString(50, y, h[:80])
    y -= 10
    if len(h) > 80:
        c.drawString(50, y, h[80:160])
        y -= 10
    if len(h) > 160:
        c.drawString(50, y, h[160:])
        y -= 10
    y -= 8

    c.setFont("Helvetica-Bold", 10)
    c.setFillColor(navy)
    c.drawString(50, y, "ASSINATURA DIGITAL")
    y -= 16

    c.setFont("Helvetica", 9)
    c.setFillColor(grey)
    c.drawString(50, y, "Algoritmo:")
    c.setFillColor(dark)
    if doc.signature:
        c.drawString(120, y, doc.signature.algorithm)
    y -= 14

    c.setFillColor(grey)
    c.drawString(50, y, "Assinado por:")
    c.setFillColor(dark)
    if doc.signature:
        c.drawString(145, y, doc.signature.signed_by)
    y -= 14

    c.setFillColor(grey)
    c.drawString(50, y, "Data:")
    c.setFillColor(dark)
    if doc.signature and doc.signature.created_at:
        c.drawString(90, y, doc.signature.created_at.strftime("%d/%m/%Y"))
    y -= 22

    c.setFont("Helvetica-Bold", 10)
    c.setFillColor(navy)
    c.drawString(50, y, "VALIDACAO DO DOCUMENTO")
    y -= 16

    ver_url = qr_service.verification_url(doc.verification_code)
    c.setFont("Helvetica", 9)
    c.setFillColor(grey)
    c.drawString(50, y, "Aceda a:")
    c.setFillColor(dark)
    c.drawString(110, y, ver_url)
    y -= 14

    c.setFillColor(grey)
    c.drawString(50, y, "Codigo:")
    c.setFillColor(dark)
    c.drawString(110, y, doc.verification_code)
    y -= 30

    c.setFont("Helvetica", 7)
    c.setFillColor(colors.Color(0.55, 0.55, 0.55))
    c.drawCentredString(page_w / 2, 50, "VeriDoc - Plataforma Oficial de Documentos Digitais da Republica de Angola")
    issued_str = doc.issued_at.strftime("%d/%m/%Y") if doc.issued_at else "\u2014"
    c.drawCentredString(page_w / 2, 40, f"Emitido em {issued_str} | Verificado automaticamente")

    if doc.status == "REVOKED":
        c.setFont("Helvetica-Bold", 9)
        c.setFillColor(colors.red)
        revoked_str = f"DOCUMENTO REVOGADO em {doc.revoked_at.strftime('%d/%m/%Y') if doc.revoked_at else '\u2014'}: {doc.revoked_reason or 'Sem motivo registado.'}"
        c.drawCentredString(page_w / 2, 28, revoked_str)

    c.save()
    buffer.seek(0)
    return buffer
