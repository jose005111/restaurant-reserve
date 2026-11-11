import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import type { MenuItem, MenuItemImage } from '@/types/api'
import {
  useDeleteMenuImage,
  useReorderMenuImages,
  useUpdateMenuImage,
  useUploadMenuImage,
} from '@/hooks/use-menu'
import {
  ArrowLeft,
  ArrowRight,
  Save,
  Star,
  Trash2,
  Upload,
  ImagePlus,
} from 'lucide-react'
import { CatalogAction } from './catalog-action'
import { CatalogDelete } from './catalog-dialog'
import { Input } from '@/components/ui/input'
import { Field } from '@/components/forms/field'
const imageSchema = z.object({
  altText: z.string().trim().max(255, 'Máximo de 255 caracteres'),
})

function ImageEditor({
  item,
  image,
}: {
  item: MenuItem
  image: MenuItemImage
}) {
  const update = useUpdateMenuImage(),
    remove = useDeleteMenuImage(),
    reorder = useReorderMenuImages()
  const form = useForm<{ altText: string }>({
    resolver: zodResolver(imageSchema),
    defaultValues: { altText: image.altText ?? '' },
  })
  const index = item.images.findIndex((current) => current.id === image.id)
  const busy = update.isPending || remove.isPending || reorder.isPending
  return (
    <div className="space-y-3 rounded-lg border p-3">
      <img
        src={image.url}
        alt={image.altText ?? item.name}
        className="aspect-video w-full rounded-md object-cover"
        loading="lazy"
      />
      <p className="text-sm text-muted-foreground">
        {image.isPrimary ? 'Imagem principal' : 'Imagem adicional'}
      </p>
      <form
        className="space-y-2"
        onSubmit={form.handleSubmit(async (input) => {
          try {
            await update.mutateAsync({
              id: item.id,
              imageId: image.id,
              input: { altText: input.altText || null },
            })
          } catch {
            /* Reported by hook. */
          }
        })}
      >
        <Field
          label="Texto alternativo"
          htmlFor={`alt-${image.id}`}
          error={form.formState.errors.altText?.message}
        >
          <Input id={`alt-${image.id}`} {...form.register('altText')} />
        </Field>
        <CatalogAction
          icon={Save}
          label="Guardar descrição da imagem"
          type="submit"
          size="sm"
          variant="outline"
          disabled={busy}
        />
      </form>
      <div className="flex flex-wrap gap-2">
        {!image.isPrimary && (
          <CatalogAction
            icon={Star}
            label="Definir principal"
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() =>
              update.mutate({
                id: item.id,
                imageId: image.id,
                input: { isPrimary: true },
              })
            }
          />
        )}
        <CatalogAction
          icon={ArrowLeft}
          label="Mover imagem para trás"
          type="button"
          variant="outline"
          size="sm"
          disabled={busy || index === 0}
          onClick={() => {
            const ids = item.images.map((current) => current.id)
            ;[ids[index - 1], ids[index]] = [ids[index], ids[index - 1]]
            reorder.mutate({ id: item.id, imageIds: ids })
          }}
        />
        <CatalogAction
          icon={ArrowRight}
          label="Mover imagem para a frente"
          type="button"
          variant="outline"
          size="sm"
          disabled={busy || index === item.images.length - 1}
          onClick={() => {
            const ids = item.images.map((current) => current.id)
            ;[ids[index + 1], ids[index]] = [ids[index], ids[index + 1]]
            reorder.mutate({ id: item.id, imageIds: ids })
          }}
        />
        <CatalogDelete
          title="Remover imagem?"
          description="A imagem será removida do produto."
          trigger={
            <CatalogAction
              icon={Trash2}
              label="Remover imagem"
              variant="destructive"
              size="sm"
              disabled={busy}
            />
          }
          onConfirm={async () => {
            await remove.mutateAsync({ id: item.id, imageId: image.id })
          }}
        />
      </div>
    </div>
  )
}
export function MenuImages({ item }: { item: MenuItem }) {
  const fileInput = useRef<HTMLInputElement>(null)
  const [uploadVersion, setUploadVersion] = useState(0)
  const [file, setFile] = useState<File | null>(null)
  const upload = useUploadMenuImage()
  const form = useForm<{ altText: string }>({
    resolver: zodResolver(imageSchema),
    defaultValues: { altText: '' },
  })
  return (
    <section className="space-y-4">
      <p className="text-sm text-muted-foreground">
        As imagens guardam-se em operações separadas. A API define o limite de
        imagens e o tamanho máximo.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {item.images.map((image) => (
          <ImageEditor key={image.id} item={item} image={image} />
        ))}
      </div>
      <form
        className="space-y-3 rounded-lg border p-4"
        onSubmit={form.handleSubmit(async (input) => {
          if (!file) {
            toast.error('Selecciona uma imagem')
            return
          }
          if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            toast.error('Usa JPEG, PNG ou WebP')
            return
          }
          try {
            await upload.mutateAsync({
              id: item.id,
              file,
              altText: input.altText,
            })
            setFile(null)
            setUploadVersion((current) => current + 1)
            form.reset()
          } catch {
            /* Reported by hook. */
          }
        })}
      >
        <div className="space-y-2">
          <input
            ref={fileInput}
            key={uploadVersion}
            aria-label="Seleccionar imagem do produto"
            id="new-menu-image"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
          <CatalogAction
            icon={ImagePlus}
            label="Seleccionar imagem"
            variant="outline"
            disabled={upload.isPending}
            onClick={() => fileInput.current?.click()}
          />
          <p className="text-xs text-muted-foreground" role="status">
            {file?.name ?? 'JPEG, PNG ou WebP. Nenhum ficheiro seleccionado.'}
          </p>
        </div>
        <Field
          label="Texto alternativo da nova imagem"
          htmlFor="new-alt"
          error={form.formState.errors.altText?.message}
        >
          <Input id="new-alt" {...form.register('altText')} />
        </Field>
        <CatalogAction
          icon={Upload}
          label="Guardar imagem"
          type="submit"
          disabled={upload.isPending || !file}
        />
      </form>
    </section>
  )
}
