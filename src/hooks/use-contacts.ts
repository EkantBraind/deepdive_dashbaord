import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Contact } from '@/types/database'
import type { DateRange } from 'react-day-picker'
import type { OriginFilter } from './use-conversations'

export interface ContactWithLead extends Contact {
  convertedToLead: boolean
}

interface UseContactsOptions {
  dateRange?: DateRange
  originFilter?: OriginFilter
}

export function useContacts({ dateRange, originFilter }: UseContactsOptions = {}) {
  const [contacts, setContacts] = useState<ContactWithLead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchContacts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('contacts')
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

      if (originFilter === 'outreach') {
        query = query.eq('origin', 'client')
      } else if (originFilter === 'chatbot') {
        query = query.or('origin.is.null,origin.eq.chatbot')
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      const contactsData = data || []

      // For chatbot, all contacts are considered converted
      if (originFilter === 'chatbot') {
        setContacts(contactsData.map((c) => ({ ...c, convertedToLead: true })))
        return
      }

      // For outreach, check if contacts have leads
      if (contactsData.length === 0) {
        setContacts([])
        return
      }

      const contactIds = contactsData.map((c) => c.id)
      const { data: leads, error: leadsError } = await supabase
        .from('leads')
        .select('contact_id')
        .in('contact_id', contactIds)

      if (leadsError) throw leadsError

      const convertedContactIds = new Set((leads || []).map((l) => l.contact_id))

      setContacts(contactsData.map((c) => ({
        ...c,
        convertedToLead: convertedContactIds.has(c.id),
      })))
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
      .channel('contacts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contacts',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newContact = payload.new as Contact
            if (dateRange?.from && newContact.created_at) {
              const createdAt = new Date(newContact.created_at)
              if (createdAt < dateRange.from) return
              if (dateRange.to && createdAt > dateRange.to) return
            }
            setContacts((prev) => [{ ...newContact, convertedToLead: false }, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setContacts((prev) =>
              prev.map((contact) =>
                contact.id === payload.new.id ? { ...(payload.new as Contact), convertedToLead: contact.convertedToLead } : contact
              )
            )
          } else if (payload.eventType === 'DELETE') {
            setContacts((prev) =>
              prev.filter((contact) => contact.id !== payload.old.id)
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
    contacts,
    loading,
    error,
    refetch: fetchContacts,
  }
}
