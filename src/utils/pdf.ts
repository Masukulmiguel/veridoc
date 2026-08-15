import type { VeriDocument } from '@/types/document'
import { DOCUMENT_TYPE_LABELS, formatDate } from './format'

function escapePdfText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/\n/g, ' ')
}

function encodeLatin1(text: string): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(new ArrayBuffer(text.length))
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i)
    bytes[i] = code > 0xff ? 0x3f : code
  }
  return bytes
}

interface PdfObject {
  id: number
  body: string
}

function assemblePdf(objects: PdfObject[]): Blob {
  let pdf = '%PDF-1.4\n'
  const offsets: number[] = []
  for (const obj of objects) {
    offsets.push(pdf.length)
    pdf += `${obj.id} 0 obj\n${obj.body}\nendobj\n`
  }
  const xrefStart = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n`
  pdf += '0000000000 65535 f \n'
  for (const offset of offsets) {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n`
  pdf += `startxref\n${xrefStart}\n%%EOF\n`
  return new Blob([encodeLatin1(pdf)], { type: 'application/pdf' })
}

function textLine(
  content: string,
  x: number,
  y: number,
  size: number,
  font: string,
  text: string,
): string {
  return `${content}BT\n/F${font} ${size} Tf\n${x} ${y} Td\n(${escapePdfText(text)}) Tj\nET\n`
}

export function buildDocumentPdf(document: VeriDocument, verificationUrl: string): Blob {
  const rows: Array<[string, string]> = [
    ['Tipo de documento', DOCUMENT_TYPE_LABELS[document.type] ?? document.type],
    ['Número', document.number],
    ['Titular', document.holderName],
    ['Data de emissão', formatDate(document.issuedAt)],
    ['Estado', document.status],
    ['Código de validação', document.verificationCode],
  ]

  let content = ''
  content += textLine(content, 50, 800, 22, '1', 'VeriDoc')
  content += textLine(content, 50, 784, 9, '3', 'Confianca digital em cada documento')
  content += textLine(content, 385, 800, 11, '2', 'Documento verificado')
  content += textLine(content, 50, 750, 16, '1', document.title)
  content += textLine(content, 50, 734, 11, '3', document.institution.name)
  content += textLine(content, 50, 714, 10, '2', 'Informacao do documento')
  content += textLine(content, 50, 694, 9, '2', '--------------------------------------------------')

  let y = 674
  for (const [label, value] of rows) {
    content += textLine(content, 50, y, 10, '2', `${label}: ${value}`)
    y -= 18
  }

  content += textLine(content, 50, y - 8, 9, '2', `Hash SHA-256: ${document.contentHash.slice(0, 32)}...`)
  content += textLine(content, 50, y - 30, 10, '3', `Valide este documento em ${verificationUrl}`)
  content += textLine(content, 50, 64, 12, '1', 'VeriDoc Certified')

  const length = encodeLatin1(content).length
  const objects: PdfObject[] = [
    { id: 1, body: '<< /Type /Catalog /Pages 2 0 R >>' },
    { id: 2, body: '<< /Type /Pages /Kids [3 0 R] /Count 1 >>' },
    {
      id: 3,
      body: '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R /F2 6 0 R /F3 7 0 R >> >> /Contents 4 0 R >>',
    },
    { id: 4, body: `<< /Length ${length} >>\nstream\n${content}\nendstream` },
    { id: 5, body: '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>' },
    { id: 6, body: '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>' },
    { id: 7, body: '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique >>' },
  ]

  return assemblePdf(objects)
}

export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
