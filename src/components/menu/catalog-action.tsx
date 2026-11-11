import { forwardRef } from 'react'
import type { ComponentProps } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

type Props = ComponentProps<typeof Button> & {
  icon: LucideIcon
  label: string
  iconOnly?: boolean
}
// The forwarded DOM ref and event props keep Radix DialogTrigger/Close composition intact.
export const CatalogAction = forwardRef<HTMLButtonElement, Props>(
  function CatalogAction(
    {
      icon: Icon,
      label,
      iconOnly = false,
      children,
      type = 'button',
      ...props
    },
    ref,
  ) {
    const button = (
      <Button ref={ref} type={type} aria-label={label} {...props}>
        <Icon aria-hidden="true" className="size-4" />
        {iconOnly ? null : (children ?? label)}
      </Button>
    )
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {props.disabled ? (
              <span
                className="inline-flex"
                tabIndex={0}
                aria-label={`${label} (indisponível)`}
              >
                {button}
              </span>
            ) : (
              button
            )}
          </TooltipTrigger>
          <TooltipContent>{label}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  },
)
