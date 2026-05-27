import { useLocation } from 'react-router-dom'
import { format } from 'date-fns'
import {
  Menu,
  CalendarIcon,
  Bell,
  LogOut,
  Search,
  X,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useSidebar } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'
import { useDateFilter } from '@/contexts/date-filter-context'
import { useAuthContext } from '@/contexts/auth-context'
import { useSearch } from '@/contexts/search-context'

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/contacts': 'Contacts',
  '/leads': 'Leads',
  '/conversations': 'Conversations',
  '/analytics': 'Analytics',
  '/settings': 'Settings',
}

export function TopBar() {
  const location = useLocation()
  const { toggleSidebar } = useSidebar()
  const { dateRange, setDateRange } = useDateFilter()
  const { user: authUser, signOut } = useAuthContext()
  const { searchQuery, setSearchQuery } = useSearch()

  const pageTitle = pageTitles[location.pathname] || 'Dashboard'
  const showDateFilter = location.pathname !== '/settings'
  const showSearch = ['/contacts', '/conversations', '/leads'].includes(location.pathname)

  const displayName = authUser?.user_metadata?.display_name || authUser?.user_metadata?.full_name || authUser?.email || 'User'
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
  const avatar = authUser?.user_metadata?.avatar_url || ''

  return (
    <header className="flex h-16 items-center border-b bg-muted/30 px-6 md:px-8">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={toggleSidebar}
          >
            <Menu className="size-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
          <div>
            <h1 className="text-lg md:text-xl font-semibold leading-tight">{pageTitle}</h1>
            {showDateFilter && (
              <span className="hidden md:block text-[10px] text-muted-foreground leading-none">
                Last updated: now
              </span>
            )}
          </div>
        </div>

      {/* Search Bar */}
      {showSearch ? (
        <div className="relative w-64 mr-auto ml-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder={`Search ${pageTitle.toLowerCase()}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-8 h-9"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      ) : (
        <div className="flex-1" />
      )}

      <div className="flex items-center gap-2 md:gap-3">
        {/* Date Filter */}
        {showDateFilter && <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className={cn(
                'md:hidden',
                !dateRange?.from && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="size-4" />
              <span className="sr-only">Select date range</span>
            </Button>
          </PopoverTrigger>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'hidden md:inline-flex justify-start text-left font-normal',
                !dateRange?.from && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 size-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, 'LLL dd, y')} - {format(dateRange.to, 'LLL dd, y')}
                  </>
                ) : (
                  format(dateRange.from, 'LLL dd, y')
                )
              ) : (
                <span>Select date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={setDateRange}
              numberOfMonths={2}
              className="md:block"
            />
          </PopoverContent>
        </Popover>}

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative text-muted-foreground">
          <Bell className="size-5" />
          <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-red-500" />
          <span className="sr-only">Notifications</span>
        </Button>

        {/* User Profile */}
        <div className="flex items-center gap-3 rounded-lg p-1.5">
          <div className="hidden md:block text-right">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{authUser?.email}</p>
          </div>
          <Avatar className="size-9 bg-orange-100 text-orange-600">
            <AvatarImage src={avatar} alt={displayName} />
            <AvatarFallback className="bg-orange-100 text-orange-600 font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Log out */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => signOut()}
                className="text-red-600 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-950"
              >
                <LogOut className="size-5" />
                <span className="sr-only">Log out</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Log out</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </header>
  )
}
