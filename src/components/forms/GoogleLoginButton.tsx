import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { USE_MOCKS, API_URL } from '@/services/config'
import { getErrorMessage } from '@/services/api'
import { Button } from '@/components/ui/Button'

function GoogleLogo() {
  return (
    <svg viewBox="0 0 24 24" className="size-4.5" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.5 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.45a5.08 5.08 0 0 1-2.2 3.34v2.77h3.56c2.08-1.92 3.69-4.74 3.69-8.35Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.56-2.77c-1.08.72-2.45 1.15-4.39 1.15-3.37 0-6.23-2.28-7.25-5.34H1.07v2.86A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M4.75 14.13a7.2 7.2 0 0 1 0-4.26V7.01H1.07a12 12 0 0 0 0 10.98l3.68-2.86Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.76 0 3.34.6 4.58 1.79l3.42-3.42A11.97 11.97 0 0 0 12 0 12 12 0 0 0 1.07 7.01l3.68 2.86C5.77 7.05 8.63 4.77 12 4.77Z"
      />
    </svg>
  )
}

export function GoogleLoginButton() {
  const { loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleGoogleLogin() {
    setError(null)
    setIsLoading(true)
    try {
      if (USE_MOCKS) {
        await loginWithGoogle({ idToken: 'mock-google-token' })
        navigate('/dashboard', { replace: true })
      } else {
        window.location.href = `${API_URL}/auth/google`
      }
    } catch (err) {
      setError(getErrorMessage(err))
      setIsLoading(false)
    }
  }

  return (
    <div>
      <Button
        type="button"
        variant="outline"
        fullWidth
        isLoading={isLoading}
        onClick={() => void handleGoogleLogin()}
        leftIcon={<GoogleLogo />}
      >
        Continuar com Google
      </Button>
      {error && <p className="mt-2 text-center text-xs text-danger-600">{error}</p>}
    </div>
  )
}
