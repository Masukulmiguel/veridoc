import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Pencil, Plus, Trash2, Users as UsersIcon } from 'lucide-react'
import { listUsers, createUser, updateUser, deleteUser } from '@/services/user.service'
import { getErrorMessage } from '@/services/api'
import { formatDate } from '@/utils/format'
import { useAuth } from '@/hooks/useAuth'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import type { User, UserRole, UserStatus } from '@/types/user'

const userSchema = z.object({
  name: z.string().min(3, 'Indique o nome.'),
  email: z.email('Introduza um e-mail válido.'),
  password: z.string().min(8, 'A palavra-passe deve ter pelo menos 8 caracteres.'),
  role: z.enum(['ADMIN', 'ISSUER', 'VIEWER']),
})

type UserFormValues = z.infer<typeof userSchema>

export default function Users() {
  const { user: currentUser } = useAuth()
  const queryClient = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const { data: users, isLoading, isError, error } = useQuery({
    queryKey: ['users'],
    queryFn: listUsers,
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: { name: '', email: '', password: '', role: 'VIEWER' },
  })

  const createMutation = useMutation({ mutationFn: createUser })
  const updateMutation = useMutation({
    mutationFn: ({ id, role, status }: { id: string; role: UserRole; status: UserStatus }) =>
      updateUser(id, { role, status }),
  })
  const deleteMutation = useMutation({ mutationFn: deleteUser })

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['users'] })
    queryClient.invalidateQueries({ queryKey: ['audit'] })
  }

  async function onSubmit(values: UserFormValues) {
    setFormError(null)
    try {
      await createMutation.mutateAsync(values)
      invalidate()
      reset()
      setCreateOpen(false)
    } catch (mutationError) {
      setFormError(getErrorMessage(mutationError))
    }
  }

  function handleRoleChange(user: User, role: UserRole) {
    if (user.id === currentUser?.id && role !== 'ADMIN') return
    updateMutation.mutate(
      { id: user.id, role, status: user.status },
      { onSuccess: invalidate },
    )
  }

  function handleStatusToggle(user: User) {
    const status: UserStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'
    updateMutation.mutate({ id: user.id, role: user.role, status }, { onSuccess: invalidate })
  }

  function handleDelete(user: User) {
    if (!window.confirm(`Remover o utilizador ${user.name}? Esta acção não pode ser revertida.`)) return
    deleteMutation.mutate(user.id, { onSuccess: invalidate })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Utilizadores"
        description="Gestão das contas da instituição."
        actions={
          <Button leftIcon={<Plus className="size-4.5" />} onClick={() => setCreateOpen(true)}>
            Criar utilizador
          </Button>
        }
      />

      {isError && <Alert tone="danger">{getErrorMessage(error)}</Alert>}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-16 rounded-2xl" />
          ))}
        </div>
      ) : !users || users.length === 0 ? (
        <Card>
          <EmptyState
            icon={<UsersIcon className="size-7" />}
            title="Sem utilizadores"
            description="Crie o primeiro utilizador da instituição."
          />
        </Card>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-navy-100 bg-navy-50 text-xs uppercase tracking-wide text-navy-500">
                <th className="px-5 py-3.5 font-semibold">Utilizador</th>
                <th className="px-5 py-3.5 font-semibold">Função</th>
                <th className="px-5 py-3.5 font-semibold">Estado</th>
                <th className="px-5 py-3.5 font-semibold">Criado em</th>
                <th className="px-5 py-3.5 text-right font-semibold">Acções</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-navy-50 last:border-0 hover:bg-navy-50/60">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-600 font-display text-sm font-semibold text-white">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-navy-900">{user.name}</p>
                        <p className="text-xs text-navy-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <Select
                      className="h-9 w-44"
                      value={user.role}
                      disabled={user.id === currentUser?.id}
                      onChange={(event) => handleRoleChange(user, event.target.value as UserRole)}
                      aria-label={`Função de ${user.name}`}
                    >
                      <option value="ADMIN">Administrador</option>
                      <option value="ISSUER">Emissor</option>
                      <option value="VIEWER">Consultor</option>
                    </Select>
                  </td>
                  <td className="px-5 py-4">
                    <Badge tone={user.status === 'ACTIVE' ? 'success' : 'danger'}>
                      {user.status === 'ACTIVE' ? 'Ativo' : 'Suspenso'}
                    </Badge>
                  </td>
                  <td className="px-5 py-4 text-navy-500">{formatDate(user.createdAt)}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1.5">
                      {user.id !== currentUser?.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleStatusToggle(user)}
                          title={user.status === 'ACTIVE' ? 'Suspender' : 'Reativar'}
                        >
                          <Pencil className="size-4" />
                        </Button>
                      )}
                      {user.id !== currentUser?.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-danger-600 hover:bg-danger-50"
                          onClick={() => handleDelete(user)}
                          title="Remover"
                          aria-label={`Remover ${user.name}`}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Criar utilizador"
        description="O novo utilizador receberá acesso ao painel da instituição."
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {formError && <Alert tone="danger">{formError}</Alert>}
          <div>
            <Label htmlFor="user-name">Nome</Label>
            <Input id="user-name" error={Boolean(errors.name)} {...register('name')} />
            {errors.name && <p className="mt-1.5 text-xs text-danger-600">{errors.name.message}</p>}
          </div>
          <div>
            <Label htmlFor="user-email">E-mail</Label>
            <Input id="user-email" type="email" error={Boolean(errors.email)} {...register('email')} />
            {errors.email && <p className="mt-1.5 text-xs text-danger-600">{errors.email.message}</p>}
          </div>
          <div>
            <Label htmlFor="user-password">Palavra-passe inicial</Label>
            <Input
              id="user-password"
              type="password"
              error={Boolean(errors.password)}
              {...register('password')}
            />
            {errors.password && (
              <p className="mt-1.5 text-xs text-danger-600">{errors.password.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="user-role">Função</Label>
            <Select id="user-role" {...register('role')}>
              <option value="ADMIN">Administrador</option>
              <option value="ISSUER">Emissor</option>
              <option value="VIEWER">Consultor</option>
            </Select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSubmitting || createMutation.isPending}>
              Criar utilizador
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
