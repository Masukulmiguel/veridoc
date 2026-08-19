import base64
import os
from io import BytesIO

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.platypus import Image, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
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


class _BackgroundCanvas(canvas.Canvas):
    """Custom canvas that draws the background image on every page."""

    def __init__(self, *args, bg_path: str | None = None, **kwargs):
        super().__init__(*args, **kwargs)
        self._bg_path = bg_path

    def showPage(self):
        if self._bg_path:
            try:
                self.drawImage(
                    self._bg_path,
                    0, 0,
                    width=A4[0], height=A4[1],
                    preserveAspectRatio=True,
                    anchor="c",
                )
            except Exception:
                pass
        super().showPage()


def generate_document_pdf(
    doc: Document,
    institution: Institution,
    qr_png: bytes,
    institution_logo_data_url: str | None = None,
) -> BytesIO:
    buffer = BytesIO()
    page_w, page_h = A4

    bg_path = _find_asset("modelo-fundo-doc.png")
    veridoc_logo_path = _find_asset("logotipo.png")

    def canvas_maker(*a, **kw):
        return _BackgroundCanvas(*a, bg_path=bg_path, **kw)

    doc_builder = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        topMargin=12 * mm,
        bottomMargin=12 * mm,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
    )

    styles = getSampleStyleSheet()
    navy = colors.HexColor("#121E45")
    red = colors.HexColor("#C8102E")
    grey = colors.HexColor("#666666")
    dark = colors.HexColor("#1A1A1A")

    title_style = ParagraphStyle("DocTitle", parent=styles["Title"], fontSize=18, textColor=navy, spaceAfter=2, alignment=1)
    subtitle_style = ParagraphStyle("DocSubtitle", parent=styles["Normal"], fontSize=10, textColor=grey, alignment=1, spaceAfter=4)
    section_style = ParagraphStyle("Section", parent=styles["Normal"], fontSize=9, textColor=dark, fontName="Helvetica-Bold", spaceBefore=6, spaceAfter=3)
    body_style = ParagraphStyle("Body", parent=styles["Normal"], fontSize=8.5, leading=12, textColor=dark)
    small_style = ParagraphStyle("Small", parent=styles["Normal"], fontSize=7, leading=10, textColor=grey)
    hash_style = ParagraphStyle("Hash", parent=styles["Normal"], fontSize=6.5, leading=9, textColor=dark, fontName="Courier")

    story: list = []

    # --- Logos row ---
    logo_elements = []
    if veridoc_logo_path and os.path.isfile(veridoc_logo_path):
        logo_elements.append(Image(veridoc_logo_path, width=40 * mm, height=20 * mm))
    if institution_logo_data_url:
        logo_bytes = _data_url_to_bytes(institution_logo_data_url)
        if logo_bytes:
            logo_elements.append(Image(BytesIO(logo_bytes), width=40 * mm, height=20 * mm))

    if len(logo_elements) == 2:
        logo_table = Table([[logo_elements[0], logo_elements[1]]], colWidths=[(page_w - 36 * mm) / 2, (page_w - 36 * mm) / 2])
        logo_table.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "MIDDLE"), ("ALIGN", (0, 0), (0, 0), "LEFT"), ("ALIGN", (1, 0), (1, 0), "RIGHT")]))
        story.append(logo_table)
    elif len(logo_elements) == 1:
        story.append(logo_elements[0])
    story.append(Spacer(1, 3 * mm))

    # --- Red divider ---
    divider = Table([[""]], colWidths=[page_w - 36 * mm], rowHeights=[1])
    divider.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), red)]))
    story.append(divider)
    story.append(Spacer(1, 2 * mm))

    # --- Title ---
    story.append(Paragraph(doc.title.upper(), title_style))
    story.append(Paragraph(doc.institution.legal_name, subtitle_style))
    story.append(Spacer(1, 3 * mm))

    # --- Document Info ---
    story.append(Paragraph("INFORMAÇÕES DO DOCUMENTO", section_style))
    info_items = [
        f"<b>Tipo de documento:</b> {doc.document_type}",
        f"<b>Número:</b> {doc.document_number}",
        f"<b>Titular:</b> {doc.holder_name}",
        f"<b>Data de emissão:</b> {doc.issued_at.strftime('%d/%m/%Y') if doc.issued_at else '—'}",
        f"<b>Estado:</b> {doc.status}",
        f"<b>Código de validação:</b> {doc.verification_code}",
    ]
    story.append(Paragraph("<br/>".join(info_items), body_style))
    story.append(Spacer(1, 3 * mm))

    # --- Security ---
    story.append(Paragraph("SEGURANÇA E INTEGRIDADE", section_style))
    story.append(Paragraph("<b>Hash SHA-256:</b>", body_style))
    story.append(Paragraph(doc.content_hash, hash_style))
    story.append(Spacer(1, 3 * mm))

    # --- Signature ---
    story.append(Paragraph("ASSINATURA DIGITAL", section_style))
    sig_items = []
    if doc.signature:
        sig_items.append(f"<b>Algoritmo:</b> {doc.signature.algorithm}")
        sig_items.append(f"<b>Assinado por:</b> {doc.signature.signed_by}")
        sig_items.append(f"<b>Data:</b> {doc.signature.created_at.strftime('%d/%m/%Y') if doc.signature.created_at else '—'}")
    else:
        sig_items.append("<b>Assinatura:</b> Não disponível")
    story.append(Paragraph("<br/>".join(sig_items), body_style))
    story.append(Spacer(1, 3 * mm))

    # --- Verification + QR Code side by side ---
    story.append(Paragraph("VALIDAÇÃO DO DOCUMENTO", section_style))
    ver_url = qr_service.verification_url(doc.verification_code)
    story.append(Paragraph(f"<b>Aceda a:</b> {ver_url}", body_style))
    story.append(Paragraph(f"<b>Código:</b> {doc.verification_code}", body_style))
    story.append(Spacer(1, 2 * mm))

    qr_image = Image(BytesIO(qr_png), width=28 * mm, height=28 * mm)
    story.append(qr_image)
    story.append(Paragraph("Verifique a autenticidade deste documento", small_style))
    story.append(Spacer(1, 4 * mm))

    # --- Footer ---
    story.append(Paragraph(
        "VeriDoc — Plataforma Oficial de Documentos Digitais da República de Angola",
        ParagraphStyle("Footer", parent=styles["Normal"], fontSize=7, textColor=grey, alignment=1),
    ))

    if doc.status == "REVOKED":
        story.append(Spacer(1, 3 * mm))
        story.append(Paragraph(
            f"<b>DOCUMENTO REVOGADO</b> em {doc.revoked_at.strftime('%d/%m/%Y') if doc.revoked_at else '—'}: "
            f"{doc.revoked_reason or 'Sem motivo registado.'}",
            ParagraphStyle("Revoked", parent=styles["Normal"], fontSize=9, textColor=colors.red, fontName="Helvetica-Bold"),
        ))

    doc_builder.build(story, canvasmaker=canvas_maker)
    buffer.seek(0)
    return buffer
