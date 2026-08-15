import { useMutation } from '@tanstack/react-query'
import { verifyDocument } from '@/services/verification.service'
import type { VerificationQuery } from '@/types/verification'

export function useVerification() {
  return useMutation({
    mutationFn: (query: VerificationQuery) => verifyDocument(query),
  })
}
