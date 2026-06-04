import { useState } from 'react'
import { format } from 'date-fns'
import { Users, StickyNote, Check, X, Loader2, Pencil } from 'lucide-react'
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
import { supabase } from '@/lib/supabase'
import type { Lead, Campaign } from '@/types/database'

interface LeadsTableProps {
  leads: Lead[]
  statuses: Campaign[]
  loading: boolean
  onLeadClick?: (lead: Lead) => void
}

function NoteCell({ lead }: { lead: Lead }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(lead.notes ?? '')
  const [saving, setSaving] = useState(false)

  const save = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setSaving(true)
    await supabase.from('leads').update({ notes: draft || null }).eq('id', lead.id)
    setSaving(false)
    setEditing(false)
    lead.notes = draft || null
  }

  const cancel = (e: React.MouseEvent) => {
    e.stopPropagation()
    setDraft(lead.notes ?? '')
    setEditing(false)
  }

  if (editing) {
    return (
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 200 }}
      >
        <textarea
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
          style={{
            width: '100%',
            padding: '6px 8px',
            fontSize: 12,
            borderRadius: 6,
            border: '1px solid #0A8754',
            outline: 'none',
            resize: 'vertical',
            fontFamily: 'inherit',
            color: '#1a1a1a',
          }}
          placeholder="Add a note…"
        />
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={save}
            disabled={saving}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 500,
              background: '#0A8754', color: 'white', border: 'none',
              cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
            }}
          >
            {saving ? <Loader2 style={{ width: 11, height: 11 }} className="animate-spin" /> : <Check style={{ width: 11, height: 11 }} />}
            Save
          </button>
          <button
            onClick={cancel}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 500,
              background: 'white', color: '#7a8fa0', border: '1px solid #e0e6ed',
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            <X style={{ width: 11, height: 11 }} />
            Cancel
          </button>
        </div>
      </div>
    )
  }

  if (lead.notes) {
    return (
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ display: 'flex', alignItems: 'flex-start', gap: 6, maxWidth: 220 }}
      >
        <span style={{ fontSize: 12, color: '#1a1a1a', lineHeight: 1.5, flex: 1, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {lead.notes}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); setDraft(lead.notes ?? ''); setEditing(true) }}
          title="Edit note"
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 22, height: 22, borderRadius: 5, border: '1px solid #e0e6ed',
            background: 'white', color: '#7a8fa0', cursor: 'pointer', flexShrink: 0,
          }}
        >
          <Pencil style={{ width: 11, height: 11 }} />
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={(e) => { e.stopPropagation(); setEditing(true) }}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 500,
        background: 'white', color: '#7a8fa0', border: '1px solid #e0e6ed',
        cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
      }}
    >
      <StickyNote style={{ width: 11, height: 11 }} />
      Add Note
    </button>
  )
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
                  <TableCell onClick={(e) => e.stopPropagation()}>
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
