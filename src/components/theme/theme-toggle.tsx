import { Check, Monitor, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Theme, useThemeStore } from '@/stores/theme-store'

const options = [
  { value: Theme.LIGHT, label: 'Claro', icon: Sun },
  { value: Theme.DARK, label: 'Escuro', icon: Moon },
  { value: Theme.SYSTEM, label: 'Sistema', icon: Monitor },
] as const

export function ThemeToggle() {
  const theme = useThemeStore((state) => state.theme)
  const setTheme = useThemeStore((state) => state.setTheme)

  const current = options.find((option) => option.value === theme) ?? options[2]
  const Icon = current.icon

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Alternar tema">
          <Icon className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {options.map((option) => {
          const OptionIcon = option.icon
          return (
            <DropdownMenuItem
              key={option.value}
              onClick={() => setTheme(option.value)}
            >
              <OptionIcon className="size-4" />
              {option.label}
              {theme === option.value ? (
                <Check className="ml-auto size-4" />
              ) : null}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
