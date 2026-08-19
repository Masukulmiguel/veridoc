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

function drawSectionHeader(doc: jsPDF, y: number, title: string): number {
  doc.setFillColor(240, 240, 240)
  doc.rect(40, y - 4, 515, 9, 'F')
  doc.setFillColor(200, 16, 46)
  doc.rect(40, y + 5, 515, 0.6, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(40, 40, 40)
  doc.text(title, 50, y)
  return y
}

function drawField(doc: jsPDF, y: number, label: string, value: string, bold = false): number {
  doc.setFont('helvetica', 'oblique')
  doc.setFontSize(8.5)
  doc.setTextColor(100, 100, 100)
  doc.text(label, 50, y)
  doc.setFont('helvetica', bold ? 'bold' : 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(20, 20, 20)
  doc.text(value, 200, y, { maxWidth: 340 })
  return y
}

export async function buildDocumentPdf(
  doc: VeriDocument,
  verificationUrl: string,
  institutionLogoDataUrl?: string | null,
): Promise<Blob> {
  const fullUrl = `${verificationUrl}/${doc.verificationCode}`

  const pdf = new jsPDF({ unit: 'pt', format: 'a4', compress: true })
  const pageW = 595
  const pageH = 842

  // Load background image
  const bgDataUrl = await fetchImageAsDataUrl('/modelo-fundo-doc.png')
  if (bgDataUrl) {
    try {
      const bgImg = await dataUrlToImage(bgDataUrl)
      pdf.addImage(bgImg, 'PNG', 0, 0, pageW, pageH)
    } catch { /* fallback: no background */ }
  }

  // Load VeriDoc logo
  const veridocLogoDataUrl = await fetchImageAsDataUrl('/logotipo.png')

  // --- HEADER ZONE (y: 30-100) ---
  // VeriDoc logo (left)
  if (veridocLogoDataUrl) {
    try {
      const logoImg = await dataUrlToImage(veridocLogoDataUrl)
      pdf.addImage(logoImg, 'PNG', 40, 25, 100, 50)
    } catch { /* skip */ }
  }

  // Institution logo (right)
  if (institutionLogoDataUrl) {
    try {
      const instImg = await dataUrlToImage(institutionLogoDataUrl)
      pdf.addImage(instImg, 'PNG', pageW - 140, 25, 100, 50)
    } catch { /* skip */ }
  }

  // --- QR CODE (top right area) ---
  try {
    const qrRes = await api.get(`/documents/${doc.id}/qrcode`, { responseType: 'blob' })
    if (qrRes.data) {
      const qrDataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.readAsDataURL(qrRes.data)
      })
      const qrImg = await dataUrlToImage(qrDataUrl)
      pdf.addImage(qrImg, 'PNG', pageW - 130, 80, 90, 90)
      pdf.setFont('helvetica', 'oblique')
      pdf.setFontSize(6)
      pdf.setTextColor(120, 120, 120)
      pdf.text('Verifique a autenticidade', pageW - 85, 175, { align: 'center' })
      pdf.text('deste documento', pageW - 85, 182, { align: 'center' })
    }
  } catch { /* skip QR */ }

  // --- TITLE ZONE (y: ~120) ---
  let y = 130
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(20)
  pdf.setTextColor(18, 30, 69)
  pdf.text(doc.title.toUpperCase(), pageW / 2, y, { align: 'center' })
  y += 20

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(10)
  pdf.setTextColor(100, 100, 100)
  pdf.text(doc.institution.name, pageW / 2, y, { align: 'center' })
  y += 25

  // Divider line
  pdf.setFillColor(200, 16, 46)
  pdf.rect(40, y, 515, 1, 'F')
  y += 20

  // --- INFORMACOES DO DOCUMENTO ---
  drawSectionHeader(pdf, y, 'INFORMAÇÕES DO DOCUMENTO')
  y += 16

  const fields: Array<[string, string]> = [
    ['Tipo de documento:', DOCUMENT_TYPE_LABELS[doc.type] ?? doc.type],
    ['Número:', doc.number],
    ['Titular:', doc.holderName],
    ['Data de emissão:', formatDate(doc.issuedAt)],
    ['Estado:', doc.status],
    ['Código de validação:', doc.verificationCode],
  ]

  for (const [label, value] of fields) {
    drawField(pdf, y, label, value)
    y += 14
  }

  y += 10

  // --- SEGURANCA E INTEGRIDADE ---
  drawSectionHeader(pdf, y, 'SEGURANÇA E INTEGRIDADE')
  y += 16
  pdf.setFont('helvetica', 'oblique')
  pdf.setFontSize(8)
  pdf.setTextColor(100, 100, 100)
  pdf.text('Hash SHA-256:', 50, y)
  pdf.setFont('courier', 'normal')
  pdf.setFontSize(6)
  pdf.setTextColor(20, 20, 20)
  const hash1 = doc.contentHash.slice(0, 80)
  const hash2 = doc.contentHash.slice(80, 160)
  pdf.text(hash1, 130, y)
  y += 10
  if (hash2) pdf.text(hash2, 130, y)
  y += 16

  // --- ASSINATURA DIGITAL ---
  drawSectionHeader(pdf, y, 'ASSINATURA DIGITAL')
  y += 16
  pdf.setFont('helvetica', 'oblique')
  pdf.setFontSize(8)
  pdf.setTextColor(100, 100, 100)
  pdf.text(`Algoritmo: ${doc.signature.algorithm}`, 50, y)
  y += 12
  pdf.text(`Assinado por: ${doc.signature.signedBy}`, 50, y)
  y += 12
  pdf.text(`Data: ${formatDate(doc.signature.signedAt)}`, 50, y)
  y += 20

  // --- VALIDACAO DO DOCUMENTO ---
  drawSectionHeader(pdf, y, 'VALIDAÇÃO DO DOCUMENTO')
  y += 16
  pdf.setFont('helvetica', 'oblique')
  pdf.setFontSize(8)
  pdf.setTextColor(100, 100, 100)
  pdf.text(`Aceda a: ${fullUrl}`, 50, y)
  y += 14
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(9)
  pdf.setTextColor(20, 20, 20)
  pdf.text(`Código: ${doc.verificationCode}`, 50, y)

  // --- FOOTER ZONE ---
  const footerY = pageH - 40
  pdf.setFillColor(18, 30, 69)
  pdf.rect(0, footerY - 5, pageW, 45, 'F')
  pdf.setFillColor(200, 16, 46)
  pdf.rect(0, footerY - 7, pageW, 2, 'F')

  pdf.setFont('helvetica', 'oblique')
  pdf.setFontSize(7)
  pdf.setTextColor(200, 200, 200)
  pdf.text('VeriDoc - Plataforma Oficial de Documentos Digitais da República de Angola', pageW / 2, footerY + 12, { align: 'center' })
  pdf.setFont('courier', 'normal')
  pdf.setFontSize(6)
  pdf.setTextColor(160, 160, 160)
  pdf.text(`Emitido em ${formatDate(doc.issuedAt)} | Verificado automaticamente`, pageW / 2, footerY + 24, { align: 'center' })

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
