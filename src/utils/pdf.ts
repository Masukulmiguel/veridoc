import { jsPDF } from 'jspdf'
import type { VeriDocument } from '@/types/document'
import { DOCUMENT_TYPE_LABELS, formatDate } from './format'

const NAVY = [18, 30, 69] as const
const RED = [200, 16, 46] as const
const LIGHT_GRAY = [245, 245, 245] as const
const MID_GRAY = [153, 153, 153] as const

async function loadLogoDataUrl(): Promise<string | null> {
  try {
    const response = await fetch('/logotipo.png')
    const blob = await response.blob()
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = reject
      el.src = URL.createObjectURL(blob)
    })
    const maxW = 160
    const maxH = 52
    let w = img.naturalWidth
    let h = img.naturalHeight
    if (w > maxW) { h = Math.round((h * maxW) / w); w = maxW }
    if (h > maxH) { w = Math.round((w * maxH) / h); h = maxH }
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.drawImage(img, 0, 0, w, h)
    return canvas.toDataURL('image/png')
  } catch {
    return null
  }
}

function drawSectionHeader(doc: jsPDF, y: number, title: string): number {
  doc.setFillColor(...LIGHT_GRAY)
  doc.rect(40, y - 5, 155, 8, 'F')
  doc.setFillColor(...RED)
  doc.rect(40, y + 3, 155, 0.7, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)
  doc.text(title, 50, y)
  return y
}

function drawFieldRow(doc: jsPDF, y: number, label: string, value: string): number {
  doc.setFont('helvetica', 'oblique')
  doc.setFontSize(9)
  doc.setTextColor(80, 80, 80)
  doc.text(label, 50, y)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(0, 0, 0)
  doc.text(value, 200, y)
  return y
}

export async function buildDocumentPdf(doc: VeriDocument, verificationUrl: string): Promise<Blob> {
  const fullUrl = `${verificationUrl}/${doc.verificationCode}`

  const docPdf = new jsPDF({ unit: 'pt', format: 'a4', compress: true })

  const logoDataUrl = await loadLogoDataUrl()

  // Header bar
  docPdf.setFillColor(...NAVY)
  docPdf.rect(0, 0, 595, 82, 'F')
  docPdf.setFillColor(...RED)
  docPdf.rect(0, 82, 595, 3, 'F')
  docPdf.setFillColor(246, 196, 48)
  docPdf.rect(0, 85, 595, 1, 'F')

  if (logoDataUrl) {
    try {
      docPdf.addImage(logoDataUrl, 'PNG', 30, 12, 130, 48)
    } catch {
      docPdf.setFont('helvetica', 'bold')
      docPdf.setFontSize(36)
      docPdf.setTextColor(255, 255, 255)
      docPdf.text('V', 35, 60)
    }
  } else {
    docPdf.setFont('helvetica', 'bold')
    docPdf.setFontSize(36)
    docPdf.setTextColor(255, 255, 255)
    docPdf.text('V', 35, 60)
  }

  // Verified badge
  docPdf.setFillColor(...RED)
  docPdf.roundedRect(420, 20, 150, 42, 4, 4, 'F')
  docPdf.setFont('helvetica', 'bold')
  docPdf.setFontSize(9)
  docPdf.setTextColor(255, 255, 255)
  docPdf.text('DOCUMENTO', 495, 37, { align: 'center' })
  docPdf.setFontSize(13)
  docPdf.text('VERIFICADO', 495, 53, { align: 'center' })

  let y = 115

  // Title
  docPdf.setFont('helvetica', 'bold')
  docPdf.setFontSize(18)
  docPdf.setTextColor(0, 0, 0)
  docPdf.text(doc.title, 40, y)
  y += 16

  // Institution
  docPdf.setFont('helvetica', 'oblique')
  docPdf.setFontSize(10)
  docPdf.setTextColor(80, 80, 80)
  docPdf.text(doc.institution.name, 40, y)
  y += 6

  docPdf.setFillColor(...MID_GRAY)
  docPdf.rect(40, y, 515, 0.5, 'F')
  y += 14

  // Document Info section
  drawSectionHeader(docPdf, y, 'INFORMAÇÕES DO DOCUMENTO')
  y += 18

  const fields: Array<[string, string]> = [
    ['Tipo de documento', DOCUMENT_TYPE_LABELS[doc.type] ?? doc.type],
    ['Número', doc.number],
    ['Titular', doc.holderName],
    ['Data de emissão', formatDate(doc.issuedAt)],
    ['Estado', doc.status],
    ['Código de validação', doc.verificationCode],
  ]

  for (const [label, value] of fields) {
    drawFieldRow(docPdf, y, `${label}:`, value)
    y += 16
  }

  y += 8

  // Security section
  drawSectionHeader(docPdf, y, 'SEGURANÇA E INTEGRIDADE')
  y += 18
  docPdf.setFont('helvetica', 'oblique')
  docPdf.setFontSize(8)
  docPdf.setTextColor(80, 80, 80)
  docPdf.text('Hash SHA-256:', 50, y)
  docPdf.setFont('courier', 'normal')
  docPdf.setFontSize(6)
  docPdf.setTextColor(0, 0, 0)
  const hashLine1 = doc.contentHash.slice(0, 80)
  const hashLine2 = doc.contentHash.slice(80, 160)
  docPdf.text(hashLine1, 130, y)
  y += 10
  if (hashLine2) docPdf.text(hashLine2, 130, y)
  y += 14

  // Signature section
  drawSectionHeader(docPdf, y, 'ASSINATURA DIGITAL')
  y += 18
  docPdf.setFont('helvetica', 'oblique')
  docPdf.setFontSize(8)
  docPdf.setTextColor(80, 80, 80)
  docPdf.text(`Algoritmo: ${doc.signature.algorithm}`, 50, y)
  y += 12
  docPdf.text(`Assinado por: ${doc.signature.signedBy}`, 50, y)
  y += 12
  docPdf.text(`Data: ${formatDate(doc.signature.signedAt)}`, 50, y)
  y += 16

  // Verification section
  drawSectionHeader(docPdf, y, 'VALIDAÇÃO DO DOCUMENTO')
  y += 18
  docPdf.setFont('helvetica', 'oblique')
  docPdf.setFontSize(9)
  docPdf.setTextColor(80, 80, 80)
  docPdf.text(`Aceda a: ${fullUrl}`, 50, y)
  y += 14
  docPdf.setFont('helvetica', 'bold')
  docPdf.setFontSize(9)
  docPdf.setTextColor(0, 0, 0)
  docPdf.text(`Código: ${doc.verificationCode}`, 50, y)

  // Footer bar
  docPdf.setFillColor(...NAVY)
  docPdf.rect(0, 797, 595, 45, 'F')
  docPdf.setFillColor(...RED)
  docPdf.rect(0, 794, 595, 3, 'F')
  docPdf.setFillColor(246, 196, 48)
  docPdf.rect(0, 792, 595, 2, 'F')

  docPdf.setFont('helvetica', 'oblique')
  docPdf.setFontSize(7)
  docPdf.setTextColor(200, 200, 200)
  docPdf.text('VeriDoc - Plataforma Oficial de Documentos Digitais da República de Angola', 40, 815)
  docPdf.setFont('courier', 'normal')
  docPdf.setFontSize(6)
  docPdf.setTextColor(160, 160, 160)
  docPdf.text(`Emitido em ${formatDate(doc.issuedAt)} | Verificado automaticamente`, 40, 827)

  return docPdf.output('blob')
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
