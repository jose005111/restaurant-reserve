import { useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Loader2, Trash2, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog'
import { CatalogAction } from './catalog-action'

export function CatalogDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  wide = false,
  fallbackFocusId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  children: ReactNode
  wide?: boolean
  fallbackFocusId?: string
}) {
  const opener = useRef<HTMLElement | null>(null)
  const fallback = useRef<HTMLElement | null>(null)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onOpenAutoFocus={() => {
          fallback.current = fallbackFocusId
            ? document.getElementById(fallbackFocusId)
            : null
          opener.current =
            document.activeElement instanceof HTMLElement
              ? document.activeElement
              : null
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault()
          if (!document.querySelector('[role="dialog"][data-state="open"]')) {
            const target =
              opener.current?.isConnected && opener.current !== document.body
                ? opener.current
                : fallback.current
            target?.focus()
          }
        }}
        showCloseButton={false}
        className={`max-h-[90dvh] overflow-y-auto ${wide ? 'sm:max-w-4xl' : 'sm:max-w-xl'}`}
      >
        <DialogHeader className="pr-10">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogClose asChild>
          <CatalogAction
            icon={X}
            label="Fechar janela"
            iconOnly
            variant="ghost"
            size="icon"
            className="absolute right-3 top-3"
          />
        </DialogClose>
        {children}
      </DialogContent>
    </Dialog>
  )
}
export function CatalogDelete({
  trigger,
  title,
  description,
  onConfirm,
}: {
  trigger: ReactNode
  title: string
  description: string
  onConfirm: () => Promise<void>
}) {
  const [open, setOpen] = useState(false),
    [pending, setPending] = useState(false)
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!pending) setOpen(value)
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2">
          <DialogClose asChild>
            <CatalogAction
              icon={X}
              label="Cancelar eliminação"
              variant="outline"
              disabled={pending}
            />
          </DialogClose>
          <CatalogAction
            icon={pending ? Loader2 : Trash2}
            label="Confirmar eliminação"
            variant="destructive"
            disabled={pending}
            onClick={async () => {
              setPending(true)
              try {
                await onConfirm()
                setOpen(false)
              } catch {
                /* Error reported by mutation. */
              } finally {
                setPending(false)
              }
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
