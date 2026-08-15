import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/hooks/useAuth'
import { getErrorMessage } from '@/services/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Alert } from '@/components/ui/Alert'
import { GoogleLoginButton } from './GoogleLoginButton'

const loginSchema = z.object({
  email: z.email('Introduza um e-mail válido.'),
  password: z.string().min(8, 'A palavra-passe deve ter pelo menos 8 caracteres.'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export function LoginForm() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit(values: LoginFormValues) {
    setSubmitError(null)
    try {
      await login(values)
      navigate('/dashboard', { replace: true })
    } catch (error) {
      setSubmitError(getErrorMessage(error))
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {submitError && <Alert tone="danger">{submitError}</Alert>}

      <GoogleLoginButton />

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-navy-200" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-3 text-xs uppercase tracking-wide text-navy-400">
            ou com e-mail
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="login-email">E-mail</Label>
          <Input
            id="login-email"
            type="email"
            placeholder="nome@instituicao.ao"
            autoComplete="email"
            error={Boolean(errors.email)}
            {...register('email')}
          />
          {errors.email && <p className="mt-1.5 text-xs text-danger-600">{errors.email.message}</p>}
        </div>

        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="login-password">Palavra-passe</Label>
            <Link
              to="/recuperar-palavra-passe"
              className="mb-1.5 text-xs font-medium text-primary-600 hover:text-primary-700"
            >
              Esqueceu-se da palavra-passe?
            </Link>
          </div>
          <Input
            id="login-password"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            error={Boolean(errors.password)}
            {...register('password')}
          />
          {errors.password && (
            <p className="mt-1.5 text-xs text-danger-600">{errors.password.message}</p>
          )}
        </div>
      </div>

      <Button type="submit" fullWidth isLoading={isSubmitting}>
        Entrar
      </Button>
    </form>
  )
}
