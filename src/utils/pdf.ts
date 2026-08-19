import type { VeriDocument } from '@/types/document'
import { DOCUMENT_TYPE_LABELS, formatDate } from './format'

function escapePdfText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/\n/g, ' ')
}

function textLine(x: number, y: number, size: number, font: string, text: string): string {
  return `BT\n/F${font} ${size} Tf\n${x} ${y} Td\n(${escapePdfText(text)}) Tj\nET\n`
}

function rect(x: number, y: number, w: number, h: number, r: number, g: number, b: number): string {
  return `${r} ${g} ${b} rg\n${x} ${y} ${w} ${h} re f\n`
}

async function loadLogoAsJpeg(): Promise<{ jpegBytes: Uint8Array; width: number; height: number } | null> {
  try {
    const response = await fetch('/logotipo.png')
    const blob = await response.blob()

    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = reject
      el.src = URL.createObjectURL(blob)
    })

    const maxW = 400
    const maxH = 130
    let w = img.naturalWidth
    let h = img.naturalHeight
    if (w > maxW) {
      h = Math.round((h * maxW) / w)
      w = maxW
    }
    if (h > maxH) {
      w = Math.round((w * maxH) / h)
      h = maxH
    }

    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.drawImage(img, 0, 0, w, h)

    const jpegBlob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.7)
    })

    if (!jpegBlob || jpegBlob.size > 100_000) return null

    const buf = await jpegBlob.arrayBuffer()
    return { jpegBytes: new Uint8Array(buf), width: w, height: h }
  } catch {
    return null
  }
}

export async function buildDocumentPdf(doc: VeriDocument, verificationUrl: string): Promise<Blob> {
  const fullUrl = `${verificationUrl}/${doc.verificationCode}`

  const logo = await loadLogoAsJpeg()

  let content = ''

  content += rect(0, 760, 595, 82, 0.07, 0.13, 0.27)
  content += rect(0, 757, 595, 3, 0.89, 0.10, 0.22)
  content += rect(0, 754, 595, 1, 0.96, 0.77, 0.19)

  if (logo) {
    content += `q\n${logo.width} 0 0 ${logo.height} 30 770 cm\n/Img1 Do\nQ\n`
  } else {
    content += textLine(35, 790, 36, '1', 'V')
  }

  content += rect(420, 785, 150, 35, 0.89, 0.10, 0.22)
  content += textLine(430, 797, 9, '1', 'DOCUMENTO')
  content += textLine(430, 784, 11, '1', 'VERIFICADO')

  content += textLine(40, 730, 18, '1', doc.title)
  content += textLine(40, 714, 10, '3', doc.institution.name)
  content += rect(40, 706, 515, 0.5, 0.60, 0.60, 0.60)

  content += rect(40, 680, 515, 22, 0.95, 0.95, 0.95)
  content += textLine(50, 685, 10, '1', 'INFORMACOES DO DOCUMENTO')
  content += rect(40, 678, 515, 2, 0.89, 0.10, 0.22)

  const fields: Array<[string, string]> = [
    ['Tipo de documento', DOCUMENT_TYPE_LABELS[doc.type] ?? doc.type],
    ['Numero', doc.number],
    ['Titular', doc.holderName],
    ['Data de emissao', formatDate(doc.issuedAt)],
    ['Estado', doc.status],
    ['Codigo de validacao', doc.verificationCode],
  ]

  let y = 660
  for (const [label, value] of fields) {
    content += textLine(50, y, 9, '3', `${label}:`)
    content += textLine(200, y, 9, '1', value)
    y -= 16
  }

  content += rect(40, y - 5, 515, 22, 0.95, 0.95, 0.95)
  content += textLine(50, y, 10, '1', 'SEGURANCA E INTEGRIDADE')
  content += rect(40, y - 7, 515, 2, 0.89, 0.10, 0.22)
  y -= 28
  content += textLine(50, y, 8, '3', 'Hash SHA-256:')
  content += textLine(130, y, 6, '4', doc.contentHash.slice(0, 80))
  y -= 12
  content += textLine(130, y, 6, '4', doc.contentHash.slice(80, 160))

  y -= 24
  content += rect(40, y - 5, 515, 22, 0.95, 0.95, 0.95)
  content += textLine(50, y, 10, '1', 'ASSINATURA DIGITAL')
  content += rect(40, y - 7, 515, 2, 0.89, 0.10, 0.22)
  y -= 28
  content += textLine(50, y, 8, '3', `Algoritmo: ${doc.signature.algorithm}`)
  y -= 14
  content += textLine(50, y, 8, '3', `Assinado por: ${doc.signature.signedBy}`)
  y -= 14
  content += textLine(50, y, 8, '3', `Data: ${formatDate(doc.signature.signedAt)}`)

  y -= 30
  content += rect(40, y - 5, 515, 22, 0.95, 0.95, 0.95)
  content += textLine(50, y, 10, '1', 'VALIDACAO DO DOCUMENTO')
  content += rect(40, y - 7, 515, 2, 0.89, 0.10, 0.22)
  y -= 28
  content += textLine(50, y, 9, '3', `Aceda a: ${fullUrl}`)
  y -= 16
  content += textLine(50, y, 9, '1', `Codigo: ${doc.verificationCode}`)

  content += rect(0, 0, 595, 45, 0.07, 0.13, 0.27)
  content += rect(0, 45, 595, 3, 0.89, 0.10, 0.22)
  content += rect(0, 48, 595, 1, 0.96, 0.77, 0.19)
  content += textLine(40, 24, 7, '3', 'VeriDoc - Plataforma Oficial de Documentos Digitais da Republica de Angola')
  content += textLine(40, 12, 7, '4', `Emitido em ${formatDate(doc.issuedAt)} | Verificado automaticamente`)

  const contentBytes = new TextEncoder().encode(content)

  const parts: (string | Uint8Array)[] = []
  const offsets: number[] = []
  let totalOffset = 0

  function pushStr(s: string) {
    offsets.push(totalOffset)
    parts.push(s)
    totalOffset += s.length
  }

  function pushBinary(data: Uint8Array) {
    parts.push(data)
    totalOffset += data.length
  }

  parts.push('%PDF-1.4\n%âãÏÓ\n')

  pushStr('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n')
  pushStr('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n')

  if (logo) {
    pushStr(`3 0 obj\n<< /Type /XObject /Subtype /Image /Width ${logo.width} /Height ${logo.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${logo.jpegBytes.length} >>\nstream\n`)
    offsets.push(totalOffset)
    pushBinary(logo.jpegBytes)
    parts.push('\nendstream\nendobj\n')
    totalOffset += '\nendstream\nendobj\n'.length

    pushStr(`4 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 6 0 R /F2 7 0 R /F3 8 0 R /F4 9 0 R >> /XObject << /Img1 3 0 R >> >> /Contents 5 0 R >>\nendobj\n`)
  } else {
    pushStr(`3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R /F2 6 0 R /F3 7 0 R /F4 8 0 R >> >> /Contents 4 0 R >>\nendobj\n`)
  }

  const contentId = logo ? 5 : 4
  pushStr(`${contentId} 0 obj\n<< /Length ${contentBytes.length} >>\nstream\n`)
  offsets.push(totalOffset)
  pushBinary(contentBytes)
  parts.push('\nendstream\nendobj\n')
  totalOffset += '\nendstream\nendobj\n'.length

  const fontStart = logo ? 6 : 5
  pushStr(`${fontStart} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n`)
  pushStr(`${fontStart + 1} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`)
  pushStr(`${fontStart + 2} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique >>\nendobj\n`)
  pushStr(`${fontStart + 3} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>\nendobj\n`)

  const objCount = fontStart + 4
  const xrefOffset = totalOffset
  let xref = `xref\n0 ${objCount}\n`
  xref += '0000000000 65535 f \n'
  for (const offset of offsets) {
    xref += `${String(offset).padStart(10, '0')} 00000 n \n`
  }
  parts.push(xref)
  parts.push(`trailer\n<< /Size ${objCount} /Root 1 0 R >>\n`)
  parts.push(`startxref\n${xrefOffset}\n%%EOF\n`)

  return new Blob(parts as BlobPart[], { type: 'application/pdf' })
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
