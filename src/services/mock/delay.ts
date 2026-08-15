export function delay(ms = 450): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
