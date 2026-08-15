export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

export function canonicalizeDocument(payload: Record<string, unknown>): string {
  const sorted: Record<string, unknown> = {}
  for (const key of Object.keys(payload).sort()) {
    sorted[key] = payload[key]
  }
  return JSON.stringify(sorted)
}
