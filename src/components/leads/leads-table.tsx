import { format } from 'date-fns'
import { Users } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Lead, Campaign } from '@/types/database'

interface LeadsTableProps {
  leads: Lead[]
  statuses: Campaign[]
  loading: boolean
  onLeadClick?: (lead: Lead) => void
}

// Read-only notes cell. The legacy `notes` column still shows here, but new
// notes are no longer added from the table — they're managed in the lead detail
// panel. Clicking the row opens that panel.
function NoteCell({ lead }: { lead: Lead }) {
  if (lead.notes) {
    return (
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, maxWidth: 220 }}>
        <span style={{ fontSize: 12, color: '#1a1a1a', lineHeight: 1.5, flex: 1, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {lead.notes}
        </span>
      </div>
    )
  }

  return <span className="text-muted-foreground">—</span>
}

export function LeadsTable({ leads, statuses, loading, onLeadClick }: LeadsTableProps) {
  const getCampaignInfo = (name: string | null) => {
    if (!name) return null
    return statuses.find((c) => c.name === name)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="space-y-0">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 border-b last:border-b-0">
                <Skeleton className="size-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (leads.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-muted mb-4">
            <Users className="size-7 text-muted-foreground" />
          </div>
          <h3 className="font-semibold mb-1">No leads found</h3>
          <p className="text-sm text-muted-foreground">
            No leads match the selected date range.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="py-0">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="font-semibold w-10"></TableHead>
              <TableHead className="font-semibold">Contact</TableHead>
              <TableHead className="font-semibold">Phone</TableHead>
              <TableHead className="font-semibold">Campaign</TableHead>
              <TableHead className="font-semibold">Source</TableHead>
              <TableHead className="font-semibold">Created</TableHead>
              <TableHead className="font-semibold">Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead, index) => {
              const campaignInfo = getCampaignInfo(lead.campaign)
              const name = [lead.first_name, lead.last_name].filter(Boolean).join(' ') || '—'
              const initial = lead.first_name?.[0]?.toUpperCase() || lead.email?.[0]?.toUpperCase() || '?'

              return (
                <TableRow
                  key={lead.id}
                  className={`${index % 2 === 0 ? 'bg-background' : 'bg-muted/30'} cursor-pointer hover:bg-muted/50`}
                  onClick={() => onLeadClick?.(lead)}
                >
                  <TableCell className="pr-0" onClick={(e) => e.stopPropagation()}>
                    <div
                      style={{
                        width: 3, height: 32, borderRadius: 2,
                        background: lead.notes ? '#0A8754' : '#e0e6ed',
                        margin: '0 auto',
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary font-medium text-sm">
                        {initial}
                      </div>
                      <div>
                        <span className="font-medium">{name}</span>
                        {lead.email && (
                          <p className="text-xs text-muted-foreground">{lead.email}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {lead.phone || '—'}
                  </TableCell>
                  <TableCell>
                    {campaignInfo ? (
                      <Badge
                        style={{
                          backgroundColor: campaignInfo.colour,
                          color: '#fff',
                        }}
                      >
                        {campaignInfo.label}
                      </Badge>
                    ) : lead.campaign ? (
                      <Badge variant="secondary">{lead.campaign}</Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {lead.source || '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {lead.created_at
                      ? format(new Date(lead.created_at), 'MMM d, yyyy')
                      : '—'}
                  </TableCell>
                  <TableCell>
                    <NoteCell lead={lead} />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
