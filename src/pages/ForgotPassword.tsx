import { useState } from 'react'
import { Link } from 'react-router-dom'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { MailCheck } from 'lucide-react'
import { AuthShell } from '@/components/auth/AuthShell'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Alert } from '@/components/ui/Alert'

const schema = z.object({
  email: z.email('Introduza um e-mail válido.'),
})

type Values = z.infer<typeof schema>

export default function ForgotPassword() {
  const [sent, setSent] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) })

  async function onSubmit(_values: Values) {
    setSent(true)
  }

  return (
    <AuthShell
      title="Recuperar palavra-passe"
      subtitle="Enviaremos um link para repor a sua palavra-passe."
      footer={
        <>
          Lembrou-se?{' '}
          <Link to="/login" className="font-medium text-primary-600 hover:text-primary-700">
            Iniciar sessão
          </Link>
        </>
      }
    >
      {sent ? (
        <div className="text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-success-100 text-success-600">
            <MailCheck className="size-7" />
          </div>
          <p className="font-display text-base font-semibold text-navy-900">
            Verifique o seu e-mail
          </p>
          <p className="mt-1 text-sm text-navy-500">
            Se existir uma conta associada, receberá em breve as instruções para repor a
            palavra-passe.
          </p>
          <Link to="/login" className="mt-6 inline-block">
            <Button variant="outline">Voltar ao login</Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <Alert tone="info">
            Esta funcionalidade será activada quando o backend estiver ligado. No modo de
            demonstração não são enviados e-mails.
          </Alert>
          <div>
            <Label htmlFor="forgot-email">E-mail</Label>
            <Input
              id="forgot-email"
              type="email"
              placeholder="nome@instituicao.ao"
              error={Boolean(errors.email)}
              {...register('email')}
            />
            {errors.email && <p className="mt-1.5 text-xs text-danger-600">{errors.email.message}</p>}
          </div>
          <Button type="submit" fullWidth isLoading={isSubmitting}>
            Enviar link de recuperação
          </Button>
        </form>
      )}
    </AuthShell>
  )
}
