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

const registerSchema = z
  .object({
    name: z.string().min(3, 'Indique o seu nome completo.'),
    email: z.email('Introduza um e-mail válido.'),
    password: z.string().min(8, 'A palavra-passe deve ter pelo menos 8 caracteres.'),
    confirmPassword: z.string(),
    institutionName: z.string().min(3, 'Indique o nome da instituição.'),
    taxId: z.string().optional(),
    acceptTerms: z.boolean().refine((value) => value === true, {
      message: 'É necessário aceitar os termos de utilização.',
    }),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'As palavras-passe não coincidem.',
    path: ['confirmPassword'],
  })

type RegisterFormValues = z.infer<typeof registerSchema>

export function RegisterForm() {
  const { register: registerUser } = useAuth()
  const navigate = useNavigate()
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      institutionName: '',
      taxId: '',
      acceptTerms: false,
    },
  })

  async function onSubmit(values: RegisterFormValues) {
    setSubmitError(null)
    try {
      await registerUser({
        name: values.name,
        email: values.email,
        password: values.password,
        institutionName: values.institutionName,
        taxId: values.taxId || undefined,
        acceptTerms: values.acceptTerms,
      })
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
            ou criar com e-mail
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="register-name">Nome completo</Label>
          <Input
            id="register-name"
            placeholder="Nome completo"
            autoComplete="name"
            error={Boolean(errors.name)}
            {...register('name')}
          />
          {errors.name && <p className="mt-1.5 text-xs text-danger-600">{errors.name.message}</p>}
        </div>

        <div>
          <Label htmlFor="register-institution">Instituição</Label>
          <Input
            id="register-institution"
            placeholder="Nome da instituição"
            error={Boolean(errors.institutionName)}
            {...register('institutionName')}
          />
          {errors.institutionName && (
            <p className="mt-1.5 text-xs text-danger-600">{errors.institutionName.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="register-taxid" optional>
            NIF da instituição
          </Label>
          <Input id="register-taxid" placeholder="NIF (opcional)" {...register('taxId')} />
        </div>

        <div>
          <Label htmlFor="register-email">E-mail</Label>
          <Input
            id="register-email"
            type="email"
            placeholder="nome@instituicao.ao"
            autoComplete="email"
            error={Boolean(errors.email)}
            {...register('email')}
          />
          {errors.email && <p className="mt-1.5 text-xs text-danger-600">{errors.email.message}</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="register-password">Palavra-passe</Label>
            <Input
              id="register-password"
              type="password"
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
              error={Boolean(errors.password)}
              {...register('password')}
            />
            {errors.password && (
              <p className="mt-1.5 text-xs text-danger-600">{errors.password.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="register-confirm">Confirmar palavra-passe</Label>
            <Input
              id="register-confirm"
              type="password"
              placeholder="Repita a palavra-passe"
              autoComplete="new-password"
              error={Boolean(errors.confirmPassword)}
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && (
              <p className="mt-1.5 text-xs text-danger-600">{errors.confirmPassword.message}</p>
            )}
          </div>
        </div>

        <div>
          <label className="flex items-start gap-3 text-sm text-navy-600">
            <input
              type="checkbox"
              className="mt-0.5 size-4 rounded border-navy-300 accent-primary-600"
              {...register('acceptTerms')}
            />
            <span>
              Li e aceito os{' '}
              <Link to="/termos" className="font-medium text-primary-600 hover:text-primary-700">
                termos de utilização
              </Link>{' '}
              e a{' '}
              <Link to="/privacidade" className="font-medium text-primary-600 hover:text-primary-700">
                política de privacidade
              </Link>
              .
            </span>
          </label>
          {errors.acceptTerms && (
            <p className="mt-1.5 text-xs text-danger-600">{errors.acceptTerms.message}</p>
          )}
        </div>
      </div>

      <Button type="submit" fullWidth isLoading={isSubmitting}>
        Criar conta
      </Button>
    </form>
  )
}
