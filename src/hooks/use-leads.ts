import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Lead } from '@/types/database'
import type { DateRange } from 'react-day-picker'

interface UseLeadsOptions {
  dateRange?: DateRange
}

export function useLeads({ dateRange }: UseLeadsOptions = {}) {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)

  const [error, setError] = useState<Error | null>(null)

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })

      if (dateRange?.from) {
        query = query.gte('created_at', dateRange.from.toISOString())
      }
      if (dateRange?.to) {
        const endOfDay = new Date(dateRange.to)
        endOfDay.setHours(23, 59, 59, 999)
        query = query.lte('created_at', endOfDay.toISOString())
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError
      setLeads(data || [])
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch leads'))
    } finally {
      setLoading(false)
    }
  }, [dateRange?.from?.toISOString(), dateRange?.to?.toISOString()])

  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  useEffect(() => {
    const channel = supabase
      .channel('leads-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads',
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const { data } = await supabase
              .from('leads')
              .select('*')
              .eq('id', payload.new.id)
              .single()

            if (data) {
              const newLead = data as Lead
              if (dateRange?.from && newLead.created_at) {
                const createdAt = new Date(newLead.created_at)
                if (createdAt < dateRange.from) return
                if (dateRange.to && createdAt > dateRange.to) return
              }
              setLeads((prev) => [newLead, ...prev])
            }
          } else if (payload.eventType === 'UPDATE') {
            const { data } = await supabase
              .from('leads')
              .select('*')
              .eq('id', payload.new.id)
              .single()

            if (data) {
              setLeads((prev) =>
                prev.map((lead) =>
                  lead.id === payload.new.id ? (data as Lead) : lead
                )
              )
            }
          } else if (payload.eventType === 'DELETE') {
            setLeads((prev) =>
              prev.filter((lead) => lead.id !== payload.old.id)
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [dateRange?.from?.toISOString(), dateRange?.to?.toISOString()])

  return {
    leads,
    loading,
    error,
    refetch: fetchLeads,
  }
}
