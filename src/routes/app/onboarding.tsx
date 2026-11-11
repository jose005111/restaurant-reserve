import { useEffect, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Palette,
  Sparkles,
} from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { AssetUpload } from '@/components/branding/asset-upload'
import { ColorField } from '@/components/branding/color-field'
import { Field } from '@/components/forms/field'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { useBranding, useUpdateBranding } from '@/hooks/use-branding'
import { getApiErrorMessage } from '@/lib/api'
import { applyBranding, isOnboardingComplete } from '@/lib/branding'
import {
  BRANDING_FONTS,
  onboardingSchema,
  type OnboardingFormValues,
} from '@/schemas/onboarding'
import { useAuthStore } from '@/stores/auth-store'
import { BrandingAsset, UserRole } from '@/types/api'
import type { Branding, UpdateBrandingInput } from '@/types/api'

export const Route = createFileRoute('/app/onboarding')({
  beforeLoad: () => {
    const user = useAuthStore.getState().user

    if (!user) {
      throw redirect({ to: '/login' })
    }

    if (user.role !== UserRole.ADMIN) {
      throw redirect({ to: '/app' })
    }
  },
  component: OnboardingPage,
})

const STEPS = ['Marca', 'Cores', 'Contactos'] as const

function OnboardingPage() {
  const { data: branding, isLoading, isError } = useBranding()

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-72 w-full" />
      </div>
    )
  }

  if (isError || !branding) {
    return (
      <div className="mx-auto max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Não foi possível carregar a identidade</CardTitle>
            <CardDescription>
              Verifica a ligação à API e tenta novamente.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return <OnboardingWizard branding={branding} />
}

export function OnboardingWizard({ branding }: { branding: Branding }) {
  const navigate = useNavigate()
  const updateMutation = useUpdateBranding()
  const [step, setStep] = useState(0)
  const alreadyComplete = isOnboardingComplete(branding)

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      fontFamily:
        onboardingSchema.shape.fontFamily.safeParse(branding.fontFamily).data ??
        '',
      welcomeTitle: branding.welcomeTitle ?? '',
      welcomeMessage: branding.welcomeMessage ?? '',
      footerText: branding.footerText ?? '',
      primaryColor: branding.primaryColor,
      secondaryColor: branding.secondaryColor,
      accentColor: branding.accentColor,
      backgroundColor: branding.backgroundColor,
      surfaceColor: branding.surfaceColor,
      textColor: branding.textColor,
      themeMode: branding.themeMode,
      borderRadius: branding.borderRadius,
      instagramUrl: branding.instagramUrl ?? '',
      facebookUrl: branding.facebookUrl ?? '',
      websiteUrl: branding.websiteUrl ?? '',
      whatsapp: branding.whatsapp ?? '',
    },
  })

  const liveValues = form.watch()

  useEffect(() => {
    applyBranding({
      ...branding,
      ...liveValues,
      borderRadius: Number(liveValues.borderRadius) || 0,
    })
  }, [branding, liveValues])

  const goNext = async () => {
    if (step === 0) {
      const valid = await form.trigger(['welcomeTitle', 'welcomeMessage'])
      if (!valid) {
        return
      }
    }

    if (step === 1) {
      const valid = await form.trigger([
        'primaryColor',
        'secondaryColor',
        'accentColor',
        'backgroundColor',
        'surfaceColor',
        'textColor',
        'borderRadius',
      ])
      if (!valid) {
        return
      }
    }

    setStep((current) => Math.min(current + 1, STEPS.length - 1))
  }

  const preventEnterSubmit = (event: KeyboardEvent<HTMLFormElement>) => {
    if (event.key === 'Enter' && event.target instanceof HTMLInputElement) {
      event.preventDefault()
    }
  }

  const handleFinish = form.handleSubmit(async (values) => {
    if (!branding.logoUrl) {
      toast.error('Falta o logótipo', {
        description: 'Carrega o logótipo para concluir a identidade.',
      })
      setStep(0)
      return
    }

    const payload: UpdateBrandingInput = {
      fontFamily: values.fontFamily || null,
      welcomeTitle: values.welcomeTitle.trim(),
      welcomeMessage: values.welcomeMessage.trim() || null,
      footerText: values.footerText.trim() || null,
      primaryColor: values.primaryColor,
      secondaryColor: values.secondaryColor,
      accentColor: values.accentColor,
      backgroundColor: values.backgroundColor,
      surfaceColor: values.surfaceColor,
      textColor: values.textColor,
      themeMode: values.themeMode,
      borderRadius: values.borderRadius,
      instagramUrl: values.instagramUrl.trim() || null,
      facebookUrl: values.facebookUrl.trim() || null,
      websiteUrl: values.websiteUrl.trim() || null,
      whatsapp: values.whatsapp.trim() || null,
    }

    try {
      await updateMutation.mutateAsync(payload)
      toast.success('Identidade guardada', {
        description: 'O teu painel está pronto.',
      })
      await navigate({ to: '/app' })
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Não foi possível guardar'))
    }
  })

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-medium tracking-wide text-primary uppercase">
            Onboarding
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            A identidade do teu restaurante
          </h1>
          <p className="text-sm text-muted-foreground">
            Preenche a marca para desbloquear o painel. Podes alterar depois.
          </p>
        </div>
        {alreadyComplete ? (
          <Badge variant="secondary" className="w-fit">
            <Check className="size-3" />
            Já configurado
          </Badge>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <Card>
          <CardHeader className="gap-4">
            <div className="flex items-center gap-2">
              {STEPS.map((label, index) => (
                <div key={label} className="flex flex-1 items-center gap-2">
                  <span
                    className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                      index <= step
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {index < step ? <Check className="size-3.5" /> : index + 1}
                  </span>
                  <span
                    className={`hidden text-xs font-medium sm:block ${
                      index <= step
                        ? 'text-foreground'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {label}
                  </span>
                  {index < STEPS.length - 1 ? (
                    <span
                      className={`h-px flex-1 ${
                        index < step ? 'bg-primary' : 'bg-border'
                      }`}
                    />
                  ) : null}
                </div>
              ))}
            </div>
            <div>
              <CardTitle>{STEPS[step]}</CardTitle>
              <CardDescription>
                {step === 0
                  ? 'Logótipo e mensagem de boas-vindas no menu do cliente.'
                  : step === 1
                    ? 'Cores e cantos usados em todo o painel e menu.'
                    : 'Contactos e redes sociais apresentados no rodapé.'}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <form
              noValidate
              onSubmit={(event) => event.preventDefault()}
              onKeyDown={preventEnterSubmit}
              className="space-y-6"
            >
              {step === 0 ? (
                <div className="space-y-6">
                  <AssetUpload
                    asset={BrandingAsset.LOGO}
                    label="Logótipo"
                    description="Quadrado, PNG/WebP, até 2 MB. Obrigatório para concluir."
                    value={branding.logoUrl}
                  />

                  <p className="text-sm text-muted-foreground">
                    Selecciona uma imagem e usa «Guardar imagem» para a enviar.
                    As imagens guardam-se separadamente, sem concluir o
                    formulário. «Remover» elimina imediatamente a imagem
                    guardada.
                  </p>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <AssetUpload
                      asset={BrandingAsset.LOGO_DARK}
                      label="Logótipo para tema escuro (opcional)"
                      description="Versão alternativa para fundos escuros."
                      value={branding.logoDarkUrl}
                    />
                    <AssetUpload
                      asset={BrandingAsset.FAVICON}
                      label="Ícone do site (opcional)"
                      description="Imagem quadrada em JPEG, PNG ou WebP."
                      value={branding.faviconUrl}
                    />
                  </div>
                  <AssetUpload
                    asset={BrandingAsset.BANNER}
                    label="Banner do menu (opcional)"
                    description="Imagem larga apresentada no topo do menu."
                    value={branding.bannerUrl}
                    aspect="wide"
                  />
                  <AssetUpload
                    asset={BrandingAsset.LOGIN_IMAGE}
                    label="Imagem de entrada (opcional)"
                    description="Imagem para a página de entrada do restaurante."
                    value={branding.loginImageUrl}
                    aspect="wide"
                  />

                  <Field
                    label="Título de boas-vindas"
                    htmlFor="welcomeTitle"
                    error={form.formState.errors.welcomeTitle?.message}
                  >
                    <Input
                      id="welcomeTitle"
                      placeholder="Bem-vindo ao Sabor de Luanda"
                      aria-invalid={Boolean(form.formState.errors.welcomeTitle)}
                      {...form.register('welcomeTitle')}
                    />
                  </Field>

                  <Field
                    label="Mensagem de boas-vindas"
                    htmlFor="welcomeMessage"
                    hint="Opcional. Aparece no topo do menu."
                    error={form.formState.errors.welcomeMessage?.message}
                  >
                    <Textarea
                      id="welcomeMessage"
                      rows={3}
                      placeholder="Sabores autênticos, feitos com carinho."
                      {...form.register('welcomeMessage')}
                    />
                  </Field>
                </div>
              ) : null}

              {step === 1 ? (
                <div className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <ColorField
                      label="Cor primária"
                      value={liveValues.primaryColor}
                      onChange={(value) =>
                        form.setValue('primaryColor', value, {
                          shouldDirty: true,
                        })
                      }
                    />
                    <ColorField
                      label="Cor secundária"
                      value={liveValues.secondaryColor}
                      onChange={(value) =>
                        form.setValue('secondaryColor', value, {
                          shouldDirty: true,
                        })
                      }
                    />
                    <ColorField
                      label="Cor de destaque"
                      value={liveValues.accentColor}
                      onChange={(value) =>
                        form.setValue('accentColor', value, {
                          shouldDirty: true,
                        })
                      }
                    />
                    <ColorField
                      label="Fundo"
                      value={liveValues.backgroundColor}
                      onChange={(value) =>
                        form.setValue('backgroundColor', value, {
                          shouldDirty: true,
                        })
                      }
                    />
                    <ColorField
                      label="Superfície"
                      value={liveValues.surfaceColor}
                      onChange={(value) =>
                        form.setValue('surfaceColor', value, {
                          shouldDirty: true,
                        })
                      }
                    />
                    <ColorField
                      label="Texto"
                      value={liveValues.textColor}
                      onChange={(value) =>
                        form.setValue('textColor', value, {
                          shouldDirty: true,
                        })
                      }
                    />
                  </div>

                  <Field
                    label="Fonte (opcional)"
                    htmlFor="fontFamily"
                    hint="Usa uma fonte instalada no dispositivo; não são descarregadas fontes externas."
                    error={form.formState.errors.fontFamily?.message}
                  >
                    <select
                      id="fontFamily"
                      className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                      {...form.register('fontFamily')}
                    >
                      <option value="">Fonte predefinida</option>
                      {BRANDING_FONTS.map((font) => (
                        <option key={font} value={font}>
                          {font}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Tema</p>
                      <Controller
                        control={form.control}
                        name="themeMode"
                        render={({ field }) => (
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="LIGHT">Claro</SelectItem>
                              <SelectItem value="DARK">Escuro</SelectItem>
                              <SelectItem value="SYSTEM">Sistema</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>

                    <Field
                      label="Arredondamento (px)"
                      htmlFor="borderRadius"
                      hint="Entre 0 e 32."
                      error={form.formState.errors.borderRadius?.message}
                    >
                      <Input
                        id="borderRadius"
                        type="number"
                        min={0}
                        max={32}
                        {...form.register('borderRadius', {
                          valueAsNumber: true,
                        })}
                      />
                    </Field>
                  </div>
                </div>
              ) : null}

              {step === 2 ? (
                <div className="space-y-6">
                  <Field
                    label="Texto do rodapé"
                    htmlFor="footerText"
                    hint="Opcional."
                    error={form.formState.errors.footerText?.message}
                  >
                    <Input
                      id="footerText"
                      placeholder="© 2026 Sabor de Luanda"
                      {...form.register('footerText')}
                    />
                  </Field>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field
                      label="Instagram"
                      htmlFor="instagramUrl"
                      error={form.formState.errors.instagramUrl?.message}
                    >
                      <Input
                        id="instagramUrl"
                        placeholder="https://instagram.com/..."
                        {...form.register('instagramUrl')}
                      />
                    </Field>
                    <Field
                      label="Facebook"
                      htmlFor="facebookUrl"
                      error={form.formState.errors.facebookUrl?.message}
                    >
                      <Input
                        id="facebookUrl"
                        placeholder="https://facebook.com/..."
                        {...form.register('facebookUrl')}
                      />
                    </Field>
                    <Field
                      label="Website"
                      htmlFor="websiteUrl"
                      error={form.formState.errors.websiteUrl?.message}
                    >
                      <Input
                        id="websiteUrl"
                        placeholder="https://..."
                        {...form.register('websiteUrl')}
                      />
                    </Field>
                    <Field
                      label="WhatsApp"
                      htmlFor="whatsapp"
                      hint="Opcional."
                      error={form.formState.errors.whatsapp?.message}
                    >
                      <Input
                        id="whatsapp"
                        placeholder="+244 900 000 000"
                        {...form.register('whatsapp')}
                      />
                    </Field>
                  </div>
                </div>
              ) : null}

              <div className="flex items-center justify-between gap-3 border-t pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setStep((current) => Math.max(current - 1, 0))}
                  disabled={step === 0}
                >
                  <ArrowLeft className="size-4" />
                  Voltar
                </Button>

                {step < STEPS.length - 1 ? (
                  <Button type="button" onClick={() => void goNext()}>
                    Continuar
                    <ArrowRight className="size-4" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={() => void handleFinish()}
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Check className="size-4" />
                    )}
                    Concluir e entrar no painel
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <aside className="space-y-4">
          <Card className="overflow-hidden">
            <div className="h-20 bg-gradient-to-r from-primary to-accent" />
            <CardContent className="-mt-8 space-y-3">
              <div className="flex size-16 items-center justify-center overflow-hidden rounded-2xl border-4 border-background bg-background shadow-sm">
                {branding.logoUrl ? (
                  <img
                    src={branding.logoUrl}
                    alt="Logótipo"
                    className="size-full object-cover"
                  />
                ) : (
                  <Palette className="size-6 text-muted-foreground" />
                )}
              </div>
              <div className="space-y-1">
                <p className="text-base font-semibold">
                  {liveValues.welcomeTitle || 'O teu restaurante'}
                </p>
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {liveValues.welcomeMessage ||
                    'A mensagem de boas-vindas aparece aqui.'}
                </p>
              </div>
              <div className="flex gap-1">
                {[
                  liveValues.primaryColor,
                  liveValues.secondaryColor,
                  liveValues.accentColor,
                  liveValues.surfaceColor,
                ].map((color, index) => (
                  <span
                    key={`${color}-${index}`}
                    className="size-6 rounded-md border"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <Button className="w-full" size="sm" type="button">
                Ver menu
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Sparkles className="size-4 text-primary" />
                Pré-visualização em tempo real
              </CardTitle>
              <CardDescription>
                As cores aplicam-se imediatamente ao painel. Ajusta até ficarem
                confortáveis.
              </CardDescription>
            </CardHeader>
          </Card>
        </aside>
      </div>
    </div>
  )
}
