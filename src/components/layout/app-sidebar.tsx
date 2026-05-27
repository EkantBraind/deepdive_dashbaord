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
import {
  LayoutDashboard,
  Users,
  Contact,
  MessageSquare,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

const menuItems = [
  { title: 'Dashboard', icon: LayoutDashboard, href: '/' },
  { title: 'Pipeline', icon: Users, href: '/leads' },
  { title: 'Conversations', icon: MessageSquare, href: '/conversations' },
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

function SidebarLogo() {
  return (
    <img
      src="https://cm4-production-assets.s3.amazonaws.com/1757399731604-chatgpt-image-sep-9-2025-09_40_33-am.png"
      alt="InsureAI Logo"
      className="size-10 shrink-0 rounded-lg object-contain"
    />
  )
}

export function AppSidebar() {
  const location = useLocation()
  const { toggleSidebar } = useSidebar()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-3">
        <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
          <button onClick={toggleSidebar} className="cursor-pointer shrink-0">
            <SidebarLogo />
          </button>
          <div className="flex-1 overflow-hidden group-data-[collapsible=icon]:hidden">
            <h1 className="text-lg font-semibold text-sidebar-foreground whitespace-nowrap truncate">
              {env.app.name}
            </h1>
            <p className="text-xs text-sidebar-foreground/60 whitespace-nowrap truncate">
              Broker Intelligence
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
                      <item.icon className="size-5" />
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
                <Settings className="size-5" />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
