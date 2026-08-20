import base64
import math
import os
from io import BytesIO

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

from app.models.document import Document
from app.models.institution import Institution
from app.services import qr_service

PUBLIC_DIR = os.environ.get("VERIDOC_PUBLIC_DIR", "/app/public")
_SEARCH_DIRS = [
    PUBLIC_DIR,
    os.path.join(os.path.dirname(__file__), "..", "..", "..", "public"),
]

_FONT_REGISTERED = False
_FN = "Helvetica"
_FNB = "Helvetica-Bold"


def _register_fonts():
    global _FONT_REGISTERED, _FN, _FNB
    if _FONT_REGISTERED:
        return
    _FONT_REGISTERED = True
    candidates = [
        (os.path.join(os.path.dirname(__file__), "DejaVuSans.ttf"),
         os.path.join(os.path.dirname(__file__), "DejaVuSans-Bold.ttf")),
        ("C:/Windows/Fonts/arial.ttf", "C:/Windows/Fonts/arialbd.ttf"),
        ("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
         "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"),
    ]
    for reg, bld in candidates:
        if os.path.isfile(reg):
            try:
                pdfmetrics.registerFont(TTFont("CustomFont", reg))
                _FN = "CustomFont"
                if os.path.isfile(bld):
                    pdfmetrics.registerFont(TTFont("CustomFontBold", bld))
                    _FNB = "CustomFontBold"
                else:
                    _FNB = "CustomFont"
                return
            except Exception:
                pass


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


NAVY = colors.Color(18 / 255, 30 / 255, 69 / 255)
GREY = colors.Color(110 / 255, 110 / 255, 110 / 255)
LIGHT_GREY = colors.Color(150 / 255, 150 / 255, 150 / 255)
DARK = colors.Color(25 / 255, 25 / 255, 25 / 255)
CARD_BG = colors.Color(245 / 255, 247 / 255, 250 / 255)
CARD_BORDER = colors.Color(220 / 255, 225 / 255, 235 / 255)
GREEN = colors.Color(34 / 255, 150 / 255, 80 / 255)
LINK_BLUE = colors.Color(30 / 255, 100 / 255, 180 / 255)


def _draw_card(c, x, y, w, h):
    c.setFillColor(CARD_BG)
    c.setStrokeColor(CARD_BORDER)
    c.setLineWidth(0.5)
    c.roundRect(x, y, w, h, 5, fill=1, stroke=1)


def _draw_section_icon(c, cx, cy, r):
    c.setFillColor(NAVY)
    c.circle(cx, cy, r, fill=1, stroke=0)


def _draw_field_dot(c, cx, cy):
    c.setFillColor(NAVY)
    c.circle(cx, cy, 3.5, fill=1, stroke=0)


def _draw_checkmark_circle(c, cx, cy, size):
    c.setFillColor(GREEN)
    c.circle(cx, cy, size, fill=1, stroke=0)
    c.setFillColor(colors.white)
    c.setFont(_FNB, 7)
    c.drawCentredString(cx, cy - 2.5, "\u2713")


def _draw_status_badge(c, x, y, text):
    badge_w, badge_h = 55, 14
    c.setFillColor(GREEN)
    c.roundRect(x, y - badge_h + 3, badge_w, badge_h, 7, fill=1, stroke=0)
    c.setFillColor(colors.white)
    c.setFont(_FNB, 7)
    c.drawCentredString(x + badge_w / 2, y - 2, "\u2713  " + text)


def _draw_copy_icon(c, x, y):
    c.setStrokeColor(LIGHT_GREY)
    c.setLineWidth(0.5)
    c.roundRect(x, y, 5, 6, 0.5, fill=0, stroke=1)
    c.roundRect(x + 1.5, y + 1.5, 5, 6, 0.5, fill=0, stroke=1)


def _draw_external_icon(c, x, y):
    c.setStrokeColor(LINK_BLUE)
    c.setLineWidth(0.4)
    c.roundRect(x, y - 1, 5.5, 5.5, 0.5, fill=0, stroke=1)
    c.line(x + 3, y - 1, x + 5.5, y + 1.5)
    c.line(x + 5.5, y - 1, x + 5.5, y + 1.5)


def _draw_stamp(c, cx, cy, outer_r):
    c.setStrokeColor(NAVY)
    c.setFillColor(NAVY)
    c.setLineWidth(1.5)
    c.circle(cx, cy, outer_r, fill=0, stroke=1)
    c.setLineWidth(0.5)
    c.circle(cx, cy, outer_r - 3, fill=0, stroke=1)
    c.setDash([1.5, 1.5], 0)
    c.circle(cx, cy, outer_r - 1.5, fill=0, stroke=1)
    c.setDash([], 0)

    lock_w, lock_h = 7, 6
    c.roundRect(cx - lock_w / 2, cy - lock_h / 2, lock_w, lock_h, 1.5, fill=1, stroke=0)
    c.setFillColor(colors.white)
    c.circle(cx, cy - 0.5, 1.2, fill=1, stroke=0)

    c.setFillColor(NAVY)
    c.setFont(_FNB, 4.5)
    top_text = "ASSINATURA DIGITAL"
    bot_text = "VERIDOC"
    text_r = outer_r - 6

    for i, ch in enumerate(top_text):
        angle = -math.pi / 2 + (i / max(len(top_text) - 1, 1)) * math.pi
        tx = cx + text_r * math.cos(angle)
        ty = cy + text_r * math.sin(angle)
        c.drawCentredString(tx, ty - 2, ch)

    for i, ch in enumerate(bot_text):
        angle = math.pi / 2 + (i / max(len(bot_text) - 1, 1)) * math.pi
        tx = cx + text_r * math.cos(angle)
        ty = cy + text_r * math.sin(angle)
        c.drawCentredString(tx, ty - 2, ch)


def _draw_shield_footer(c, cx, cy, size):
    c.setFillColor(NAVY)
    c.circle(cx, cy, size, fill=1, stroke=0)
    c.setFillColor(GREEN)
    c.circle(cx, cy, size * 0.7, fill=1, stroke=0)
    c.setFillColor(colors.white)
    c.setFont(_FNB, 10)
    c.drawCentredString(cx, cy - 3.5, "\u2713")


def generate_document_pdf(
    doc: Document,
    institution: Institution,
    qr_png: bytes,
    institution_logo_data_url: str | None = None,
) -> BytesIO:
    _register_fonts()
    buffer = BytesIO()
    page_w, page_h = A4

    ML = 55
    MR = page_w - 55
    CW = MR - ML
    CX = ML + CW / 2

    c = canvas.Canvas(buffer, pagesize=A4)

    bg_path = _find_asset("modelo-fundo-doc.png")
    if bg_path:
        try:
            c.drawImage(bg_path, 0, 0, width=page_w, height=page_h,
                        preserveAspectRatio=True, anchor="c")
        except Exception:
            pass

    y = page_h - 50

    veridoc_logo_path = _find_asset("logotipo.png")
    if veridoc_logo_path and os.path.isfile(veridoc_logo_path):
        try:
            c.drawImage(veridoc_logo_path, ML, y - 48, width=130, height=48,
                        preserveAspectRatio=True, anchor="sw")
        except Exception:
            pass

    c.setFont(_FN, 6.5)
    c.setFillColor(LIGHT_GREY)
    c.drawString(ML + 135, y - 18, u"Plataforma Oficial de")
    c.drawString(ML + 135, y - 26, u"Documentos Digitais")
    c.drawString(ML + 135, y - 34, u"da Rep\u00fablica de Angola")

    qr_size = 65
    qr_x = MR - qr_size
    try:
        qr_buf = BytesIO(qr_png)
        c.drawImage(qr_buf, qr_x, y - 2, width=qr_size, height=qr_size,
                    preserveAspectRatio=True, anchor="ne")

        c.setFont(_FN, 6.5)
        c.setFillColor(GREY)
        c.drawRightString(qr_x - 8, y - 38, u"Verifique a autenticidade")
        c.drawRightString(qr_x - 8, y - 48, u"deste documento")

        _draw_checkmark_circle(c, qr_x + qr_size / 2, y - qr_size - 12, 7)
    except Exception:
        pass

    y = y - qr_size - 55

    c.setFont(_FNB, 21)
    c.setFillColor(NAVY)
    c.drawCentredString(CX, y, doc.title.upper())
    y += 14

    c.setStrokeColor(NAVY)
    c.setLineWidth(0.8)
    c.line(CX - 16, y, CX + 16, y)
    c.setFillColor(NAVY)
    c.circle(CX - 21, y, 1, fill=1, stroke=0)
    c.circle(CX + 21, y, 1, fill=1, stroke=0)
    y += 8

    c.setFont(_FN, 8.5)
    c.setFillColor(GREY)
    c.drawCentredString(CX, y, u"Este documento certifica que o titular concluiu com sucesso o programa de forma\u00e7\u00e3o.")
    y += 22

    c.setFont(_FN, 9)
    c.setFillColor(GREY)
    c.drawCentredString(CX, y, u"Institui\u00e7\u00e3o")
    y += 18

    if institution_logo_data_url:
        logo_bytes = _data_url_to_bytes(institution_logo_data_url)
        if logo_bytes:
            try:
                from PIL import Image as PILImage
                img = PILImage.open(BytesIO(logo_bytes))
                temp = BytesIO()
                img.save(temp, format="PNG")
                temp.seek(0)
                inst_w, inst_h = 100, 45
                c.drawImage(temp, CX - inst_w / 2, y - inst_h + 8,
                            width=inst_w, height=inst_h,
                            preserveAspectRatio=True, anchor="nw")
                y += 18
            except Exception:
                pass
    else:
        c.setFont(_FNB, 13)
        c.setFillColor(DARK)
        c.drawCentredString(CX, y, institution.legal_name)
        y += 18

    y += 12
    card_x = ML + 8
    card_w = CW - 16
    icon_r = 8
    row_h = 15
    label_x = card_x + 30
    value_x = card_x + 185

    info_fields = [
        (u"Tipo de documento:", doc.document_type),
        (u"N\u00famero:", doc.document_number),
        (u"Titular:", doc.holder_name),
        (u"Data de emiss\u00e3o:", doc.issued_at.strftime("%d/%m/%Y") if doc.issued_at else "\u2014"),
        (u"Estado:", "VALIDO" if doc.status == "VALID" else doc.status),
        (u"C\u00f3digo de valida\u00e7\u00e3o:", doc.verification_code),
    ]
    info_header_h = 24
    info_rows_h = len(info_fields) * row_h + 8
    info_card_h = info_header_h + info_rows_h + 16
    _draw_card(c, card_x, y, card_w, info_card_h)
    _draw_section_icon(c, card_x + 16, y + 16, icon_r)
    c.setFont(_FNB, 9.5)
    c.setFillColor(NAVY)
    c.drawString(card_x + 30, y + 13, u"INFORMA\u00c7\u00d3ES DO DOCUMENTO")

    row_y = y + info_header_h + 12
    for i, (label, value) in enumerate(info_fields):
        _draw_field_dot(c, card_x + 20, row_y - 1)
        c.setFont(_FN, 8.5)
        c.setFillColor(GREY)
        c.drawString(label_x, row_y, label)

        if label.startswith(u"Estado"):
            _draw_status_badge(c, value_x + 5, row_y, value)
        elif label.startswith(u"Titular"):
            c.setFont(_FNB, 9)
            c.setFillColor(DARK)
            c.drawString(value_x + 5, row_y, value)
        else:
            c.setFont(_FNB, 8.5)
            c.setFillColor(DARK)
            c.drawString(value_x, row_y, value)
        row_y += row_h

    y += info_card_h + 10

    sec_card_h = 24 + row_h + 20
    _draw_card(c, card_x, y, card_w, sec_card_h)
    _draw_section_icon(c, card_x + 16, y + 16, icon_r)
    c.setFont(_FNB, 9.5)
    c.setFillColor(NAVY)
    c.drawString(card_x + 30, y + 13, u"SEGURAN\u00c7A E INTEGRIDADE")

    row_y = y + 36
    c.setFont(_FN, 8.5)
    c.setFillColor(GREY)
    c.drawString(label_x, row_y, u"Hash SHA-256:")

    c.setFont("Courier", 7)
    c.setFillColor(DARK)
    h = doc.content_hash
    max_len = 70
    offset = 0
    while offset < len(h):
        c.drawString(value_x, row_y, h[offset:offset + max_len])
        row_y += 9
        offset += max_len
    _draw_copy_icon(c, card_x + card_w - 22, y + 36 - 4)

    y += sec_card_h + 10

    sig_fields = [
        (u"Algoritmo:", doc.signature.algorithm if doc.signature else "\u2014"),
        (u"Assinado por:", doc.signature.signed_by if doc.signature else "\u2014"),
        (u"Data:", doc.signature.created_at.strftime("%d/%m/%Y") if doc.signature and doc.signature.created_at else "\u2014"),
    ]
    sig_card_h = 24 + len(sig_fields) * row_h + 20
    sig_start_y = y
    _draw_card(c, card_x, y, card_w, sig_card_h)
    _draw_section_icon(c, card_x + 16, y + 16, icon_r)
    c.setFont(_FNB, 9.5)
    c.setFillColor(NAVY)
    c.drawString(card_x + 30, y + 13, u"ASSINATURA DIGITAL")

    row_y = y + 36
    for label, value in sig_fields:
        _draw_field_dot(c, card_x + 20, row_y - 1)
        c.setFont(_FN, 8.5)
        c.setFillColor(GREY)
        c.drawString(label_x, row_y, label)
        c.setFont(_FNB, 8.5)
        c.setFillColor(DARK)
        c.drawString(value_x, row_y, value)
        row_y += row_h

    _draw_stamp(c, card_x + card_w - 45, sig_start_y + sig_card_h / 2, 30)
    y += sig_card_h + 10

    val_card_h = 24 + row_h * 2 + 35
    _draw_card(c, card_x, y, card_w, val_card_h)
    _draw_section_icon(c, card_x + 16, y + 16, icon_r)
    c.setFont(_FNB, 9.5)
    c.setFillColor(NAVY)
    c.drawString(card_x + 30, y + 13, u"VALIDA\u00c7\u00c3O DO DOCUMENTO")

    row_y = y + 38
    c.setFont(_FN, 8.5)
    c.setFillColor(GREY)
    c.drawString(label_x, row_y, u"Aceda a:")

    ver_url = qr_service.verification_url(doc.verification_code)
    url_x = label_x + 52
    c.setFont(_FN, 7.5)
    c.setFillColor(LINK_BLUE)
    c.drawString(url_x, row_y, ver_url)
    url_w = c.stringWidth(ver_url, _FN, 7.5)
    c.setStrokeColor(LINK_BLUE)
    c.setLineWidth(0.3)
    c.line(url_x, row_y + 2, url_x + url_w, row_y + 2)
    _draw_external_icon(c, url_x + url_w + 4, row_y - 3)

    row_y += row_h + 6
    c.setFont(_FN, 8.5)
    c.setFillColor(GREY)
    c.drawString(label_x, row_y, u"C\u00f3digo:")
    c.setFont(_FNB, 11)
    c.setFillColor(NAVY)
    code_x = label_x + 52
    c.drawString(code_x, row_y, doc.verification_code)
    _draw_copy_icon(c, code_x + c.stringWidth(doc.verification_code, _FNB, 11) + 6, row_y - 5)

    row_y += row_h + 8
    c.setFont(_FN, 7.5)
    c.setFillColor(LIGHT_GREY)
    c.drawString(label_x, row_y, u"A validade deste documento pode ser confirmada a qualquer momento atrav\u00e9s do link ou c\u00f3digo acima.")

    footer_y = 50

    _draw_shield_footer(c, CX, footer_y + 15, 10)

    c.setFont(_FN, 7)
    c.setFillColor(LIGHT_GREY)
    c.drawCentredString(CX, footer_y + 5, u"VeriDoc \u2014 Plataforma Oficial de Documentos Digitais da Rep\u00fablica de Angola")
    issued_str = doc.issued_at.strftime("%d/%m/%Y") if doc.issued_at else "\u2014"
    c.drawCentredString(CX, footer_y - 5, f"Emitido em {issued_str} | Verificado automaticamente")

    if doc.status == "REVOKED":
        c.setFont(_FNB, 9)
        c.setFillColor(colors.red)
        revoked_str = f"DOCUMENTO REVOGADO em {doc.revoked_at.strftime('%d/%m/%Y') if doc.revoked_at else '\u2014'}: {doc.revoked_reason or 'Sem motivo registado.'}"
        c.drawCentredString(CX, footer_y - 25, revoked_str)

    c.save()
    buffer.seek(0)
    return buffer
