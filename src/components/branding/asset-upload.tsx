import { useRef } from 'react'
import { ImagePlus, Loader2, Trash2, UploadCloud } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  useRemoveBrandingAsset,
  useUploadBrandingAsset,
} from '@/hooks/use-branding'
import { getApiErrorMessage } from '@/lib/api'
import type { BrandingAsset } from '@/types/api'

const MAX_BYTES = 2 * 1024 * 1024
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp']

interface AssetUploadProps {
  asset: BrandingAsset
  label: string
  description: string
  value: string | null
  aspect?: 'square' | 'wide'
}

export function AssetUpload({
  asset,
  label,
  description,
  value,
  aspect = 'square',
}: AssetUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const uploadMutation = useUploadBrandingAsset()
  const removeMutation = useRemoveBrandingAsset()

  const handleFile = async (file: File | undefined) => {
    if (!file) {
      return
    }

    if (!ACCEPTED.includes(file.type)) {
      toast.error('Formato inválido', {
        description: 'Usa JPEG, PNG ou WebP.',
      })
      return
    }

    if (file.size > MAX_BYTES) {
      toast.error('Ficheiro demasiado grande', {
        description: 'O tamanho máximo é 2 MB.',
      })
      return
    }

    try {
      await uploadMutation.mutateAsync({ asset, file })
      toast.success(`${label} actualizado`)
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Falha no upload'))
    }
  }

  const handleRemove = async () => {
    try {
      await removeMutation.mutateAsync(asset)
      toast.success(`${label} removido`)
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Não foi possível remover'))
    }
  }

  const isBusy = uploadMutation.isPending || removeMutation.isPending

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>

      <div
        className={`relative flex items-center justify-center overflow-hidden rounded-xl border border-dashed bg-muted/40 ${
          aspect === 'square' ? 'h-40 w-40' : 'h-28 w-full'
        }`}
      >
        {value ? (
          <img
            src={value}
            alt={label}
            className="size-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <ImagePlus className="size-6" />
            <span className="text-xs">Sem imagem</span>
          </div>
        )}

        {isBusy ? (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70">
            <Loader2 className="size-6 animate-spin" />
          </div>
        ) : null}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(',')}
        className="hidden"
        onChange={(event) => {
          void handleFile(event.target.files?.[0])
          event.target.value = ''
        }}
      />

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isBusy}
          onClick={() => inputRef.current?.click()}
        >
          <UploadCloud className="size-4" />
          {value ? 'Substituir' : 'Carregar'}
        </Button>
        {value ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isBusy}
            onClick={() => void handleRemove()}
          >
            <Trash2 className="size-4" />
            Remover
          </Button>
        ) : null}
      </div>
    </div>
  )
}
