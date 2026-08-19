import { jsPDF } from 'jspdf'
import type { VeriDocument } from '@/types/document'
import { DOCUMENT_TYPE_LABELS, formatDate } from './format'
import { api } from '@/services/api'

function dataUrlToImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = dataUrl
  })
}

async function fetchImageAsDataUrl(path: string): Promise<string | null> {
  try {
    const res = await fetch(path)
    if (!res.ok) return null
    const blob = await res.blob()
    return new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

function drawLine(
  pdf: jsPDF,
  x1: number, y1: number,
  x2: number, y2: number,
  r: number, g: number, b: number,
  width: number = 0.3,
) {
  pdf.setDrawColor(r, g, b)
  pdf.setLineWidth(width)
  pdf.line(x1, y1, x2, y2)
}

export async function buildDocumentPdf(
  doc: VeriDocument,
  verificationUrl: string,
  institutionLogoDataUrl?: string | null,
): Promise<Blob> {
  const pdf = new jsPDF({ unit: 'pt', format: 'a4', compress: true })

  const W = 595
  const H = 842
  const ML = 55
  const MR = W - 55
  const CW = MR - ML
  const CX = ML + CW / 2

  const navyR = 18, navyG = 30, navyB = 69
  const greyR = 110, greyG = 110, greyB = 110
  const lightGreyR = 150, lightGreyG = 150, lightGreyB = 150
  const darkR = 25, darkG = 25, darkB = 25
  const lineR = 200, lineG = 208, lineB = 220

  const bgDataUrl = await fetchImageAsDataUrl('/modelo-fundo-doc.png')
  if (bgDataUrl) {
    try {
      const bgImg = await dataUrlToImage(bgDataUrl)
      pdf.addImage(bgImg, 'PNG', 0, 0, W, H)
    } catch { /* skip */ }
  }

  let y = H - 55

  const veridocLogoDataUrl = await fetchImageAsDataUrl('/logotipo.png')
  if (veridocLogoDataUrl) {
    try {
      const logoImg = await dataUrlToImage(veridocLogoDataUrl)
      pdf.addImage(logoImg, 'PNG', ML, y - 38, 110, 38)
    } catch { /* skip */ }
  }

  let qrY = y - 38
  try {
    const qrRes = await api.get(`/documents/${doc.id}/qrcode`, { responseType: 'blob' })
    if (qrRes.data) {
      const qrDataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.readAsDataURL(qrRes.data)
      })
      const qrImg = await dataUrlToImage(qrDataUrl)
      const qrSize = 62
      const qrX = MR - qrSize
      pdf.addImage(qrImg, 'PNG', qrX, qrY, qrSize, qrSize)
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(6)
      pdf.setTextColor(lightGreyR, lightGreyG, lightGreyB)
      pdf.text('Verificar autenticidade', qrX + qrSize / 2, qrY + qrSize + 9, { align: 'center' })
    }
  } catch { /* skip QR */ }

  if (institutionLogoDataUrl) {
    try {
      const instImg = await dataUrlToImage(institutionLogoDataUrl)
      const instMaxW = 110
      const instMaxH = 38
      pdf.addImage(instImg, 'PNG', MR - instMaxW, y - 38, instMaxW, instMaxH)
    } catch { /* skip */ }
  }

  drawLine(pdf, ML, y - 48, MR, y - 48, lineR, lineG, lineB, 0.5)

  y = y - 68

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(20)
  pdf.setTextColor(navyR, navyG, navyB)
  pdf.text(doc.title.toUpperCase(), CX, y, { align: 'center' })
  y += 16

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8)
  pdf.setTextColor(lightGreyR, lightGreyG, lightGreyB)
  pdf.text('Documento digital verificavel', CX, y, { align: 'center' })
  y += 18

  drawLine(pdf, ML + CW * 0.35, y, MR - CW * 0.35, y, lineR, lineG, lineB, 0.3)
  y += 20

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(9)
  pdf.setTextColor(greyR, greyG, greyB)
  pdf.text('INSTITUICAO EMISSORA', CX, y, { align: 'center' })
  y += 18

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(12)
  pdf.setTextColor(darkR, darkG, darkB)
  pdf.text(doc.institution.name, CX, y, { align: 'center' })
  y += 28

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(9)
  pdf.setTextColor(greyR, greyG, greyB)
  pdf.text('Certifica-se que', CX, y, { align: 'center' })
  y += 22

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(22)
  pdf.setTextColor(navyR, navyG, navyB)
  pdf.text(doc.holderName.toUpperCase(), CX, y, { align: 'center' })
  y += 10

  drawLine(pdf, CX - 80, y, CX + 80, y, navyR, navyG, navyB, 0.6)
  y += 30

  drawLine(pdf, ML, y, MR, y, lineR, lineG, lineB, 0.5)
  y += 20

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(9)
  pdf.setTextColor(navyR, navyG, navyB)
  pdf.text('INFORMACOES DO DOCUMENTO', ML, y)
  y += 18

  const colLabel = ML
  const colValue = ML + 155

  const infoFields: Array<[string, string]> = [
    ['Tipo de documento', DOCUMENT_TYPE_LABELS[doc.type] ?? doc.type],
    ['Numero', doc.number],
    ['Titular', doc.holderName],
    ['Data de emissao', formatDate(doc.issuedAt)],
    ['Estado', doc.status === 'VALID' ? 'VALIDADO' : doc.status],
    ['Codigo de validacao', doc.verificationCode],
  ]

  for (const [label, value] of infoFields) {
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(8.5)
    pdf.setTextColor(greyR, greyG, greyB)
    pdf.text(label, colLabel, y)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(8.5)
    pdf.setTextColor(darkR, darkG, darkB)
    pdf.text(value, colValue, y)
    y += 14
  }

  y += 8

  drawLine(pdf, ML, y, MR, y, lineR, lineG, lineB, 0.5)
  y += 18

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(9)
  pdf.setTextColor(navyR, navyG, navyB)
  pdf.text('SEGURANCA E INTEGRIDADE', ML, y)
  y += 16

  pdf.setFont('courier', 'normal')
  pdf.setFontSize(7)
  pdf.setTextColor(darkR, darkG, darkB)
  const hash = doc.contentHash
  const maxHashLen = 85
  let hashOffset = 0
  while (hashOffset < hash.length) {
    pdf.text(hash.slice(hashOffset, hashOffset + maxHashLen), ML, y)
    y += 10
    hashOffset += maxHashLen
  }
  y += 8

  drawLine(pdf, ML, y, MR, y, lineR, lineG, lineB, 0.5)
  y += 18

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(9)
  pdf.setTextColor(navyR, navyG, navyB)
  pdf.text('ASSINATURA DIGITAL', ML, y)
  y += 18

  const sigFields: Array<[string, string]> = [
    ['Algoritmo', doc.signature.algorithm],
    ['Assinado por', doc.signature.signedBy],
    ['Data', formatDate(doc.signature.signedAt)],
  ]

  for (const [label, value] of sigFields) {
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(8.5)
    pdf.setTextColor(greyR, greyG, greyB)
    pdf.text(label, colLabel, y)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(8.5)
    pdf.setTextColor(darkR, darkG, darkB)
    pdf.text(value, colValue, y)
    y += 14
  }
  y += 8

  drawLine(pdf, ML, y, MR, y, lineR, lineG, lineB, 0.5)
  y += 18

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(9)
  pdf.setTextColor(navyR, navyG, navyB)
  pdf.text('VALIDACAO DO DOCUMENTO', ML, y)
  y += 18

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8.5)
  pdf.setTextColor(greyR, greyG, greyB)
  pdf.text('Codigo de validacao', colLabel, y)
  pdf.setFont('courier', 'bold')
  pdf.setFontSize(10)
  pdf.setTextColor(navyR, navyG, navyB)
  pdf.text(doc.verificationCode, colValue, y)
  y += 18

  const fullUrl = `${verificationUrl}/${doc.verificationCode}/${doc.verificationCode}`
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8.5)
  pdf.setTextColor(greyR, greyG, greyB)
  pdf.text('URL de validacao', colLabel, y)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(7.5)
  pdf.setTextColor(darkR, darkG, darkB)
  pdf.text(fullUrl, colValue, y)

  y = H - 55

  drawLine(pdf, ML, y, MR, y, lineR, lineG, lineB, 0.5)
  y -= 14

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(6.5)
  pdf.setTextColor(lightGreyR, lightGreyG, lightGreyB)
  pdf.text('VeriDoc — Plataforma Oficial de Documentos Digitais da Republica de Angola', CX, y, { align: 'center' })
  y -= 10
  pdf.text('Emitido em ' + formatDate(doc.issuedAt) + ' | Verificado automaticamente', CX, y, { align: 'center' })

  return pdf.output('blob')
}

export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
