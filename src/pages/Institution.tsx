import { useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Building2, Camera, Pencil, Save, Trash2, X } from 'lucide-react'
import {
  getInstitution,
  updateInstitution,
  uploadInstitutionLogo,
  deleteInstitutionLogo,
} from '@/services/institution.service'
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

const MAX_FILE_SIZE = 500 * 1024
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml']

export default function Institution() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [editing, setEditing] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [logoError, setLogoError] = useState<string | null>(null)
  const [logoSuccess, setLogoSuccess] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)

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

  async function handleLogoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setLogoError(null)
    setLogoSuccess(false)

    if (!ALLOWED_TYPES.includes(file.type)) {
      setLogoError('Formato não suportado. Use PNG, JPG ou SVG.')
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setLogoError('Ficheiro demasiado grande. Máximo: 500 KB.')
      return
    }

    setUploadingLogo(true)
    try {
      await uploadInstitutionLogo(file)
      queryClient.invalidateQueries({ queryKey: ['institution'] })
      setLogoSuccess(true)
      setTimeout(() => setLogoSuccess(false), 3000)
    } catch (error) {
      setLogoError(getErrorMessage(error))
    } finally {
      setUploadingLogo(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleLogoDelete() {
    setLogoError(null)
    setLogoSuccess(false)
    try {
      await deleteInstitutionLogo()
      queryClient.invalidateQueries({ queryKey: ['institution'] })
    } catch (error) {
      setLogoError(getErrorMessage(error))
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

      <Card>
        <CardHeader
          title="Identidade da Instituição"
          description="Logotipo que aparece nos documentos emitidos."
        />
        <CardContent>
          <div className="flex flex-col items-start gap-6 sm:flex-row">
            <div className="flex flex-col items-center gap-3">
              <div className="relative flex size-32 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-navy-200 bg-navy-50">
                {institution.logo ? (
                  <img
                    src={institution.logo}
                    alt={`Logotipo de ${institution.legalName}`}
                    className="size-full object-contain p-2"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-navy-400">
                    <Building2 className="size-8" />
                    <span className="text-[10px]">Sem logotipo</span>
                  </div>
                )}
                {uploadingLogo && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                    <div className="size-6 animate-spin rounded-full border-2 border-navy-300 border-t-primary-600" />
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml"
                onChange={handleLogoUpload}
                className="hidden"
                aria-label="Carregar logotipo"
              />
            </div>

            <div className="flex-1 space-y-3">
              <p className="text-sm text-navy-600">
                O logotipo da instituição será apresentado lado a lado com o logotipo VeriDoc
                nos documentos emitidos.
              </p>
              <p className="text-xs text-navy-400">
                Formatos: PNG, JPG ou SVG. Tamanho máximo: 500 KB.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Camera className="size-3.5" />}
                  onClick={() => fileInputRef.current?.click()}
                  isLoading={uploadingLogo}
                >
                  {institution.logo ? 'Substituir logotipo' : 'Carregar logotipo'}
                </Button>
                {institution.logo && (
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<Trash2 className="size-3.5" />}
                    onClick={handleLogoDelete}
                    className="text-danger-600 hover:text-danger-700"
                  >
                    Remover
                  </Button>
                )}
              </div>
              {logoError && <Alert tone="danger">{logoError}</Alert>}
              {logoSuccess && (
                <Alert tone="success">Logotipo atualizado com sucesso.</Alert>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
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
