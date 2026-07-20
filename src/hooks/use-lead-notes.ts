import { useState, useCallback, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { LeadNote } from '@/types/database'

export function useLeadNotes(leadId: string | null, enabled: boolean) {
  const [notes, setNotes] = useState<LeadNote[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchNotes = useCallback(async (id: string) => {
    try {
      setLoading(true)
      setError(null)
      const { data, error: fetchError } = await supabase
        .from('lead_notes')
        .select('*')
        .eq('lead_id', id)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      setNotes(data ?? [])
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch notes'))
      setNotes([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (enabled && leadId) {
      fetchNotes(leadId)
    } else {
      setNotes([])
      setError(null)
    }
  }, [enabled, leadId, fetchNotes])

  // Adds a note and prepends it to the list (newest first)
  const addNote = useCallback(
    async (content: string, authorEmail: string | null) => {
      if (!leadId) return null
      const trimmed = content.trim()
      if (!trimmed) return null

      const { data, error: insertError } = await supabase
        .from('lead_notes')
        .insert({ lead_id: leadId, content: trimmed, author_email: authorEmail })
        .select()
        .single()

      if (insertError) throw insertError
      if (data) setNotes((prev) => [data, ...prev])
      return data
    },
    [leadId],
  )

  return { notes, loading, error, addNote, refetch: fetchNotes }
}
