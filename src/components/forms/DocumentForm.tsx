import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { DOCUMENT_TYPE_OPTIONS } from '@/utils/format'
import { generateDocumentNumber } from '@/utils/identifiers'
import type { CreateDocumentPayload } from '@/types/document'

const fieldSchema = z.object({
  label: z.string().min(1, 'Indique um rótulo.'),
  value: z.string().min(1, 'Indique um valor.'),
})

const documentSchema = z.object({
  type: z.enum(['CERTIFICATE', 'DIPLOMA', 'TRANSCRIPT', 'DECLARATION', 'CONTRACT', 'OTHER']),
  title: z.string().min(3, 'O título deve ter pelo menos 3 caracteres.'),
  holderName: z.string().min(3, 'Indique o nome do titular.'),
  number: z.string().min(3, 'Indique o número do documento.'),
  description: z.string().optional(),
  issuedAt: z.string().min(1, 'A data de emissão é obrigatória.'),
  expiresAt: z.string().optional(),
  fields: z.array(fieldSchema),
})

export type DocumentFormValues = z.infer<typeof documentSchema>

interface DocumentFormProps {
  onSubmit: (payload: CreateDocumentPayload) => Promise<void>
  isSubmitting?: boolean
}

export function DocumentForm({ onSubmit, isSubmitting = false }: DocumentFormProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<DocumentFormValues>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      type: 'CERTIFICATE',
      title: '',
      holderName: '',
      number: generateDocumentNumber(),
      description: '',
      issuedAt: new Date().toISOString().slice(0, 10),
      expiresAt: '',
      fields: [{ label: '', value: '' }],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'fields' })

  async function handleValidSubmit(values: DocumentFormValues) {
    const payload: CreateDocumentPayload = {
      type: values.type,
      title: values.title,
      holderName: values.holderName,
      number: values.number,
      description: values.description || undefined,
      issuedAt: new Date(values.issuedAt).toISOString(),
      expiresAt: values.expiresAt ? new Date(values.expiresAt).toISOString() : null,
      fields: values.fields
        .filter((field) => field.label && field.value)
        .map((field, index) => ({ key: `field_${index}`, ...field })),
    }
    await onSubmit(payload)
  }

  return (
    <form onSubmit={handleSubmit(handleValidSubmit)} className="space-y-8" noValidate>
      <section className="space-y-5">
        <h2 className="font-display text-base font-semibold text-navy-900">Informação principal</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="doc-type">Tipo de documento</Label>
            <Select id="doc-type" error={Boolean(errors.type)} {...register('type')}>
              {DOCUMENT_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="doc-title">Título</Label>
            <Input
              id="doc-title"
              placeholder="Ex.: Certificado de Conclusão"
              error={Boolean(errors.title)}
              {...register('title')}
            />
            {errors.title && <p className="mt-1.5 text-xs text-danger-600">{errors.title.message}</p>}
          </div>
          <div>
            <Label htmlFor="doc-holder">Nome do titular</Label>
            <Input
              id="doc-holder"
              placeholder="Nome completo do titular"
              error={Boolean(errors.holderName)}
              {...register('holderName')}
            />
            {errors.holderName && (
              <p className="mt-1.5 text-xs text-danger-600">{errors.holderName.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="doc-number">Número do documento</Label>
            <Input
              id="doc-number"
              error={Boolean(errors.number)}
              {...register('number')}
            />
            {errors.number && <p className="mt-1.5 text-xs text-danger-600">{errors.number.message}</p>}
          </div>
          <div>
            <Label htmlFor="doc-issued">Data de emissão</Label>
            <Input
              id="doc-issued"
              type="date"
              error={Boolean(errors.issuedAt)}
              {...register('issuedAt')}
            />
            {errors.issuedAt && (
              <p className="mt-1.5 text-xs text-danger-600">{errors.issuedAt.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="doc-expires" optional>
              Data de validade
            </Label>
            <Input id="doc-expires" type="date" {...register('expiresAt')} />
          </div>
        </div>
        <div>
          <Label htmlFor="doc-description" optional>
            Descrição
          </Label>
          <Textarea
            id="doc-description"
            placeholder="Descrição breve do documento"
            {...register('description')}
          />
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-semibold text-navy-900">Campos adicionais</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ label: '', value: '' })}
            leftIcon={<Plus className="size-4" />}
          >
            Adicionar campo
          </Button>
        </div>

        {fields.length === 0 && (
          <p className="text-sm text-navy-500">Sem campos adicionais. Pode adicioná-los se necessário.</p>
        )}

        <div className="space-y-3">
          {fields.map((field, index) => (
            <div key={field.id} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
              <div>
                <Input
                  placeholder="Rótulo (ex.: Carga horária)"
                  aria-label={`Rótulo do campo ${index + 1}`}
                  error={Boolean(errors.fields?.[index]?.label)}
                  {...register(`fields.${index}.label`)}
                />
              </div>
              <div>
                <Input
                  placeholder="Valor (ex.: 40 horas)"
                  aria-label={`Valor do campo ${index + 1}`}
                  error={Boolean(errors.fields?.[index]?.value)}
                  {...register(`fields.${index}.value`)}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => remove(index)}
                aria-label="Remover campo"
                className="text-danger-600 hover:bg-danger-50"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      </section>

      <div className="flex justify-end">
        <Button type="submit" size="lg" isLoading={isSubmitting}>
          Emitir documento
        </Button>
      </div>
    </form>
  )
}
