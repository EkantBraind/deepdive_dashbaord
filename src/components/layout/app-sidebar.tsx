import { Link, useLocation } from 'react-router-dom'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { env } from '@/config/env'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faThLarge,
  faFilter,
  faComments,

  faCog,
} from '@fortawesome/free-solid-svg-icons'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const menuItems = [
  { title: 'Dashboard', icon: faThLarge, href: '/' },
  { title: 'Leads', icon: faFilter, href: '/leads' },
  { title: 'Conversations', icon: faComments, href: '/conversations' },

]

function SidebarCollapseButton() {
  const { state, toggleSidebar } = useSidebar()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleSidebar}
      className="size-7 shrink-0 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
    >
      {state === 'expanded' ? (
        <ChevronLeft className="size-4" />
      ) : (
        <ChevronRight className="size-4" />
      )}
    </Button>
  )
}

export function AppSidebar() {
  const location = useLocation()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-3">
        <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
          <div className="flex-1 overflow-hidden group-data-[collapsible=icon]:hidden">
            <h1 className="text-lg font-bold whitespace-nowrap truncate" style={{ color: '#1a1a1a' }}>
              {env.app.name}
            </h1>
            <p className="text-xs whitespace-nowrap truncate" style={{ color: '#7a8fa0' }}>
              Powered by Ivy
            </p>
          </div>
          <div className="group-data-[collapsible=icon]:hidden">
            <SidebarCollapseButton />
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    isActive={location.pathname === item.href}
                  >
                    <Link to={item.href}>
                      <FontAwesomeIcon icon={item.icon} className="size-5" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip="Settings"
              isActive={location.pathname === '/settings'}
            >
              <Link to="/settings">
                <FontAwesomeIcon icon={faCog} className="size-5" />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
