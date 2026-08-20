import { jsPDF } from 'jspdf'
import type { VeriDocument } from '@/types/document'
import { DOCUMENT_TYPE_LABELS, formatDate } from './format'
import { api } from '@/services/api'

/**
 * ============================================================
 * UTILITÁRIOS
 * ============================================================
 */

function dataUrlToImage(
  dataUrl: string,
): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()

    img.onload = () => resolve(img)
    img.onerror = reject

    img.src = dataUrl
  })
}

async function fetchImageAsDataUrl(
  path: string,
): Promise<string | null> {
  try {
    const response = await fetch(path)

    if (!response.ok) {
      return null
    }

    const blob = await response.blob()

    return await new Promise<string | null>(
      (resolve, reject) => {
        const reader = new FileReader()

        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result)
          } else {
            resolve(null)
          }
        }

        reader.onerror = reject

        reader.readAsDataURL(blob)
      },
    )
  } catch {
    return null
  }
}

async function addImageContain(
  pdf: jsPDF,
  dataUrl: string,
  x: number,
  y: number,
  maxWidth: number,
  maxHeight: number,
): Promise<void> {
  try {
    const img = await dataUrlToImage(dataUrl)

    const originalWidth =
      img.naturalWidth || img.width

    const originalHeight =
      img.naturalHeight || img.height

    if (
      !originalWidth ||
      !originalHeight
    ) {
      return
    }

    const scale = Math.min(
      maxWidth / originalWidth,
      maxHeight / originalHeight,
    )

    const width =
      originalWidth * scale

    const height =
      originalHeight * scale

    const offsetX =
      x + (maxWidth - width) / 2

    const offsetY =
      y + (maxHeight - height) / 2

    pdf.addImage(
      img,
      'PNG',
      offsetX,
      offsetY,
      width,
      height,
    )
  } catch {
    // Não interromper a geração do PDF
    // por causa de uma imagem.
  }
}

/**
 * ============================================================
 * CORES
 * ============================================================
 */

const COLORS = {
  navy: [18, 30, 69] as const,
  dark: [30, 35, 42] as const,
  text: [45, 50, 58] as const,
  muted: [105, 110, 118] as const,
  light: [145, 150, 158] as const,
  border: [210, 215, 222] as const,
  technicalBg: [248, 249, 251] as const,
  technicalBorder: [218, 222, 228] as const,
  success: [45, 105, 65] as const,
  successBg: [242, 247, 244] as const,
  successBorder: [100, 145, 115] as const,
  link: [45, 85, 135] as const,
}

/**
 * ============================================================
 * LINHA EDITORIAL
 * ============================================================
 */

function drawSeparator(
  pdf: jsPDF,
  x1: number,
  y: number,
  x2: number,
): void {
  pdf.setDrawColor(
    ...COLORS.border,
  )

  pdf.setLineWidth(0.5)

  pdf.line(
    x1,
    y,
    x2,
    y,
  )
}

/**
 * ============================================================
 * ESTADO
 * ============================================================
 */

function drawStatus(
  pdf: jsPDF,
  text: string,
  x: number,
  y: number,
): void {
  const label =
    text.toUpperCase()

  pdf.setFont(
    'helvetica',
    'bold',
  )

  pdf.setFontSize(7.5)

  const width =
    pdf.getTextWidth(label) + 18

  const height = 16

  pdf.setFillColor(
    ...COLORS.successBg,
  )

  pdf.setDrawColor(
    ...COLORS.successBorder,
  )

  pdf.setLineWidth(0.6)

  pdf.roundRect(
    x,
    y - 11,
    width,
    height,
    3,
    3,
    'FD',
  )

  pdf.setTextColor(
    ...COLORS.success,
  )

  pdf.text(
    label,
    x + width / 2,
    y,
    {
      align: 'center',
    },
  )
}

/**
 * ============================================================
 * CAMPO DE INFORMAÇÃO
 * ============================================================
 */

function drawField(
  pdf: jsPDF,
  label: string,
  value: string,
  x: number,
  y: number,
  valueX: number,
  valueWidth: number,
): number {
  pdf.setFont(
    'helvetica',
    'normal',
  )

  pdf.setFontSize(8)

  pdf.setTextColor(
    ...COLORS.muted,
  )

  pdf.text(
    label,
    x,
    y,
  )

  pdf.setFont(
    'helvetica',
    'bold',
  )

  pdf.setFontSize(8.5)

  pdf.setTextColor(
    ...COLORS.dark,
  )

  const lines =
    pdf.splitTextToSize(
      value || '-',
      valueWidth,
    )

  pdf.text(
    lines,
    valueX,
    y,
  )

  return Math.max(
    15,
    lines.length * 10 + 5,
  )
}

/**
 * ============================================================
 * GERADOR DO DOCUMENTO
 * ============================================================
 */

export async function buildDocumentPdf(
  doc: VeriDocument,
  verificationUrl: string,
  institutionLogoDataUrl?: string | null,
): Promise<Blob> {
  const pdf = new jsPDF({
    unit: 'pt',
    format: 'a4',
    compress: true,
  })

  /**
   * ==========================================================
   * A4
   * ==========================================================
   */

  const PAGE_WIDTH = 595.28
  const PAGE_HEIGHT = 841.89

  const MARGIN_LEFT = 48
  const MARGIN_RIGHT = 48

  const CONTENT_WIDTH =
    PAGE_WIDTH -
    MARGIN_LEFT -
    MARGIN_RIGHT

  const CENTER_X =
    MARGIN_LEFT +
    CONTENT_WIDTH / 2

  /**
   * ==========================================================
   * 1. FUNDO OFICIAL
   * ==========================================================
   *
   * Não criar outro fundo.
   *
   * Utilizar exactamente:
   *
   * public/modelo-fundo-doc.png
   */

  const background =
    await fetchImageAsDataUrl(
      '/modelo-fundo-doc.png',
    )

  if (background) {
    try {
      const backgroundImage =
        await dataUrlToImage(
          background,
        )

      pdf.addImage(
        backgroundImage,
        'PNG',
        0,
        0,
        PAGE_WIDTH,
        PAGE_HEIGHT,
      )
    } catch {
      // Continuar mesmo sem o fundo.
    }
  }

  /**
   * ==========================================================
   * 2. CABEÇALHO
   * ==========================================================
   */

  const headerTop = 42
  const headerHeight = 92

  /**
   * ==========================================================
   * LOGOTIPO VERIDOC
   * ==========================================================
   */

  const veridocLogo =
    await fetchImageAsDataUrl(
      '/logotipo.png',
    )

  if (veridocLogo) {
    await addImageContain(
      pdf,
      veridocLogo,
      MARGIN_LEFT,
      headerTop,
      125,
      48,
    )
  }

  /**
   * Texto discreto da plataforma.
   */

  pdf.setFont(
    'helvetica',
    'normal',
  )

  pdf.setFontSize(6.5)

  pdf.setTextColor(
    ...COLORS.light,
  )

  pdf.text(
    'Plataforma Oficial de Documentos Digitais',
    MARGIN_LEFT,
    headerTop + 58,
  )

  pdf.text(
    'da República de Angola',
    MARGIN_LEFT,
    headerTop + 67,
  )

  /**
   * ==========================================================
   * LOGOTIPO DA INSTITUIÇÃO
   * ==========================================================
   */

  const institutionAreaX =
    PAGE_WIDTH -
    MARGIN_RIGHT -
    135

  if (institutionLogoDataUrl) {
    await addImageContain(
      pdf,
      institutionLogoDataUrl,
      institutionAreaX,
      headerTop,
      88,
      45,
    )

    pdf.setFont(
      'helvetica',
      'normal',
    )

    pdf.setFontSize(6.5)

    pdf.setTextColor(
      ...COLORS.light,
    )

    pdf.text(
      doc.institution.name,
      institutionAreaX + 44,
      headerTop + 57,
      {
        align: 'center',
      },
    )
  } else {
    pdf.setFont(
      'helvetica',
      'bold',
    )

    pdf.setFontSize(9)

    pdf.setTextColor(
      ...COLORS.dark,
    )

    const institutionName =
      pdf.splitTextToSize(
        doc.institution.name,
        100,
      )

    pdf.text(
      institutionName,
      institutionAreaX + 44,
      headerTop + 20,
      {
        align: 'center',
      },
    )
  }

  /**
   * ==========================================================
   * 3. QR CODE
   * ==========================================================
   */

  const QR_SIZE = 62

  const qrX =
    PAGE_WIDTH -
    MARGIN_RIGHT -
    QR_SIZE

  const qrY =
    headerTop + 32

  let qrGenerated = false

  try {
    const qrResponse =
      await api.get(
        `/documents/${doc.id}/qrcode`,
        {
          responseType: 'blob',
        },
      )

    if (
      qrResponse.data &&
      qrResponse.data instanceof Blob &&
      qrResponse.data.size > 0
    ) {
      const qrDataUrl =
        await new Promise<string>(
          (
            resolve,
            reject,
          ) => {
            const reader =
              new FileReader()

            reader.onloadend = () => {
              if (
                typeof reader.result ===
                'string'
              ) {
                resolve(
                  reader.result,
                )
              } else {
                reject(
                  new Error(
                    'QR Code inválido',
                  ),
                )
              }
            }

            reader.onerror =
              reject

            reader.readAsDataURL(
              qrResponse.data,
            )
          },
        )

      await addImageContain(
        pdf,
        qrDataUrl,
        qrX,
        qrY,
        QR_SIZE,
        QR_SIZE,
      )

      qrGenerated = true
    }
  } catch (error) {
    console.warn(
      'Erro ao carregar QR Code:',
      error,
    )
  }

  if (qrGenerated) {
    pdf.setFont(
      'helvetica',
      'normal',
    )

    pdf.setFontSize(6.2)

    pdf.setTextColor(
      ...COLORS.muted,
    )

    pdf.text(
      'Verifique a autenticidade',
      qrX + QR_SIZE / 2,
      qrY + QR_SIZE + 9,
      {
        align: 'center',
      },
    )

    pdf.text(
      'deste documento',
      qrX + QR_SIZE / 2,
      qrY + QR_SIZE + 17,
      {
        align: 'center',
      },
    )
  }

  /**
   * Linha do cabeçalho.
   */

  drawSeparator(
    pdf,
    MARGIN_LEFT,
    headerTop + headerHeight,
    PAGE_WIDTH - MARGIN_RIGHT,
  )

  /**
   * ==========================================================
   * 4. TÍTULO
   * ==========================================================
   */

  let y =
    headerTop +
    headerHeight +
    42

  pdf.setFont(
    'helvetica',
    'bold',
  )

  pdf.setFontSize(20)

  pdf.setTextColor(
    ...COLORS.navy,
  )

  const documentTitle =
    (
      doc.title ||
      DOCUMENT_TYPE_LABELS[
        doc.type
      ] ||
      'DOCUMENTO DIGITAL'
    ).toUpperCase()

  const titleLines =
    pdf.splitTextToSize(
      documentTitle,
      CONTENT_WIDTH - 80,
    )

  pdf.text(
    titleLines,
    CENTER_X,
    y,
    {
      align: 'center',
      lineHeightFactor: 1.15,
    },
  )

  y +=
    titleLines.length * 23

  /**
   * Subtítulo.
   */

  pdf.setFont(
    'helvetica',
    'normal',
  )

  pdf.setFontSize(8.5)

  pdf.setTextColor(
    ...COLORS.muted,
  )

  pdf.text(
    'Documento digital verificável',
    CENTER_X,
    y + 4,
    {
      align: 'center',
    },
  )

  y += 32

  /**
   * ==========================================================
   * 5. TITULAR
   * ==========================================================
   */

  pdf.setFont(
    'helvetica',
    'normal',
  )

  pdf.setFontSize(8.5)

  pdf.setTextColor(
    ...COLORS.muted,
  )

  pdf.text(
    'Certifica-se que',
    CENTER_X,
    y,
    {
      align: 'center',
    },
  )

  y += 22

  /**
   * Nome do titular.
   */

  pdf.setFont(
    'helvetica',
    'bold',
  )

  pdf.setFontSize(18)

  pdf.setTextColor(
    ...COLORS.dark,
  )

  const holderLines =
    pdf.splitTextToSize(
      doc.holderName,
      CONTENT_WIDTH - 80,
    )

  pdf.text(
    holderLines,
    CENTER_X,
    y,
    {
      align: 'center',
      lineHeightFactor: 1.15,
    },
  )

  y +=
    holderLines.length * 21

  y += 8

  /**
   * Instituição.
   */

  pdf.setFont(
    'helvetica',
    'normal',
  )

  pdf.setFontSize(8)

  pdf.setTextColor(
    ...COLORS.muted,
  )

  pdf.text(
    'Instituição emissora',
    CENTER_X,
    y,
    {
      align: 'center',
    },
  )

  y += 14

  pdf.setFont(
    'helvetica',
    'bold',
  )

  pdf.setFontSize(11)

  pdf.setTextColor(
    ...COLORS.navy,
  )

  pdf.text(
    doc.institution.name,
    CENTER_X,
    y,
    {
      align: 'center',
    },
  )

  y += 26

  /**
   * ==========================================================
   * 6. INFORMAÇÕES DO DOCUMENTO
   * ==========================================================
   */

  pdf.setFont(
    'helvetica',
    'bold',
  )

  pdf.setFontSize(9)

  pdf.setTextColor(
    ...COLORS.navy,
  )

  pdf.text(
    'INFORMAÇÕES DO DOCUMENTO',
    MARGIN_LEFT,
    y,
  )

  y += 10

  drawSeparator(
    pdf,
    MARGIN_LEFT,
    y,
    PAGE_WIDTH - MARGIN_RIGHT,
  )

  y += 17

  const LABEL_X =
    MARGIN_LEFT

  const VALUE_X =
    MARGIN_LEFT + 145

  const VALUE_WIDTH =
    CONTENT_WIDTH - 145

  y += drawField(
    pdf,
    'Tipo de documento',
    DOCUMENT_TYPE_LABELS[
      doc.type
    ] ?? doc.type,
    LABEL_X,
    y,
    VALUE_X,
    VALUE_WIDTH,
  )

  y += drawField(
    pdf,
    'Número',
    doc.number,
    LABEL_X,
    y,
    VALUE_X,
    VALUE_WIDTH,
  )

  y += drawField(
    pdf,
    'Titular',
    doc.holderName,
    LABEL_X,
    y,
    VALUE_X,
    VALUE_WIDTH,
  )

  y += drawField(
    pdf,
    'Data de emissão',
    formatDate(
      doc.issuedAt,
    ),
    LABEL_X,
    y,
    VALUE_X,
    VALUE_WIDTH,
  )

  /**
   * Estado.
   */

  pdf.setFont(
    'helvetica',
    'normal',
  )

  pdf.setFontSize(8)

  pdf.setTextColor(
    ...COLORS.muted,
  )

  pdf.text(
    'Estado',
    LABEL_X,
    y,
  )

  drawStatus(
    pdf,
    doc.status === 'VALID'
      ? 'VALIDADO'
      : doc.status,
    VALUE_X,
    y,
  )

  y += 22

  y += drawField(
    pdf,
    'Código de validação',
    doc.verificationCode,
    LABEL_X,
    y,
    VALUE_X,
    VALUE_WIDTH,
  )

  y += 8

  /**
   * ==========================================================
   * 7. SEGURANÇA
   * ==========================================================
   */

  pdf.setFont(
    'helvetica',
    'bold',
  )

  pdf.setFontSize(9)

  pdf.setTextColor(
    ...COLORS.navy,
  )

  pdf.text(
    'SEGURANÇA E INTEGRIDADE',
    MARGIN_LEFT,
    y,
  )

  y += 10

  drawSeparator(
    pdf,
    MARGIN_LEFT,
    y,
    PAGE_WIDTH - MARGIN_RIGHT,
  )

  y += 16

  pdf.setFont(
    'helvetica',
    'normal',
  )

  pdf.setFontSize(7.5)

  pdf.setTextColor(
    ...COLORS.muted,
  )

  pdf.text(
    'Hash SHA-256',
    MARGIN_LEFT,
    y,
  )

  y += 12

  /**
   * Caixa técnica do hash.
   */

  pdf.setFillColor(
    ...COLORS.technicalBg,
  )

  pdf.setDrawColor(
    ...COLORS.technicalBorder,
  )

  pdf.setLineWidth(0.5)

  pdf.roundRect(
    MARGIN_LEFT,
    y - 9,
    CONTENT_WIDTH,
    28,
    2,
    2,
    'FD',
  )

  pdf.setFont(
    'courier',
    'normal',
  )

  pdf.setFontSize(6.8)

  pdf.setTextColor(
    ...COLORS.dark,
  )

  const hashLines =
    pdf.splitTextToSize(
      doc.contentHash,
      CONTENT_WIDTH - 18,
    )

  pdf.text(
    hashLines.slice(0, 2),
    MARGIN_LEFT + 9,
    y + 2,
    {
      lineHeightFactor: 1.25,
    },
  )

  y += 36

  /**
   * ==========================================================
   * 8. ASSINATURA DIGITAL
   * ==========================================================
   */

  pdf.setFont(
    'helvetica',
    'bold',
  )

  pdf.setFontSize(9)

  pdf.setTextColor(
    ...COLORS.navy,
  )

  pdf.text(
    'ASSINATURA DIGITAL',
    MARGIN_LEFT,
    y,
  )

  y += 10

  drawSeparator(
    pdf,
    MARGIN_LEFT,
    y,
    PAGE_WIDTH - MARGIN_RIGHT,
  )

  y += 17

  const signatureValueX =
    MARGIN_LEFT + 145

  y += drawField(
    pdf,
    'Algoritmo',
    doc.signature.algorithm,
    MARGIN_LEFT,
    y,
    signatureValueX,
    VALUE_WIDTH,
  )

  y += drawField(
    pdf,
    'Assinado por',
    doc.signature.signedBy,
    MARGIN_LEFT,
    y,
    signatureValueX,
    VALUE_WIDTH,
  )

  y += drawField(
    pdf,
    'Data',
    formatDate(
      doc.signature.signedAt,
    ),
    MARGIN_LEFT,
    y,
    signatureValueX,
    VALUE_WIDTH,
  )

  y += 8

  /**
   * ==========================================================
   * 9. VALIDAÇÃO
   * ==========================================================
   */

  pdf.setFont(
    'helvetica',
    'bold',
  )

  pdf.setFontSize(9)

  pdf.setTextColor(
    ...COLORS.navy,
  )

  pdf.text(
    'VALIDAÇÃO DO DOCUMENTO',
    MARGIN_LEFT,
    y,
  )

  y += 10

  drawSeparator(
    pdf,
    MARGIN_LEFT,
    y,
    PAGE_WIDTH - MARGIN_RIGHT,
  )

  y += 17

  const fullUrl =
    `${verificationUrl}/${doc.verificationCode}/${doc.verificationCode}`

  /**
   * Código.
   */

  pdf.setFont(
    'helvetica',
    'normal',
  )

  pdf.setFontSize(7.5)

  pdf.setTextColor(
    ...COLORS.muted,
  )

  pdf.text(
    'Código',
    MARGIN_LEFT,
    y,
  )

  pdf.setFont(
    'courier',
    'bold',
  )

  pdf.setFontSize(9)

  pdf.setTextColor(
    ...COLORS.navy,
  )

  pdf.text(
    doc.verificationCode,
    MARGIN_LEFT + 145,
    y,
  )

  y += 17

  /**
   * URL.
   */

  pdf.setFont(
    'helvetica',
    'normal',
  )

  pdf.setFontSize(7.2)

  pdf.setTextColor(
    ...COLORS.muted,
  )

  pdf.text(
    'URL de validação',
    MARGIN_LEFT,
    y,
  )

  y += 11

  pdf.setFont(
    'courier',
    'normal',
  )

  pdf.setFontSize(6.4)

  pdf.setTextColor(
    ...COLORS.link,
  )

  const urlLines =
    pdf.splitTextToSize(
      fullUrl,
      CONTENT_WIDTH,
    )

  pdf.text(
    urlLines,
    MARGIN_LEFT,
    y,
    {
      lineHeightFactor: 1.3,
    },
  )

  y +=
    urlLines.length * 8.5

  /**
   * ==========================================================
   * 10. TEXTO DE AUTENTICIDADE
   * ==========================================================
   */

  y += 8

  pdf.setFont(
    'helvetica',
    'normal',
  )

  pdf.setFontSize(6.8)

  pdf.setTextColor(
    ...COLORS.light,
  )

  pdf.text(
    'A autenticidade deste documento pode ser confirmada através',
    CENTER_X,
    y,
    {
      align: 'center',
    },
  )

  pdf.text(
    'do código de validação ou do QR Code apresentado neste documento.',
    CENTER_X,
    y + 9,
    {
      align: 'center',
    },
  )

  /**
   * ==========================================================
   * 11. RODAPÉ
   * ==========================================================
   */

  const footerY =
    PAGE_HEIGHT - 42

  drawSeparator(
    pdf,
    MARGIN_LEFT,
    footerY - 12,
    PAGE_WIDTH - MARGIN_RIGHT,
  )

  pdf.setFont(
    'helvetica',
    'normal',
  )

  pdf.setFontSize(6.5)

  pdf.setTextColor(
    ...COLORS.light,
  )

  pdf.text(
    'VeriDoc — Plataforma Oficial de Documentos Digitais da República de Angola',
    CENTER_X,
    footerY,
    {
      align: 'center',
    },
  )

  pdf.text(
    `Emitido em ${formatDate(doc.issuedAt)} | Verificado automaticamente`,
    CENTER_X,
    footerY + 10,
    {
      align: 'center',
    },
  )

  /**
   * ==========================================================
   * 12. GERAR BLOB
   * ==========================================================
   */

  return pdf.output('blob')
}

/**
 * ============================================================
 * DOWNLOAD
 * ============================================================
 */

export function triggerDownload(
  blob: Blob,
  filename: string,
): void {
  const url =
    URL.createObjectURL(blob)

  const link =
    document.createElement('a')

  link.href = url
  link.download = filename

  document.body.appendChild(link)

  link.click()

  document.body.removeChild(link)

  setTimeout(
    () => {
      URL.revokeObjectURL(url)
    },
    1000,
  )
}