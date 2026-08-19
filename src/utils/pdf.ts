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

export async function buildDocumentPdf(
  doc: VeriDocument,
  verificationUrl: string,
  institutionLogoDataUrl?: string | null,
): Promise<Blob> {
  const pdf = new jsPDF({ unit: 'pt', format: 'a4', compress: true })
  const pageW = 595
  const pageH = 842

  const bgDataUrl = await fetchImageAsDataUrl('/modelo-fundo-doc.png')
  if (bgDataUrl) {
    try {
      const bgImg = await dataUrlToImage(bgDataUrl)
      pdf.addImage(bgImg, 'PNG', 0, 0, pageW, pageH)
    } catch { /* skip */ }
  }

  const veridocLogoDataUrl = await fetchImageAsDataUrl('/logotipo.png')
  if (veridocLogoDataUrl) {
    try {
      const logoImg = await dataUrlToImage(veridocLogoDataUrl)
      pdf.addImage(logoImg, 'PNG', 40, 28, 90, 48)
    } catch { /* skip */ }
  }
  if (institutionLogoDataUrl) {
    try {
      const instImg = await dataUrlToImage(institutionLogoDataUrl)
      pdf.addImage(instImg, 'PNG', pageW - 130, 28, 90, 48)
    } catch { /* skip */ }
  }

  try {
    const qrRes = await api.get(`/documents/${doc.id}/qrcode`, { responseType: 'blob' })
    if (qrRes.data) {
      const qrDataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.readAsDataURL(qrRes.data)
      })
      const qrImg = await dataUrlToImage(qrDataUrl)
      pdf.addImage(qrImg, 'PNG', pageW - 115, 90, 80, 80)
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(6)
      pdf.setTextColor(120, 120, 120)
      pdf.text('Verifique a autenticidade', pageW - 75, 175, { align: 'center' })
      pdf.text('deste documento', pageW - 75, 182, { align: 'center' })
    }
  } catch { /* skip QR */ }

  let y = 200

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(18)
  pdf.setTextColor(18, 30, 69)
  pdf.text(doc.title.toUpperCase(), pageW / 2, y, { align: 'center' })
  y += 22

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(11)
  pdf.setTextColor(80, 80, 80)
  pdf.text(doc.institution.name, pageW / 2, y, { align: 'center' })
  y += 30

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(10)
  pdf.setTextColor(18, 30, 69)
  pdf.text('INFORMACOES DO DOCUMENTO', 50, y)
  y += 18

  const fields: Array<[string, string]> = [
    ['Tipo de documento:', DOCUMENT_TYPE_LABELS[doc.type] ?? doc.type],
    ['Numero:', doc.number],
    ['Titular:', doc.holderName],
    ['Data de emissao:', formatDate(doc.issuedAt)],
    ['Estado:', doc.status],
    ['Codigo de validacao:', doc.verificationCode],
  ]

  for (const [label, value] of fields) {
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(9)
    pdf.setTextColor(100, 100, 100)
    pdf.text(label, 50, y)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(20, 20, 20)
    pdf.text(value, 190, y)
    y += 15
  }

  y += 10

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(10)
  pdf.setTextColor(18, 30, 69)
  pdf.text('SEGURANCA E INTEGRIDADE', 50, y)
  y += 16

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(9)
  pdf.setTextColor(100, 100, 100)
  pdf.text('Hash SHA-256:', 50, y)
  y += 14

  pdf.setFont('courier', 'normal')
  pdf.setFontSize(7)
  pdf.setTextColor(20, 20, 20)
  const hash1 = doc.contentHash.slice(0, 80)
  const hash2 = doc.contentHash.slice(80, 160)
  pdf.text(hash1, 50, y)
  y += 10
  if (hash2) pdf.text(hash2, 50, y)
  y += 18

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(10)
  pdf.setTextColor(18, 30, 69)
  pdf.text('ASSINATURA DIGITAL', 50, y)
  y += 16

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(9)
  pdf.setTextColor(100, 100, 100)
  pdf.text('Algoritmo:', 50, y)
  pdf.setTextColor(20, 20, 20)
  pdf.text(doc.signature.algorithm, 120, y)
  y += 14

  pdf.setTextColor(100, 100, 100)
  pdf.text('Assinado por:', 50, y)
  pdf.setTextColor(20, 20, 20)
  pdf.text(doc.signature.signedBy, 145, y)
  y += 14

  pdf.setTextColor(100, 100, 100)
  pdf.text('Data:', 50, y)
  pdf.setTextColor(20, 20, 20)
  pdf.text(formatDate(doc.signature.signedAt), 90, y)
  y += 22

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(10)
  pdf.setTextColor(18, 30, 69)
  pdf.text('VALIDACAO DO DOCUMENTO', 50, y)
  y += 16

  const fullUrl = `${verificationUrl}/${doc.verificationCode}/${doc.verificationCode}`
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(9)
  pdf.setTextColor(100, 100, 100)
  pdf.text('Aceda a:', 50, y)
  pdf.setTextColor(20, 20, 20)
  pdf.text(fullUrl, 110, y)
  y += 14

  pdf.setTextColor(100, 100, 100)
  pdf.text('Codigo:', 50, y)
  pdf.setTextColor(20, 20, 20)
  pdf.text(doc.verificationCode, 110, y)
  y += 30

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(7)
  pdf.setTextColor(140, 140, 140)
  pdf.text('VeriDoc - Plataforma Oficial de Documentos Digitais da Republica de Angola', pageW / 2, pageH - 50, { align: 'center' })
  pdf.text('Emitido em ' + formatDate(doc.issuedAt) + ' | Verificado automaticamente', pageW / 2, pageH - 40, { align: 'center' })

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
