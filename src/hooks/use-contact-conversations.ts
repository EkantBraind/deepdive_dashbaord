import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Contact, Conversation, ConversationMessage } from '@/types/database'
import type { DateRange } from 'react-day-picker'

export interface ContactWithConversations extends Contact {
  sessionIds: string[]
  totalMessages: number
  lastMessageAt: string | null
  channels: ('email' | 'whatsapp')[]
  convertedToLead: boolean
}

export interface ContactSession {
  sessionId: string
  conversations: Conversation[]
  channel: 'email' | 'whatsapp'
  createdAt: string | null
  messageCount: number
}

import type { OriginFilter } from './use-conversations'

interface UseContactConversationsOptions {
  dateRange?: DateRange
  originFilter?: OriginFilter
}

function parseMessage(raw: unknown): ConversationMessage | null {
  try {
    if (typeof raw === 'string') return JSON.parse(raw)
    return raw as ConversationMessage
  } catch {
    return null
  }
}

function isVisibleMessage(msg: ConversationMessage): boolean {
  if (msg.type === 'tool') return false
  if (msg.type === 'ai' && Array.isArray(msg.tool_calls) && msg.tool_calls.length > 0) return false
  return true
}

/**
 * session_id is the contact's email or phone number.
 * This determines the channel and links sessions to contacts directly.
 */
function getSessionIdsForContact(contact: Contact): { sessionId: string; channel: 'email' | 'whatsapp' }[] {
  const result: { sessionId: string; channel: 'email' | 'whatsapp' }[] = []
  if (contact.email) result.push({ sessionId: contact.email, channel: 'email' })
  if (contact.phone) result.push({ sessionId: contact.phone, channel: 'whatsapp' })
  return result
}

export function useContactConversations({ dateRange, originFilter }: UseContactConversationsOptions = {}) {
  const [contacts, setContacts] = useState<ContactWithConversations[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchContacts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch all contacts
      let contactsQuery = supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false })

      if (dateRange?.from) {
        contactsQuery = contactsQuery.gte('created_at', dateRange.from.toISOString())
      }
      if (dateRange?.to) {
        const endOfDay = new Date(dateRange.to)
        endOfDay.setHours(23, 59, 59, 999)
        contactsQuery = contactsQuery.lte('created_at', endOfDay.toISOString())
      }

      if (originFilter === 'outreach') {
        contactsQuery = contactsQuery.not('origin', 'is', null).neq('origin', 'chatbot')
      } else if (originFilter === 'chatbot') {
        contactsQuery = contactsQuery.or('origin.is.null,origin.eq.chatbot')
      }

      const { data: contactsData, error: contactsError } = await contactsQuery
      if (contactsError) throw contactsError
      if (!contactsData || contactsData.length === 0) {
        setContacts([])
        return
      }

      // Collect all possible session_ids (emails + phones) from contacts
      const allSessionIds: string[] = []
      for (const contact of contactsData) {
        if (contact.email) allSessionIds.push(contact.email)
        if (contact.phone) allSessionIds.push(contact.phone)
      }

      // Fetch leads to determine converted status
      const contactIds = contactsData.map((c) => c.id)
      const { data: leads, error: leadsError } = await supabase
        .from('leads')
        .select('contact_id')
        .in('contact_id', contactIds)

      if (leadsError) throw leadsError

      const convertedContactIds = new Set((leads || []).map((l) => l.contact_id))

      if (allSessionIds.length === 0) {
        setContacts(contactsData.map((c) => ({
          ...c,
          sessionIds: [],
          totalMessages: 0,
          lastMessageAt: null,
          channels: [],
          convertedToLead: convertedContactIds.has(c.id),
        })))
        return
      }

      // Fetch sessions matching these emails/phones
      let sessionsQuery = supabase
        .from('sessions')
        .select('session_id, created_at')
        .in('session_id', allSessionIds)

      if (originFilter === 'outreach') {
        sessionsQuery = sessionsQuery.not('origin', 'is', null).neq('origin', 'chatbot')
      } else if (originFilter === 'chatbot') {
        sessionsQuery = sessionsQuery.or('origin.is.null,origin.eq.chatbot')
      }

      const { data: sessionsData, error: sessionsError } = await sessionsQuery

      if (sessionsError) throw sessionsError

      // Build a set of session_ids that actually exist
      const existingSessionIds = new Set((sessionsData || []).map((s) => s.session_id))

      // Fetch conversations for existing sessions
      const existingIds = Array.from(existingSessionIds)
      let conversationsBySessionId = new Map<string, Conversation[]>()

      if (existingIds.length > 0) {
        const { data: conversations, error: convsError } = await supabase
          .from('conversations')
          .select('*')
          .in('session_id', existingIds)
          .order('id', { ascending: true })

        if (convsError) throw convsError

        for (const conv of conversations || []) {
          if (!conv.session_id) continue
          const existing = conversationsBySessionId.get(conv.session_id) || []
          existing.push(conv)
          conversationsBySessionId.set(conv.session_id, existing)
        }
      }

      // Build contacts with conversation data
      const contactsWithConvs: ContactWithConversations[] = contactsData.map((contact) => {
        const contactSessionMappings = getSessionIdsForContact(contact)
        const activeSessionIds: string[] = []
        const channels: ('email' | 'whatsapp')[] = []
        let totalMessages = 0
        let lastMessageAt: string | null = null

        for (const { sessionId, channel } of contactSessionMappings) {
          if (!existingSessionIds.has(sessionId)) continue
          activeSessionIds.push(sessionId)
          channels.push(channel)

          const convs = conversationsBySessionId.get(sessionId) || []
          const visibleCount = convs.filter((c) => {
            const msg = parseMessage(c.message)
            return msg && isVisibleMessage(msg)
          }).length
          totalMessages += visibleCount

          // Track latest message
          if (convs.length > 0) {
            const lastConvAt = convs[convs.length - 1].created_at
            if (lastConvAt && (!lastMessageAt || lastConvAt > lastMessageAt)) {
              lastMessageAt = lastConvAt
            }
          }
        }

        return {
          ...contact,
          sessionIds: activeSessionIds,
          totalMessages,
          lastMessageAt,
          channels,
          convertedToLead: convertedContactIds.has(contact.id),
        }
      })

      setContacts(contactsWithConvs)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch contacts'))
    } finally {
      setLoading(false)
    }
  }, [dateRange?.from?.toISOString(), dateRange?.to?.toISOString(), originFilter])

  useEffect(() => {
    fetchContacts()
  }, [fetchContacts])

  useEffect(() => {
    const channel = supabase
      .channel('contact-conversations-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contacts' }, () => fetchContacts())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => fetchContacts())
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchContacts])

  return { contacts, loading, error, refetch: fetchContacts }
}

export function useContactSessions(contact: Contact | null) {
  const [sessions, setSessions] = useState<ContactSession[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchSessions = useCallback(async () => {
    if (!contact) {
      setSessions([])
      return
    }

    try {
      setLoading(true)
      setError(null)

      const contactSessionMappings = getSessionIdsForContact(contact)
      if (contactSessionMappings.length === 0) {
        setSessions([])
        return
      }

      const sessionIds = contactSessionMappings.map((m) => m.sessionId)
      const channelBySessionId = new Map(contactSessionMappings.map((m) => [m.sessionId, m.channel]))

      // Fetch sessions
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('sessions')
        .select('*')
        .in('session_id', sessionIds)
        .order('created_at', { ascending: false })

      if (sessionsError) throw sessionsError

      const existingSessionIds = (sessionsData || []).map((s) => s.session_id)
      if (existingSessionIds.length === 0) {
        setSessions([])
        return
      }

      // Fetch conversations
      const { data: conversations, error: convsError } = await supabase
        .from('conversations')
        .select('*')
        .in('session_id', existingSessionIds)
        .order('id', { ascending: true })

      if (convsError) throw convsError

      // Group conversations by session
      const convsBySession = new Map<string, Conversation[]>()
      for (const conv of conversations || []) {
        if (!conv.session_id) continue
        const existing = convsBySession.get(conv.session_id) || []
        existing.push(conv)
        convsBySession.set(conv.session_id, existing)
      }

      // Build ContactSession objects
      const contactSessions: ContactSession[] = (sessionsData || []).map((session) => {
        const convs = convsBySession.get(session.session_id) || []
        const visibleCount = convs.filter((c) => {
          const msg = parseMessage(c.message)
          return msg && isVisibleMessage(msg)
        }).length

        return {
          sessionId: session.session_id,
          conversations: convs,
          channel: channelBySessionId.get(session.session_id) || 'email',
          createdAt: session.created_at,
          messageCount: visibleCount,
        }
      })

      setSessions(contactSessions)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch contact sessions'))
    } finally {
      setLoading(false)
    }
  }, [contact?.id])

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  return { sessions, loading, error, refetch: fetchSessions }
}
