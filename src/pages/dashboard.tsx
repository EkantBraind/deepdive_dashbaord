import { formatDistanceToNow } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  UserPlus,
  MessageSquare,
  TrendingUp,
  Activity,
  Phone,
  CheckCircle2,
  CalendarClock,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useDashboardStats } from '@/hooks/use-dashboard-stats'
import { useDateFilter } from '@/contexts/date-filter-context'
import { CAMPAIGN_CONFIG } from '@/types/database'
import type { Lead } from '@/types/database'

export function DashboardPage() {
  const navigate = useNavigate()
  const { dateRange } = useDateFilter()
  const { stats, loading } = useDashboardStats({ dateRange })

  const handleLeadClick = (lead: Lead) => {
    navigate('/leads', { state: { openLeadId: lead.id } })
  }

  if (loading) {
    return <DashboardSkeleton />
  }

  const conversionRate =
    stats.totalLeads > 0
      ? Math.round((stats.bookedLeads / stats.totalLeads) * 100)
      : 0

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Leads"
          value={stats.totalLeads}
          icon={<UserPlus className="size-5" />}
          iconBgColor="bg-blue-500/10"
          iconColor="text-blue-500"
        />
        <StatCard
          title="Total Conversations"
          value={stats.totalConversations}
          icon={<MessageSquare className="size-5" />}
          iconBgColor="bg-cyan-500/10"
          iconColor="text-cyan-500"
        />
        <StatCard
          title="Pre-Call / Booked"
          value={stats.bookedLeads}
          icon={<CheckCircle2 className="size-5" />}
          iconBgColor="bg-green-500/10"
          iconColor="text-green-500"
        />
        <StatCard
          title="Booking Rate"
          value={`${conversionRate}%`}
          icon={<TrendingUp className="size-5" />}
          iconBgColor="bg-purple-500/10"
          iconColor="text-purple-500"
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Campaign Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <CampaignDistribution
              leadsByCampaign={stats.leadsByCampaign}
              totalLeads={stats.totalLeads}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <CalendarClock className="size-5 text-orange-500" />
              Meetings Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MeetingsTodayList leads={stats.meetingsToday} onLeadClick={handleLeadClick} />
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">Recent Leads</CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-green-500" />
              </span>
              Real-time
            </div>
          </CardHeader>
          <CardContent>
            <RecentLeads leads={stats.recentLeads} onLeadClick={handleLeadClick} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Phone className="size-5 text-blue-500" />
              Need to Call
            </CardTitle>
          </CardHeader>
          <CardContent>
            <NeedToCallLeads leads={stats.needToCallLeads} onLeadClick={handleLeadClick} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

interface StatCardProps {
  title: string
  value: number | string
  icon: React.ReactNode
  iconBgColor: string
  iconColor: string
}

function StatCard({ title, value, icon, iconBgColor, iconColor }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className={`flex size-12 items-center justify-center rounded-xl ${iconBgColor}`}>
            <span className={iconColor}>{icon}</span>
          </div>
        </div>
        <div className="mt-4">
          <p className="text-3xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground">{title}</p>
        </div>
      </CardContent>
    </Card>
  )
}

interface CampaignDistributionProps {
  leadsByCampaign: Record<string, number>
  totalLeads: number
}

function CampaignDistribution({ leadsByCampaign, totalLeads }: CampaignDistributionProps) {
  const sorted = Object.entries(leadsByCampaign).sort((a, b) => b[1] - a[1])

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
        <Activity className="size-8 mb-2" />
        <p>No leads in the selected period</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {sorted.map(([campaign, count]) => {
        const config = CAMPAIGN_CONFIG[campaign]
        const color = config?.colour || '#6b7280'
        const label = config?.label || campaign
        const percentage = totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0

        return (
          <div key={campaign} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{label}</span>
              <span className="text-muted-foreground">{count} ({percentage}%)</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${percentage}%`, backgroundColor: color }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

interface MeetingsTodayListProps {
  leads: Lead[]
  onLeadClick?: (lead: Lead) => void
}

function MeetingsTodayList({ leads, onLeadClick }: MeetingsTodayListProps) {
  if (leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
        <CalendarClock className="size-8 mb-2" />
        <p>No meetings scheduled for today</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {leads.map((lead) => {
        const name = [lead.first_name, lead.last_name].filter(Boolean).join(' ') || lead.email || 'Unknown'
        const time = lead.call_scheduled_at
          ? new Date(lead.call_scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : null

        return (
          <div
            key={lead.id}
            className="flex items-center gap-3 cursor-pointer rounded-lg p-2 -m-2 transition-all duration-200 hover:bg-muted hover:scale-[1.02]"
            onClick={() => onLeadClick?.(lead)}
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-orange-500/10 text-orange-500 font-medium text-sm">
              {lead.first_name?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{name}</p>
              <p className="text-xs text-muted-foreground truncate">{lead.phone || lead.email || 'No contact info'}</p>
            </div>
            {time && (
              <span className="text-xs font-medium text-orange-500 whitespace-nowrap">{time}</span>
            )}
          </div>
        )
      })}
    </div>
  )
}

interface RecentLeadsProps {
  leads: Lead[]
  onLeadClick?: (lead: Lead) => void
}

function RecentLeads({ leads, onLeadClick }: RecentLeadsProps) {
  if (leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
        <Users className="size-8 mb-2" />
        <p>No recent leads</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {leads.map((lead) => {
        const name = [lead.first_name, lead.last_name].filter(Boolean).join(' ') || lead.email || 'Unknown'
        const campaignConfig = lead.campaign ? CAMPAIGN_CONFIG[lead.campaign] : null

        return (
          <div
            key={lead.id}
            className="flex items-center gap-3 cursor-pointer rounded-lg p-2 -m-2 transition-all duration-200 hover:bg-muted hover:scale-[1.02]"
            onClick={() => onLeadClick?.(lead)}
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-medium text-sm">
              {lead.first_name?.[0]?.toUpperCase() || lead.email?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{name}</p>
              <p className="text-xs text-muted-foreground">
                {lead.created_at
                  ? formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })
                  : 'Unknown'}
              </p>
            </div>
            {campaignConfig && (
              <Badge
                style={{
                  backgroundColor: campaignConfig.colour,
                  color: '#fff',
                }}
              >
                {campaignConfig.label}
              </Badge>
            )}
          </div>
        )
      })}
    </div>
  )
}

interface NeedToCallLeadsProps {
  leads: Lead[]
  onLeadClick?: (lead: Lead) => void
}

function NeedToCallLeads({ leads, onLeadClick }: NeedToCallLeadsProps) {
  if (leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
        <Phone className="size-8 mb-2" />
        <p>No leads need a call right now</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {leads.map((lead) => {
        const name = [lead.first_name, lead.last_name].filter(Boolean).join(' ') || lead.email || 'Unknown'

        return (
          <div
            key={lead.id}
            className="flex items-center gap-3 cursor-pointer rounded-lg p-2 -m-2 transition-all duration-200 hover:bg-muted hover:scale-[1.02]"
            onClick={() => onLeadClick?.(lead)}
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-500 font-medium text-sm">
              {lead.first_name?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{name}</p>
              <p className="text-xs text-muted-foreground truncate">{lead.phone || lead.email || 'No contact info'}</p>
            </div>
            {lead.booked && (
              <CheckCircle2 className="size-4 text-green-500 shrink-0" />
            )}
          </div>
        )
      })}
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="size-12 rounded-xl" />
              <div className="mt-4 space-y-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="space-y-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-10" />
                  </div>
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 5 }).map((_, j) => (
                <div key={j} className="flex items-center gap-3">
                  <Skeleton className="size-10 rounded-full" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
