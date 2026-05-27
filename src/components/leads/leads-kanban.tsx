import { formatDistanceToNow } from 'date-fns'
import { Phone, Calendar, Users } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import type { Lead, Campaign } from '@/types/database'

interface LeadsKanbanProps {
  leads: Lead[]
  statuses: Campaign[]
  loading: boolean
  onLeadClick?: (lead: Lead) => void
}

export function LeadsKanban({ leads, statuses, loading, onLeadClick }: LeadsKanbanProps) {
  const getLeadsByCampaign = (campaignName: string) => {
    return leads.filter((lead) => lead.campaign === campaignName)
  }

  if (loading) {
    return (
      <ScrollArea className="w-full">
        <div className="flex gap-4 pb-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="w-[320px] shrink-0 flex flex-col gap-2">
              <Skeleton className="h-10 w-full rounded-lg" />
              <div className="space-y-3 p-3 rounded-lg border border-muted">
                {Array.from({ length: 3 }).map((_, j) => (
                  <Skeleton key={j} className="h-32 w-full rounded-lg" />
                ))}
              </div>
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    )
  }

  if (statuses.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-muted mb-4">
            <Users className="size-7 text-muted-foreground" />
          </div>
          <h3 className="font-semibold mb-1">No campaigns configured</h3>
          <p className="text-sm text-muted-foreground">
            No campaigns found in the pipeline configuration.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <ScrollArea className="w-full">
      <div className="flex gap-4 pb-4">
        {statuses.map((campaign) => {
          const campaignLeads = getLeadsByCampaign(campaign.name)
          const color = campaign.colour

          return (
            <div
              key={campaign.name}
              className="w-[320px] shrink-0 flex flex-col gap-2"
            >
              <div
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg border"
                style={{ backgroundColor: `${color}45`, borderColor: `${color}60` }}
              >
                <span className="font-semibold text-sm" style={{ color }}>
                  {campaign.label}
                </span>
                <span
                  className="flex size-5 items-center justify-center rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: color }}
                >
                  {campaignLeads.length}
                </span>
              </div>

              <div
                className="flex-1 pl-3 pr-1 py-3 rounded-lg border"
                style={{ backgroundColor: `${color}10`, borderColor: `${color}50` }}
              >
                <ScrollArea className="h-[calc(100vh-310px)] pr-2">
                  <div className="space-y-3">
                    {campaignLeads.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                        <p className="text-sm">No leads</p>
                      </div>
                    ) : (
                      campaignLeads.map((lead) => (
                        <LeadCard
                          key={lead.id}
                          lead={lead}
                          onClick={() => onLeadClick?.(lead)}
                        />
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          )
        })}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  )
}

interface LeadCardProps {
  lead: Lead
  onClick?: () => void
}

function LeadCard({ lead, onClick }: LeadCardProps) {
  const name = [lead.first_name, lead.last_name].filter(Boolean).join(' ') || 'Unknown'

  return (
    <Card
      className="cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02] rounded-lg border shadow-sm"
      onClick={onClick}
    >
      <CardContent className="px-5 py-3">
        <div className="mb-2">
          <h4 className="font-semibold text-sm truncate">{name}</h4>
          {lead.email && (
            <p className="text-xs text-muted-foreground truncate">{lead.email}</p>
          )}
        </div>

        <div className="space-y-1.5 mt-3">
          {lead.phone ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Phone className="size-3 fill-current" />
              <span>{lead.phone}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Phone className="size-3 fill-current" />
              <span>Not provided</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="size-3 fill-current" />
            <span>
              {lead.created_at
                ? formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })
                : 'Unknown'}
            </span>
          </div>

        </div>
      </CardContent>
    </Card>
  )
}
