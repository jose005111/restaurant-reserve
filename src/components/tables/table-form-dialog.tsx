import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Pencil, Plus } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Field } from '@/components/forms/field'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useCreateTable, useUpdateTable } from '@/hooks/use-tables'
import { getApiErrorMessage } from '@/lib/api'
import { tableSchema, type TableFormValues } from '@/schemas/table'
import type { DiningTable } from '@/types/api'

interface TableFormDialogProps {
  trigger?: ReactNode
  table?: DiningTable
}

export function TableFormDialog({ trigger, table }: TableFormDialogProps) {
  const isEdit = Boolean(table)
  const [open, setOpen] = useState(false)
  const createMutation = useCreateTable()
  const updateMutation = useUpdateTable()
  const isPending = createMutation.isPending || updateMutation.isPending

  const form = useForm<TableFormValues>({
    resolver: zodResolver(tableSchema),
    defaultValues: { label: table?.label ?? '' },
  })

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)

    if (!nextOpen) {
      form.reset({ label: table?.label ?? '' })
    }
  }

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (table) {
        await updateMutation.mutateAsync({
          id: table.id,
          input: { label: values.label },
        })
        toast.success('Mesa atualizada')
      } else {
        await createMutation.mutateAsync(values)
        toast.success('Mesa criada', {
          description: 'O QR code já está disponível.',
        })
      }

      form.reset({ label: table?.label ?? '' })
      setOpen(false)
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          isEdit ? 'Não foi possível atualizar a mesa' : 'Não foi possível criar a mesa',
        ),
      )
    }
  })

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="size-4" />
            Nova mesa
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar mesa' : 'Nova mesa'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Atualiza o nome ou número da mesa.'
              : 'Cada mesa recebe um QR code próprio para os clientes.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <Field
            label="Nome ou número"
            htmlFor="table-label"
            error={form.formState.errors.label?.message}
          >
            <Input
              id="table-label"
              placeholder="Ex.: Mesa 1"
              autoFocus
              aria-invalid={Boolean(form.formState.errors.label)}
              {...form.register('label')}
            />
          </Field>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : isEdit ? (
                <Pencil className="size-4" />
              ) : (
                <Plus className="size-4" />
              )}
              {isEdit ? 'Guardar' : 'Criar mesa'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
