import { useEffect, useState, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import type { Lead } from '@/types/database'
import type { DateRange } from 'react-day-picker'

interface UseDashboardStatsOptions {
  dateRange?: DateRange
}

export interface DashboardStats {
  totalLeads: number
  totalConversations: number
  bookedLeads: number
  optedOutLeads: number
  leadsByCampaign: Record<string, number>
  leadsBySource: Record<string, number>
  recentLeads: Lead[]
  needToCallLeads: Lead[]
  meetingsToday: Lead[]
}

export function useDashboardStats({ dateRange }: UseDashboardStatsOptions = {}) {
  const [leads, setLeads] = useState<Lead[]>([])
  const [conversationCount, setConversationCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const fromDate = dateRange?.from?.toISOString()
      const toDate = dateRange?.to
        ? (() => {
            const endOfDay = new Date(dateRange.to)
            endOfDay.setHours(23, 59, 59, 999)
            return endOfDay.toISOString()
          })()
        : undefined

      let leadsQuery = supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })

      if (fromDate) leadsQuery = leadsQuery.gte('created_at', fromDate)
      if (toDate) leadsQuery = leadsQuery.lte('created_at', toDate)

      let humanSessionsQuery = supabase
        .from('conversations')
        .select('session_id')
        .filter('message->>type', 'eq', 'human')

      if (fromDate) humanSessionsQuery = humanSessionsQuery.gte('created_at', fromDate)
      if (toDate) humanSessionsQuery = humanSessionsQuery.lte('created_at', toDate)

      const [leadsResult, humanSessionsResult] = await Promise.all([
        leadsQuery,
        humanSessionsQuery,
      ])

      if (leadsResult.error) throw leadsResult.error
      if (humanSessionsResult.error) throw humanSessionsResult.error

      setLeads(leadsResult.data || [])
      setConversationCount(
        new Set(humanSessionsResult.data?.map((row) => row.session_id)).size
      )
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch dashboard data'))
    } finally {
      setLoading(false)
    }
  }, [dateRange?.from?.toISOString(), dateRange?.to?.toISOString()])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    const channel = supabase
      .channel('dashboard-leads-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leads' },
        () => { fetchData() }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchData])

  const stats = useMemo<DashboardStats>(() => {
    const leadsByCampaign: Record<string, number> = {}
    leads.forEach((lead) => {
      const c = lead.campaign || 'Uncategorised'
      leadsByCampaign[c] = (leadsByCampaign[c] || 0) + 1
    })

    const leadsBySource: Record<string, number> = {}
    leads.forEach((lead) => {
      const s = lead.source || 'Unknown'
      leadsBySource[s] = (leadsBySource[s] || 0) + 1
    })

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    return {
      totalLeads: leads.length,
      totalConversations: conversationCount,
      bookedLeads: leads.filter((l) => l.booked || l.campaign?.startsWith('pre_call')).length,
      optedOutLeads: leads.filter((l) => l.opted_out).length,
      leadsByCampaign,
      leadsBySource,
      recentLeads: leads.slice(0, 5),
      needToCallLeads: leads.filter((l) => l.campaign === 'need_to_call').slice(0, 5),
      meetingsToday: leads.filter((l) => {
        if (!l.call_scheduled_at) return false
        const d = new Date(l.call_scheduled_at)
        return d >= todayStart && d <= todayEnd
      }),
    }
  }, [leads, conversationCount])

  return {
    stats,
    loading,
    error,
    refetch: fetchData,
  }
}
