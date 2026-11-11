import { Link, useLocation } from '@tanstack/react-router'
import { FolderOpen, Package } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
export function CatalogNavigation({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean
  onNavigate?: () => void
}) {
  const pathname = useLocation({ select: (location) => location.pathname })
  return (
    <nav
      aria-label="Submenus de Menu"
      className={collapsed ? 'space-y-1' : 'ml-5 space-y-1 border-l pl-2'}
    >
      {(
        [
          { label: 'Categorias', to: '/app/menu/categories', icon: FolderOpen },
          { label: 'Produtos', to: '/app/menu/products', icon: Package },
        ] as const
      ).map(({ label, to, icon: Icon }) => (
        <TooltipProvider key={to}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                to={to}
                aria-label={`Menu: ${label}`}
                aria-current={pathname === to ? 'page' : undefined}
                onClick={onNavigate}
                className={`flex items-center gap-3 rounded-lg p-2 text-sm focus-visible:outline focus-visible:outline-ring ${collapsed ? 'justify-center' : ''} ${pathname === to ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
              >
                <Icon aria-hidden="true" className="size-4 shrink-0" />
                {!collapsed && label}
              </Link>
            </TooltipTrigger>
            <TooltipContent>{`Abrir ${label.toLowerCase()} do menu`}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
    </nav>
  )
}
