import type { VeriDocument } from '@/types/document'
import { DOCUMENT_TYPE_LABELS, formatDate } from './format'

function escapePdfText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/\n/g, ' ')
}

function encodeLatin1(text: string): Uint8Array {
  const bytes = new Uint8Array(new ArrayBuffer(text.length))
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i)
    bytes[i] = code > 0xff ? 0x3f : code
  }
  return bytes
}

interface PdfObject {
  id: number
  body: string | Uint8Array
}

function assemblePdf(objects: PdfObject[]): Blob {
  const parts: string[] = []
  const offsets: number[] = []

  parts.push('%PDF-1.4\n%âãÏÓ\n')

  for (const obj of objects) {
    offsets.push(parts.join('').length)
    const header = `${obj.id} 0 obj\n`
    if (typeof obj.body === 'string') {
      parts.push(header + obj.body + '\nendobj\n')
    } else {
      parts.push(header)
      const imgStart = parts.join('').length
      void imgStart
      const str = new TextDecoder().decode(obj.body)
      parts.push(str + '\nendobj\n')
    }
  }

  const xrefOffset = parts.join('').length
  let xref = `xref\n0 ${objects.length + 1}\n`
  xref += '0000000000 65535 f \n'
  for (const offset of offsets) {
    xref += `${String(offset).padStart(10, '0')} 00000 n \n`
  }
  parts.push(xref)
  parts.push(`trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n`)
  parts.push(`startxref\n${xrefOffset}\n%%EOF\n`)

  return new Blob([parts.join('')], { type: 'application/pdf' })
}

function assemblePdfWithImage(objects: PdfObject[], imageBytes: Uint8Array): Blob {
  const header = '%PDF-1.4\n%âãÏÓ\n'
  const sections: string[] = []
  const offsets: number[] = []

  for (const obj of objects) {
    offsets.push(header.length + sections.join('').length)
    const objHeader = `${obj.id} 0 obj\n`

    if (obj.id === 3) {
      sections.push(objHeader + (obj.body as string))
      const binaryStr = new TextDecoder('latin1').decode(imageBytes)
      sections.push(binaryStr + '\nendstream\nendobj\n')
    } else if (typeof obj.body === 'string') {
      sections.push(objHeader + obj.body + '\nendobj\n')
    } else {
      sections.push(objHeader + new TextDecoder('latin1').decode(obj.body) + '\nendobj\n')
    }
  }

  const xrefOffset = header.length + sections.join('').length
  let xref = `xref\n0 ${objects.length + 1}\n`
  xref += '0000000000 65535 f \n'
  for (const offset of offsets) {
    xref += `${String(offset).padStart(10, '0')} 00000 n \n`
  }

  const fullPdf = header + sections.join('') + xref + `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n` + `startxref\n${xrefOffset}\n%%EOF\n`
  return new Blob([fullPdf], { type: 'application/pdf' })
}

function textLine(content: string, x: number, y: number, size: number, font: string, text: string): string {
  return `${content}BT\n/F${font} ${size} Tf\n${x} ${y} Td\n(${escapePdfText(text)}) Tj\nET\n`
}

function rect(x: number, y: number, w: number, h: number, r: number, g: number, b: number): string {
  return `${r} ${g} ${b} rg\n${x} ${y} ${w} ${h} re f\n`
}

async function loadImageAsRgb(url: string): Promise<{ pixels: Uint8Array; width: number; height: number }> {
  const response = await fetch(url)
  const imageBlob = await response.blob()

  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      resolve({
        pixels: new Uint8Array(imageData.data.buffer),
        width: canvas.width,
        height: canvas.height,
      })
    }
    img.onerror = reject
    img.src = URL.createObjectURL(imageBlob)
  })
}

export async function buildDocumentPdf(doc: VeriDocument, verificationUrl: string): Promise<Blob> {
  const fullUrl = `${verificationUrl}/${doc.verificationCode}`

  let logoWidth = 0
  let logoHeight = 0
  let logoPixels: Uint8Array | null = null
  try {
    const logo = await loadImageAsRgb('/logotipo.jpg')
    logoWidth = logo.width
    logoHeight = logo.height
    logoPixels = logo.pixels
  } catch {
    // fallback: sem logo
  }

  let content = ''

  // HEADER
  content += rect(0, 760, 595, 82, 0.07, 0.13, 0.27)
  content += rect(0, 757, 595, 3, 0.89, 0.10, 0.22)
  content += rect(0, 754, 595, 1, 0.96, 0.77, 0.19)

  if (logoPixels) {
    content += `q\n155 0 0 50 30 770 cm\n/Img1 Do\nQ\n`
  } else {
    content += textLine(content, 35, 790, 36, '1', 'V')
  }

  content += rect(420, 785, 150, 35, 0.89, 0.10, 0.22)
  content += textLine(content, 430, 797, 9, '1', 'DOCUMENTO')
  content += textLine(content, 430, 784, 11, '1', 'VERIFICADO')

  // DOCUMENTO
  content += textLine(content, 40, 730, 18, '1', doc.title)
  content += textLine(content, 40, 714, 10, '3', doc.institution.name)
  content += rect(40, 706, 515, 0.5, 0.60, 0.60, 0.60)

  // INFORMACOES
  content += rect(40, 680, 515, 22, 0.95, 0.95, 0.95)
  content += textLine(content, 50, 685, 10, '1', 'INFORMACOES DO DOCUMENTO')
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
    content += textLine(content, 50, y, 9, '3', `${label}:`)
    content += textLine(content, 200, y, 9, '1', value)
    y -= 16
  }

  // SEGURANCA
  content += rect(40, y - 5, 515, 22, 0.95, 0.95, 0.95)
  content += textLine(content, 50, y, 10, '1', 'SEGURANCA E INTEGRIDADE')
  content += rect(40, y - 7, 515, 2, 0.89, 0.10, 0.22)
  y -= 28
  content += textLine(content, 50, y, 8, '3', 'Hash SHA-256:')
  content += textLine(content, 130, y, 6, '4', doc.contentHash.slice(0, 80))
  y -= 12
  content += textLine(content, 130, y, 6, '4', doc.contentHash.slice(80, 160))

  // ASSINATURA
  y -= 24
  content += rect(40, y - 5, 515, 22, 0.95, 0.95, 0.95)
  content += textLine(content, 50, y, 10, '1', 'ASSINATURA DIGITAL')
  content += rect(40, y - 7, 515, 2, 0.89, 0.10, 0.22)
  y -= 28
  content += textLine(content, 50, y, 8, '3', `Algoritmo: ${doc.signature.algorithm}`)
  y -= 14
  content += textLine(content, 50, y, 8, '3', `Assinado por: ${doc.signature.signedBy}`)
  y -= 14
  content += textLine(content, 50, y, 8, '3', `Data: ${formatDate(doc.signature.signedAt)}`)

  // VALIDACAO
  y -= 30
  content += rect(40, y - 5, 515, 22, 0.95, 0.95, 0.95)
  content += textLine(content, 50, y, 10, '1', 'VALIDACAO DO DOCUMENTO')
  content += rect(40, y - 7, 515, 2, 0.89, 0.10, 0.22)
  y -= 28
  content += textLine(content, 50, y, 9, '3', `Aceda a: ${fullUrl}`)
  y -= 16
  content += textLine(content, 50, y, 9, '1', `Codigo: ${doc.verificationCode}`)

  // RODAPE
  content += rect(0, 0, 595, 45, 0.07, 0.13, 0.27)
  content += rect(0, 45, 595, 3, 0.89, 0.10, 0.22)
  content += rect(0, 48, 595, 1, 0.96, 0.77, 0.19)
  content += textLine(content, 40, 24, 7, '3', 'VeriDoc - Plataforma Oficial de Documentos Digitais da Republica de Angola')
  content += textLine(content, 40, 12, 7, '4', `Emitido em ${formatDate(doc.issuedAt)} | Verificado automaticamente`)

  const length = encodeLatin1(content).length

  const objects: PdfObject[] = [
    { id: 1, body: '<< /Type /Catalog /Pages 2 0 R >>' },
    { id: 2, body: '<< /Type /Pages /Kids [3 0 R] /Count 1 >>' },
  ]

  if (logoPixels) {
    objects.push({ id: 3, body: `<< /Type /XObject /Subtype /Image /Width ${logoWidth} /Height ${logoHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode >>` })
    objects.push({ id: 4, body: `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 6 0 R /F2 7 0 R /F3 8 0 R /F4 9 0 R >> /XObject << /Img1 3 0 R >> >> /Contents 5 0 R >>` })
  } else {
    objects.push({ id: 3, body: `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R /F2 6 0 R /F3 7 0 R /F4 8 0 R >> >> /Contents 4 0 R >>` })
  }

  const contentId = logoPixels ? 5 : 4
  objects.push({ id: contentId, body: `<< /Length ${length} >>\nstream\n${content}\nendstream` })

  const fontStart = logoPixels ? 6 : 5
  objects.push({ id: fontStart, body: '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>' })
  objects.push({ id: fontStart + 1, body: '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>' })
  objects.push({ id: fontStart + 2, body: '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique >>' })
  objects.push({ id: fontStart + 3, body: '<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>' })

  if (logoPixels) {
    const jpegBlob = await new Promise<Blob | null>((resolve) => {
      const canvas = document.createElement('canvas')
      canvas.width = logoWidth
      canvas.height = logoHeight
      const ctx = canvas.getContext('2d')!
      const imageData = ctx.createImageData(logoWidth, logoHeight)
      imageData.data.set(logoPixels!)
      ctx.putImageData(imageData, 0, 0)
      canvas.toBlob((b: Blob | null) => resolve(b), 'image/jpeg', 0.85)
    })

    if (jpegBlob) {
      const jpegBytes = new Uint8Array(await jpegBlob.arrayBuffer())
      objects[2] = { id: 3, body: `<< /Type /XObject /Subtype /Image /Width ${logoWidth} /Height ${logoHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n` }
      return assemblePdfWithImage(objects, jpegBytes)
    }
  }

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
