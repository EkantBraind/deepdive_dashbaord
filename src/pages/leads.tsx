import { useState, useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { LayoutGrid, Table } from 'lucide-react'
import { LeadsTable } from '@/components/leads/leads-table'
import { LeadsKanban } from '@/components/leads/leads-kanban'
import { LeadDetailSheet } from '@/components/leads/lead-detail-sheet'
import { useLeads } from '@/hooks/use-leads'
import { useStatuses } from '@/hooks/use-statuses'
import { useDateFilter } from '@/contexts/date-filter-context'
import { useSearch } from '@/contexts/search-context'
import { CAMPAIGNS, PRECALL_CAMPAIGNS } from '@/types/database'
import type { Lead } from '@/types/database'

type ViewMode = 'table' | 'kanban'

export function LeadsPage() {
  const location = useLocation()
  const [viewMode, setViewMode] = useState<ViewMode>('kanban')
  const [pipelineTab, setPipelineTab] = useState<'leads' | 'meetings'>('leads')
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const { dateRange } = useDateFilter()
  const { searchQuery } = useSearch()
  const { leads, loading: leadsLoading, error: leadsError } = useLeads({ dateRange })
  const { statuses, loading: statusesLoading } = useStatuses()

  const loading = leadsLoading || statusesLoading

  const filteredLeads = useMemo(() => {
    if (!searchQuery.trim()) return leads
    const q = searchQuery.toLowerCase()
    return leads.filter((l) =>
      [l.first_name, l.last_name, l.email, l.phone, l.campaign, l.source, l.intent]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(q))
    )
  }, [leads, searchQuery])

  const mainLeads = useMemo(
    () => filteredLeads.filter((l) => !l.campaign?.startsWith('pre_call')),
    [filteredLeads]
  )

  const preCallLeads = useMemo(
    () => filteredLeads.filter((l) => l.campaign?.startsWith('pre_call')),
    [filteredLeads]
  )

  // Handle incoming lead ID from navigation (e.g., from dashboard)
  useEffect(() => {
    const state = location.state as { openLeadId?: string } | null
    if (state?.openLeadId && !loading && leads.length > 0) {
      setSelectedLeadId(state.openLeadId)
      setDetailOpen(true)
      window.history.replaceState({}, document.title)
    }
  }, [location.state, loading, leads])

  const selectedLead = selectedLeadId
    ? filteredLeads.find((l) => l.id === selectedLeadId) ?? leads.find((l) => l.id === selectedLeadId) ?? null
    : null

  const handleLeadClick = (lead: Lead) => {
    setSelectedLeadId(lead.id)
    setDetailOpen(true)
  }

  return (
    <div className="space-y-5">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ fontSize: 13, color: '#7a8fa0' }}>
          {loading ? 'Loading…' : `${filteredLeads.length} leads found`}
        </p>

        {/* View toggle */}
        <div style={{ display: 'flex', gap: 6 }}>
          {([
            { mode: 'kanban' as const, icon: <LayoutGrid style={{ width: 14, height: 14 }} />, label: 'Kanban' },
            { mode: 'table' as const, icon: <Table style={{ width: 14, height: 14 }} />, label: 'List' },
          ]).map(({ mode, icon, label }) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                border: '1px solid',
                fontFamily: 'inherit',
                transition: 'all 0.15s',
                background: viewMode === mode ? '#0A8754' : 'white',
                color: viewMode === mode ? 'white' : '#5a7a8f',
                borderColor: viewMode === mode ? '#0A8754' : '#e0e6ed',
              }}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>
      </div>

      {leadsError && (
        <div className="rounded-md bg-destructive/10 p-4 text-destructive">
          {leadsError.message}
        </div>
      )}

      {/* Pipeline tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '2px solid #e0e6ed', marginBottom: 16 }}>
        {([
          { key: 'leads' as const, label: 'Leads', count: mainLeads.length },
          { key: 'meetings' as const, label: 'Meetings', count: preCallLeads.length },
        ]).map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setPipelineTab(key)}
            style={{
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              background: 'none',
              fontFamily: 'inherit',
              color: pipelineTab === key ? '#0A8754' : '#7a8fa0',
              borderBottom: pipelineTab === key ? '2px solid #0A8754' : '2px solid transparent',
              marginBottom: -2,
              transition: 'all 0.15s',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {label}
            <span
              style={{
                padding: '1px 7px',
                borderRadius: 10,
                fontSize: 11,
                fontWeight: 600,
                background: pipelineTab === key ? '#f0fdf4' : '#f5f7fa',
                color: pipelineTab === key ? '#0A8754' : '#7a8fa0',
              }}
            >
              {count}
            </span>
          </button>
        ))}
      </div>

      {pipelineTab === 'leads' ? (
        viewMode === 'kanban' ? (
          <LeadsKanban leads={mainLeads} statuses={CAMPAIGNS} loading={loading} onLeadClick={handleLeadClick} />
        ) : (
          <LeadsTable leads={mainLeads} statuses={statuses} loading={loading} onLeadClick={handleLeadClick} />
        )
      ) : (
        viewMode === 'kanban' ? (
          <LeadsKanban leads={preCallLeads} statuses={PRECALL_CAMPAIGNS} loading={loading} onLeadClick={handleLeadClick} />
        ) : (
          <LeadsTable leads={preCallLeads} statuses={statuses} loading={loading} onLeadClick={handleLeadClick} />
        )
      )}

      <LeadDetailSheet
        lead={selectedLead}
        statuses={statuses}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  )
}
