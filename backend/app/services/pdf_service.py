from io import BytesIO

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import Image, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from app.models.document import Document
from app.models.institution import Institution
from app.services import qr_service


def generate_document_pdf(doc: Document, institution: Institution, qr_png: bytes) -> BytesIO:
    buffer = BytesIO()
    doc_builder = SimpleDocTemplate(buffer, pagesize=A4, topMargin=18 * mm, bottomMargin=18 * mm)

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "TitleInstitution", parent=styles["Title"], fontSize=16, spaceAfter=2
    )
    subtitle_style = ParagraphStyle(
        "SubtitleDoc", parent=styles["Title"], fontSize=13, spaceAfter=2, textColor=colors.HexColor("#1D2A6B")
    )
    body_style = ParagraphStyle("Body", parent=styles["BodyText"], fontSize=10, leading=14)
    small_style = ParagraphStyle(
        "Small", parent=styles["BodyText"], fontSize=8, leading=11, textColor=colors.grey
    )

    def fields_table() -> Table:
        rows = [["Campo", "Valor"]]
        for item in doc.extra_data or []:
            rows.append([item.get("label", ""), item.get("value", "")])
        table = Table(rows, colWidths=[50 * mm, 115 * mm])
        table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#E8ECF9")),
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#C9D2EF")),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, -1), 9),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 6),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ]
            )
        )
        return table

    story = [
        Paragraph(institution.legal_name, title_style),
        Paragraph("VeriDoc — Documento Digital Autenticado", subtitle_style),
        Spacer(1, 4 * mm),
        Paragraph(
            f"<b>Nº do documento:</b> {doc.document_number}<br/>"
            f"<b>Tipo:</b> {doc.document_type}<br/>"
            f"<b>Título:</b> {doc.title}<br/>"
            f"<b>Titular:</b> {doc.holder_name}<br/>"
            f"<b>Data de emissão:</b> {doc.issued_at:%d/%m/%Y %H:%M}<br/>"
            f"<b>Validade:</b> {doc.expires_at:%d/%m/%Y} " if doc.expires_at else
            "<b>Validade:</b> Sem data de expiração<br/>",
            body_style,
        ),
        Spacer(1, 4 * mm),
    ]

    if doc.extra_data:
        story.append(fields_table())
        story.append(Spacer(1, 4 * mm))

    if doc.description:
        story.append(Paragraph(f"<b>Observações:</b><br/>{doc.description}", body_style))
        story.append(Spacer(1, 4 * mm))

    signature_valid = doc.status == "VALID"
    story.append(
        Paragraph(
            f"<b>Estado:</b> {doc.status} &nbsp;•&nbsp; "
            f"<b>Código de verificação:</b> {doc.verification_code}",
            body_style,
        )
    )
    story.append(Spacer(1, 3 * mm))
    story.append(
        Paragraph(
            "Valide este documento em qualquer altura em "
            f"{qr_service.verification_url(doc.verification_code)}",
            small_style,
        )
    )

    qr_image = Image(BytesIO(qr_png), width=36 * mm, height=36 * mm)
    story.append(Spacer(1, 3 * mm))
    story.append(qr_image)
    story.append(Paragraph("Código QR oficial de validação VeriDoc", small_style))
    story.append(Spacer(1, 5 * mm))

    history = [
        Paragraph(
            f"<b>Hash do conteúdo (SHA-256):</b><br/>{doc.content_hash}", small_style
        ),
        Spacer(1, 2 * mm),
    ]
    if doc.signature:
        history.append(
            Paragraph(
                f"<b>Assinatura digital:</b> {doc.signature.algorithm} "
                f"por {doc.signature.signed_by}",
                small_style,
            )
        )
        history.append(
            Paragraph(
                "Assinatura criptográfica verificável pela VeriDoc mediante o código acima.",
                small_style,
            )
        )
    story.extend(history)

    if doc.status == "REVOKED":
        story.append(
            Paragraph(
                f"<b>Revogado</b> em {doc.revoked_at:%d/%m/%Y}: {doc.revoked_reason or 'Sem motivo registado.'}",
                body_style,
            )
        )

    doc_builder.build(story)
    buffer.seek(0)
    return buffer
