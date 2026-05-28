import { formatDistanceToNow } from 'date-fns'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import type { Lead, Campaign } from '@/types/database'

const AVATAR_COLORS = ['#0A8754', '#3B82F6', '#F59E0B', '#8B5CF6', '#0EAD6A', '#F44336']

function getAvatarColor(name: string) {
  const hash = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

interface LeadsKanbanProps {
  leads: Lead[]
  statuses: Campaign[]
  loading: boolean
  onLeadClick?: (lead: Lead) => void
}

export function LeadsKanban({ leads, statuses, loading, onLeadClick }: LeadsKanbanProps) {
  if (loading) {
    return (
      <ScrollArea className="w-full">
        <div style={{ display: 'flex', gap: 14, paddingBottom: 16 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ minWidth: 200, flex: 1 }}>
              <Skeleton style={{ height: 38, borderRadius: 10, marginBottom: 10 }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {Array.from({ length: 3 }).map((_, j) => (
                  <Skeleton key={j} style={{ height: 80, borderRadius: 10 }} />
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
      <p style={{ fontSize: 14, color: '#7a8fa0' }}>No stages configured</p>
    )
  }

  return (
    <ScrollArea className="w-full">
      <div style={{ display: 'flex', gap: 14, paddingBottom: 16 }}>
        {statuses.map((status) => {
          const statusLeads = leads.filter((l) => l.campaign === status.name)
          return (
            <KanbanColumn
              key={status.name}
              status={status}
              leads={statusLeads}
              onLeadClick={onLeadClick}
            />
          )
        })}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  )
}

interface KanbanColumnProps {
  status: Campaign
  leads: Lead[]
  onLeadClick?: (lead: Lead) => void
}

function KanbanColumn({ status, leads, onLeadClick }: KanbanColumnProps) {
  return (
    <div
      style={{
        minWidth: 200,
        flex: 1,
        background: 'white',
        borderRadius: 14,
        padding: 14,
        border: '1px solid #e0e6ed',
      }}
    >
      {/* Column header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>
          {status.label}
        </span>
        <span
          style={{
            width: 22,
            height: 22,
            borderRadius: '50%',
            background: '#f5f7fa',
            fontSize: 11,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#7a8fa0',
          }}
        >
          {leads.length}
        </span>
      </div>

      {/* Cards */}
      <ScrollArea style={{ height: 'calc(100vh - 310px)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingRight: 4 }}>
          {leads.length === 0 ? (
            <p style={{ fontSize: 12, color: '#b0bec5', textAlign: 'center', padding: '20px 0' }}>
              No leads
            </p>
          ) : (
            leads.map((lead) => (
              <KanbanCard key={lead.id} lead={lead} onClick={() => onLeadClick?.(lead)} />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

interface KanbanCardProps {
  lead: Lead
  onClick?: () => void
}

function KanbanCard({ lead, onClick }: KanbanCardProps) {
  const name = [lead.first_name, lead.last_name].filter(Boolean).join(' ') || lead.email || 'Unknown'
  const avatarColor = getAvatarColor(name)
  const initials = getInitials(name)

  return (
    <div
      onClick={onClick}
      style={{
        background: '#f9fafb',
        borderRadius: 10,
        padding: 12,
        cursor: 'pointer',
        transition: 'all 0.2s',
        border: '1px solid transparent',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#0A8754'
        e.currentTarget.style.background = '#f0fdf4'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'transparent'
        e.currentTarget.style.background = '#f9fafb'
      }}
    >
      {/* Avatar + name row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: avatarColor,
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {initials}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 13, color: '#1a1a1a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {name}
          </div>
          <div style={{ fontSize: 11, color: '#7a8fa0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {lead.email || lead.phone || '—'}
          </div>
        </div>
      </div>

      {/* Date */}
      {lead.created_at && (
        <div style={{ fontSize: 11, color: '#b0bec5', marginTop: 4 }}>
          {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
        </div>
      )}
    </div>
  )
}
