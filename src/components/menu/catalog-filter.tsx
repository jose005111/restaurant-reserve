import type { ReactElement } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
export function CatalogFilter({
  icon: Icon,
  label,
  tooltip,
  children,
}: {
  icon: LucideIcon
  label: string
  tooltip: string
  children: ReactElement
}) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5 text-sm">
      <span className="flex items-center gap-1.5 font-medium">
        <Icon aria-hidden="true" className="size-4 text-muted-foreground" />
        {label}
      </span>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{children}</TooltipTrigger>
          <TooltipContent>{tooltip}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </label>
  )
}
