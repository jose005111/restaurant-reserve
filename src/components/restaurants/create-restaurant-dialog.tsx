import { useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import {
  RestaurantForm,
  type RestaurantCreatedResult,
} from '@/components/restaurants/restaurant-form'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface CreateRestaurantDialogProps {
  trigger: ReactNode
  onCreated?: (result: RestaurantCreatedResult) => void
}

export function CreateRestaurantDialog({
  trigger,
  onCreated,
}: CreateRestaurantDialogProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90dvh] w-full overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Registar restaurante</DialogTitle>
          <DialogDescription>
            Cria o restaurante e a conta do primeiro ADMIN. O onboarding da
            identidade é feito por ele no primeiro acesso.
          </DialogDescription>
        </DialogHeader>

        <RestaurantForm
          mode="admin"
          onCreated={(result) => {
            toast.success('Restaurante registado', {
              description: `O ADMIN ${result.email} já pode entrar e concluir a identidade de ${result.restaurant.name}.`,
            })
            setOpen(false)
            onCreated?.(result)
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
