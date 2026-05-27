import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Conversation } from '@/types/database'

interface LeadConversationData {
  conversations: Conversation[]
}

export function useLeadConversation() {
  const [data, setData] = useState<LeadConversationData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // session_id in the conversations table is the lead's phone number,
  // stored either as-is (e.g. "441202399139") or with a "+" prefix ("+441202399139")
  const fetchConversation = useCallback(async (phone: string) => {
    try {
      setLoading(true)
      setError(null)

      const { data: convData, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .or(`session_id.eq.${phone},session_id.eq.+${phone}`)
        .order('id', { ascending: true })

      if (convError) throw convError

      setData({ conversations: convData || [] })
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch conversation'))
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setData(null)
    setError(null)
  }, [])

  return {
    data,
    loading,
    error,
    fetchConversation,
    reset,
  }
}
