import base64
import os
from io import BytesIO

from reportlab.lib.pagesizes import A4
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


def _draw_line(c, x1, y1, x2, y2, clr, width=0.3):
    c.setStrokeColor(clr)
    c.setLineWidth(width)
    c.line(x1, y1, x2, y2)


def generate_document_pdf(
    doc: Document,
    institution: Institution,
    qr_png: bytes,
    institution_logo_data_url: str | None = None,
) -> BytesIO:
    buffer = BytesIO()
    page_w, page_h = A4

    ML = 55
    MR = page_w - 55
    CW = MR - ML
    CX = ML + CW / 2

    navy = colors.Color(18 / 255, 30 / 255, 69 / 255)
    grey = colors.Color(110 / 255, 110 / 255, 110 / 255)
    light_grey = colors.Color(150 / 255, 150 / 255, 150 / 255)
    dark = colors.Color(25 / 255, 25 / 255, 25 / 255)
    line_clr = colors.Color(200 / 255, 208 / 255, 220 / 255)

    c = canvas.Canvas(buffer, pagesize=A4)

    bg_path = _find_asset("modelo-fundo-doc.png")
    if bg_path:
        try:
            c.drawImage(bg_path, 0, 0, width=page_w, height=page_h,
                        preserveAspectRatio=True, anchor="c")
        except Exception:
            pass

    y = page_h - 55

    veridoc_logo_path = _find_asset("logotipo.png")
    if veridoc_logo_path and os.path.isfile(veridoc_logo_path):
        try:
            c.drawImage(veridoc_logo_path, ML, y - 38, width=110, height=38,
                        preserveAspectRatio=True, anchor="sw")
        except Exception:
            pass

    qr_size = 62
    qr_x = MR - qr_size
    try:
        qr_buf = BytesIO(qr_png)
        c.drawImage(qr_buf, qr_x, y - 38 - qr_size, width=qr_size, height=qr_size,
                    preserveAspectRatio=True, anchor="sw")
        c.setFont("Helvetica", 6)
        c.setFillColor(light_grey)
        c.drawCentredString(qr_x + qr_size / 2, y - 38 - qr_size - 9, "Verificar autenticidade")
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
                c.drawImage(temp, MR - 110, y - 38, width=110, height=38,
                            preserveAspectRatio=True, anchor="sw")
            except Exception:
                pass

    _draw_line(c, ML, y - 48, MR, y - 48, line_clr, 0.5)
    y -= 68

    c.setFont("Helvetica-Bold", 20)
    c.setFillColor(navy)
    c.drawCentredString(CX, y, doc.title.upper())
    y += 16

    c.setFont("Helvetica", 8)
    c.setFillColor(light_grey)
    c.drawCentredString(CX, y, "Documento digital verificavel")
    y += 18

    _draw_line(c, ML + CW * 0.35, y, MR - CW * 0.35, y, line_clr, 0.3)
    y += 20

    c.setFont("Helvetica", 9)
    c.setFillColor(grey)
    c.drawCentredString(CX, y, "INSTITUICAO EMISSORA")
    y += 18

    c.setFont("Helvetica-Bold", 12)
    c.setFillColor(dark)
    c.drawCentredString(CX, y, institution.legal_name)
    y += 28

    c.setFont("Helvetica", 9)
    c.setFillColor(grey)
    c.drawCentredString(CX, y, "Certifica-se que")
    y += 22

    c.setFont("Helvetica-Bold", 22)
    c.setFillColor(navy)
    c.drawCentredString(CX, y, doc.holder_name.upper())
    y += 10

    _draw_line(c, CX - 80, y, CX + 80, y, navy, 0.6)
    y += 30

    _draw_line(c, ML, y, MR, y, line_clr, 0.5)
    y -= 18

    c.setFont("Helvetica-Bold", 9)
    c.setFillColor(navy)
    c.drawString(ML, y, "INFORMACOES DO DOCUMENTO")
    y -= 18

    col_label = ML
    col_value = ML + 155

    info_fields = [
        ("Tipo de documento", doc.document_type),
        ("Numero", doc.document_number),
        ("Titular", doc.holder_name),
        ("Data de emissao", doc.issued_at.strftime("%d/%m/%Y") if doc.issued_at else "\u2014"),
        ("Estado", "VALIDADO" if doc.status == "VALID" else doc.status),
        ("Codigo de validacao", doc.verification_code),
    ]

    for label, value in info_fields:
        c.setFont("Helvetica", 8.5)
        c.setFillColor(grey)
        c.drawString(col_label, y, label)
        c.setFont("Helvetica-Bold", 8.5)
        c.setFillColor(dark)
        c.drawString(col_value, y, value)
        y -= 14

    y -= 8
    _draw_line(c, ML, y, MR, y, line_clr, 0.5)
    y -= 18

    c.setFont("Helvetica-Bold", 9)
    c.setFillColor(navy)
    c.drawString(ML, y, "SEGURANCA E INTEGRIDADE")
    y -= 16

    c.setFont("Courier", 7)
    c.setFillColor(dark)
    h = doc.content_hash
    max_len = 85
    offset = 0
    while offset < len(h):
        c.drawString(ML, y, h[offset:offset + max_len])
        y -= 10
        offset += max_len
    y -= 8

    _draw_line(c, ML, y, MR, y, line_clr, 0.5)
    y -= 18

    c.setFont("Helvetica-Bold", 9)
    c.setFillColor(navy)
    c.drawString(ML, y, "ASSINATURA DIGITAL")
    y -= 18

    sig_fields = [
        ("Algoritmo", doc.signature.algorithm if doc.signature else "\u2014"),
        ("Assinado por", doc.signature.signed_by if doc.signature else "\u2014"),
        ("Data", doc.signature.created_at.strftime("%d/%m/%Y") if doc.signature and doc.signature.created_at else "\u2014"),
    ]

    for label, value in sig_fields:
        c.setFont("Helvetica", 8.5)
        c.setFillColor(grey)
        c.drawString(col_label, y, label)
        c.setFont("Helvetica-Bold", 8.5)
        c.setFillColor(dark)
        c.drawString(col_value, y, value)
        y -= 14

    y -= 8
    _draw_line(c, ML, y, MR, y, line_clr, 0.5)
    y -= 18

    c.setFont("Helvetica-Bold", 9)
    c.setFillColor(navy)
    c.drawString(ML, y, "VALIDACAO DO DOCUMENTO")
    y -= 18

    c.setFont("Helvetica", 8.5)
    c.setFillColor(grey)
    c.drawString(col_label, y, "Codigo de validacao")
    c.setFont("Courier-Bold", 10)
    c.setFillColor(navy)
    c.drawString(col_value, y, doc.verification_code)
    y -= 18

    ver_url = qr_service.verification_url(doc.verification_code)
    c.setFont("Helvetica", 8.5)
    c.setFillColor(grey)
    c.drawString(col_label, y, "URL de validacao")
    c.setFont("Helvetica", 7.5)
    c.setFillColor(dark)
    c.drawString(col_value, y, ver_url)

    y = page_h - 55
    _draw_line(c, ML, y, MR, y, line_clr, 0.5)
    y -= 14

    c.setFont("Helvetica", 6.5)
    c.setFillColor(light_grey)
    c.drawCentredString(CX, y, "VeriDoc \u2014 Plataforma Oficial de Documentos Digitais da Republica de Angola")
    y -= 10
    issued_str = doc.issued_at.strftime("%d/%m/%Y") if doc.issued_at else "\u2014"
    c.drawCentredString(CX, y, f"Emitido em {issued_str} | Verificado automaticamente")

    if doc.status == "REVOKED":
        c.setFont("Helvetica-Bold", 9)
        c.setFillColor(colors.red)
        revoked_str = f"DOCUMENTO REVOGADO em {doc.revoked_at.strftime('%d/%m/%Y') if doc.revoked_at else '\u2014'}: {doc.revoked_reason or 'Sem motivo registado.'}"
        c.drawCentredString(CX, y - 18, revoked_str)

    c.save()
    buffer.seek(0)
    return buffer
