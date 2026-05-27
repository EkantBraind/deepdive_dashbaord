import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { ConversationMessage } from '@/types/database'
import type { DateRange } from 'react-day-picker'

export interface SessionWithPreview {
  session_id: string
  name: string | null
  preview: string | null
  messageCount: number
  hasHumanMessage: boolean
  created_at: string | null
}

interface UseConversationsOptions {
  dateRange?: DateRange
}

function parseMessage(raw: unknown): ConversationMessage | null {
  try {
    if (typeof raw === 'string') return JSON.parse(raw)
    return raw as ConversationMessage
  } catch {
    return null
  }
}

export function useConversations({ dateRange }: UseConversationsOptions = {}) {
  const [sessions, setSessions] = useState<SessionWithPreview[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('conversations')
        .select('id, session_id, message, created_at')
        .order('id', { ascending: true })

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

      // Group by session_id
      const sessionMap = new Map<string, { messages: typeof data; firstDate: string | null }>()
      for (const conv of data || []) {
        if (!conv.session_id) continue
        if (!sessionMap.has(conv.session_id)) {
          sessionMap.set(conv.session_id, { messages: [], firstDate: conv.created_at })
        }
        sessionMap.get(conv.session_id)!.messages.push(conv)
      }

      const built: SessionWithPreview[] = []
      for (const [session_id, { messages, firstDate }] of sessionMap) {
        // Count only meaningful messages (exclude tool calls / tool responses)
        const messageCount = messages.filter((conv) => {
          const msg = parseMessage(conv.message)
          if (!msg) return false
          if (msg.type === 'tool') return false
          if (msg.type === 'ai' && Array.isArray(msg.tool_calls) && msg.tool_calls.length > 0) return false
          return true
        }).length

        // First human message as preview
        let preview: string | null = null
        for (const conv of messages) {
          const msg = parseMessage(conv.message)
          if (msg?.type === 'human' && msg.content) {
            const cleaned = msg.content.replace(/^User's current message:\s*/i, '').trim()
            preview = cleaned.length > 100 ? cleaned.slice(0, 100) + '…' : cleaned
            break
          }
        }

        const hasHumanMessage = messages.some((conv) => {
          const msg = parseMessage(conv.message)
          return msg?.type === 'human'
        })

        built.push({ session_id, name: null, preview, messageCount, hasHumanMessage, created_at: firstDate })
      }

      // Batch-lookup lead names by phone number.
      // session_id may have a leading "+" — strip it for the DB lookup.
      const normalizedPhones = built.map((s) => s.session_id.replace(/^\+/, ''))
      const { data: leadsData } = await supabase
        .from('leads')
        .select('phone, first_name, last_name')
        .in('phone', normalizedPhones)

      if (leadsData) {
        const phoneToName = new Map<string, string>()
        for (const lead of leadsData) {
          if (!lead.phone) continue
          const n = [lead.first_name, lead.last_name].filter(Boolean).join(' ')
          if (n) phoneToName.set(lead.phone, n)
        }
        for (const session of built) {
          const normalized = session.session_id.replace(/^\+/, '')
          session.name = phoneToName.get(normalized) ?? null
        }
      }

      // Sort newest first
      built.sort((a, b) => {
        if (!a.created_at) return 1
        if (!b.created_at) return -1
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })

      setSessions(built)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch conversations'))
    } finally {
      setLoading(false)
    }
  }, [dateRange?.from?.toISOString(), dateRange?.to?.toISOString()])

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  return { sessions, loading, error, refetch: fetchSessions }
}
