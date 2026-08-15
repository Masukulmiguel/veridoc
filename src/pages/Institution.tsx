import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Building2, Pencil, Save, X } from 'lucide-react'
import { getInstitution, updateInstitution } from '@/services/institution.service'
import { getErrorMessage } from '@/services/api'
import { useAuth } from '@/hooks/useAuth'
import { formatDate } from '@/utils/format'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'

const institutionSchema = z.object({
  legalName: z.string().min(3, 'O nome legal é obrigatório.'),
  taxId: z.string().optional(),
  email: z.email('Introduza um e-mail válido.'),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  website: z.string().optional(),
})

type InstitutionFormValues = z.infer<typeof institutionSchema>

export default function Institution() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const { data: institution, isLoading, isError } = useQuery({
    queryKey: ['institution'],
    queryFn: getInstitution,
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InstitutionFormValues>({
    resolver: zodResolver(institutionSchema),
    values: institution
      ? {
          legalName: institution.legalName,
          taxId: institution.taxId ?? '',
          email: institution.email,
          phone: institution.phone ?? '',
          address: institution.address ?? '',
          city: institution.city ?? '',
          country: institution.country ?? '',
          website: institution.website ?? '',
        }
      : undefined,
  })

  const isAdmin = user?.role === 'ADMIN'

  async function onSubmit(values: InstitutionFormValues) {
    setSaveError(null)
    try {
      await updateInstitution({
        legalName: values.legalName,
        taxId: values.taxId || null,
        email: values.email,
        phone: values.phone || null,
        address: values.address || null,
        city: values.city || null,
        country: values.country || null,
        website: values.website || null,
      })
      queryClient.invalidateQueries({ queryKey: ['institution'] })
      setEditing(false)
    } catch (error) {
      setSaveError(getErrorMessage(error))
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    )
  }

  if (isError || !institution) {
    return <EmptyState title="Não foi possível carregar a instituição" />
  }

  const statusTone =
    institution.status === 'ACTIVE'
      ? ('success' as const)
      : institution.status === 'SUSPENDED'
        ? ('danger' as const)
        : ('warning' as const)

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Instituição"
        description="Dados do perfil institucional."
        actions={
          isAdmin &&
          (editing ? (
            <>
              <Button variant="ghost" leftIcon={<X className="size-4" />} onClick={() => { reset(); setEditing(false) }}>
                Cancelar
              </Button>
              <Button form="institution-form" type="submit" leftIcon={<Save className="size-4" />}>
                Guardar alterações
              </Button>
            </>
          ) : (
            <Button variant="outline" leftIcon={<Pencil className="size-4" />} onClick={() => setEditing(true)}>
              Editar dados
            </Button>
          ))
        }
      />

      {saveError && <Alert tone="danger">{saveError}</Alert>}

      {!editing ? (
        <Card>
          <CardHeader
            title={institution.legalName}
            description={`Registada na VeriDoc a ${formatDate(institution.createdAt)}`}
            action={<Badge tone={statusTone}>{institution.status.toLowerCase()}</Badge>}
          />
          <CardContent>
            <div className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-navy-900 text-white">
              <Building2 className="size-8" />
            </div>
            <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
              <InfoItem label="Nome legal" value={institution.legalName} />
              <InfoItem label="NIF" value={institution.taxId ?? '—'} />
              <InfoItem label="E-mail" value={institution.email} />
              <InfoItem label="Telefone" value={institution.phone ?? '—'} />
              <InfoItem label="Endereço" value={institution.address ?? '—'} />
              <InfoItem label="Cidade" value={institution.city ?? '—'} />
              <InfoItem label="País" value={institution.country ?? '—'} />
              <InfoItem label="Website" value={institution.website ?? '—'} />
            </dl>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent>
            <form
              id="institution-form"
              onSubmit={handleSubmit(onSubmit)}
              className="grid gap-5 sm:grid-cols-2"
              noValidate
            >
              <div>
                <Label htmlFor="inst-name">Nome legal</Label>
                <Input id="inst-name" error={Boolean(errors.legalName)} {...register('legalName')} />
                {errors.legalName && (
                  <p className="mt-1.5 text-xs text-danger-600">{errors.legalName.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="inst-taxid" optional>NIF</Label>
                <Input id="inst-taxid" {...register('taxId')} />
              </div>
              <div>
                <Label htmlFor="inst-email">E-mail</Label>
                <Input id="inst-email" type="email" error={Boolean(errors.email)} {...register('email')} />
                {errors.email && <p className="mt-1.5 text-xs text-danger-600">{errors.email.message}</p>}
              </div>
              <div>
                <Label htmlFor="inst-phone" optional>Telefone</Label>
                <Input id="inst-phone" {...register('phone')} />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="inst-address" optional>Endereço</Label>
                <Input id="inst-address" {...register('address')} />
              </div>
              <div>
                <Label htmlFor="inst-city" optional>Cidade</Label>
                <Input id="inst-city" {...register('city')} />
              </div>
              <div>
                <Label htmlFor="inst-country" optional>País</Label>
                <Input id="inst-country" {...register('country')} />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="inst-website" optional>Website</Label>
                <Input id="inst-website" {...register('website')} />
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-navy-400">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-navy-900">{value}</dd>
    </div>
  )
}
