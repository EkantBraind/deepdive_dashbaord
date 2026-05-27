import { useState, useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { LayoutGrid, Table } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
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
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const { dateRange } = useDateFilter()
  const { searchQuery } = useSearch()
  const { leads, loading, updating, error: leadsError, updateLeadCampaign } = useLeads({ dateRange })
  const { statuses } = useStatuses()

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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pipeline</h1>
          <p className="text-muted-foreground">
            {loading ? 'Loading...' : `${filteredLeads.length} leads found`}
          </p>
        </div>

        <TooltipProvider>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={viewMode === 'kanban' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('kanban')}
                  className="gap-2"
                >
                  <LayoutGrid className="size-4" />
                  Kanban
                </Button>
              </TooltipTrigger>
              <TooltipContent>View as Kanban</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={viewMode === 'table' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className="gap-2"
                >
                  <Table className="size-4" />
                  List View
                </Button>
              </TooltipTrigger>
              <TooltipContent>View as list</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>

      {leadsError && (
        <div className="rounded-md bg-destructive/10 p-4 text-destructive">
          {leadsError.message}
        </div>
      )}

      {/* Two pipeline tabs */}
      <Tabs defaultValue="main">
        <TabsList>
          <TabsTrigger value="main">
            Leads
            <span className="ml-2 rounded-full bg-muted px-1.5 py-0.5 text-xs font-medium">
              {mainLeads.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="precall">
            Meetings
            <span className="ml-2 rounded-full bg-muted px-1.5 py-0.5 text-xs font-medium">
              {preCallLeads.length}
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="main" className="mt-4">
          {viewMode === 'kanban' ? (
            <LeadsKanban
              leads={mainLeads}
              statuses={CAMPAIGNS}
              loading={loading}
              onLeadClick={handleLeadClick}
            />
          ) : (
            <LeadsTable
              leads={mainLeads}
              statuses={statuses}
              loading={loading}
              onLeadClick={handleLeadClick}
            />
          )}
        </TabsContent>

        <TabsContent value="precall" className="mt-4">
          {viewMode === 'kanban' ? (
            <LeadsKanban
              leads={preCallLeads}
              statuses={PRECALL_CAMPAIGNS}
              loading={loading}
              onLeadClick={handleLeadClick}
            />
          ) : (
            <LeadsTable
              leads={preCallLeads}
              statuses={statuses}
              loading={loading}
              onLeadClick={handleLeadClick}
            />
          )}
        </TabsContent>
      </Tabs>

      <LeadDetailSheet
        lead={selectedLead}
        statuses={statuses}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onStatusChange={updateLeadCampaign}
        updating={updating}
      />
    </div>
  )
}
