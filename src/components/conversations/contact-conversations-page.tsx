import { useState, useCallback, useMemo } from 'react'
import { format } from 'date-fns'
import { Users, MessageSquare, ChevronRight } from 'lucide-react'
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
import { Button } from '@/components/ui/button'
import { useContactConversations, type ContactWithConversations } from '@/hooks/use-contact-conversations'
import { ContactDetailView } from './contact-detail-view'
import { useDateFilter } from '@/contexts/date-filter-context'
import { useSearch } from '@/contexts/search-context'

import type { OriginFilter } from '@/hooks/use-conversations'

type LeadFilter = 'all' | 'converted' | 'not_converted'

interface ContactConversationsPageProps {
  originFilter?: OriginFilter
}

export function ContactConversationsPage({ originFilter }: ContactConversationsPageProps = {}) {
  const { dateRange } = useDateFilter()
  const { searchQuery } = useSearch()
  const { contacts, loading, error } = useContactConversations({ dateRange, originFilter })
  const [selectedContact, setSelectedContact] = useState<ContactWithConversations | null>(null)
  const [leadFilter, setLeadFilter] = useState<LeadFilter>('all')
  const [minMessages, setMinMessages] = useState(0)

  const maxMessages = useMemo(() => {
    if (contacts.length === 0) return 0
    return Math.max(...contacts.map((c) => c.totalMessages))
  }, [contacts])

  const filteredContacts = useMemo(() => {
    let filtered = contacts
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter((c) =>
        [c.first_name, c.last_name, c.email, c.phone]
          .filter(Boolean)
          .some((field) => field!.toLowerCase().includes(q))
      )
    }
    if (leadFilter === 'converted') filtered = filtered.filter((c) => c.convertedToLead)
    else if (leadFilter === 'not_converted') filtered = filtered.filter((c) => !c.convertedToLead)
    if (minMessages > 0) filtered = filtered.filter((c) => c.totalMessages >= minMessages)
    return filtered
  }, [contacts, searchQuery, leadFilter, minMessages])

  const handleContactClick = useCallback((contact: ContactWithConversations) => {
    setSelectedContact(contact)
  }, [])

  const handleBack = useCallback(() => {
    setSelectedContact(null)
  }, [])

  if (selectedContact) {
    return <ContactDetailView contact={selectedContact} onBack={handleBack} />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground">
          {loading ? 'Loading...' : `${filteredContacts.length} contacts found`}
        </p>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              Min messages: {minMessages}
            </span>
            <input
              type="range"
              min={0}
              max={maxMessages || 1}
              value={minMessages}
              onChange={(e) => setMinMessages(Number(e.target.value))}
              className="w-48 h-1.5 accent-primary cursor-pointer"
            />
          </div>
          <div className="flex items-center gap-1 rounded-lg border p-1">
            {([
              { value: 'all', label: 'All' },
              { value: 'converted', label: 'Converted' },
              { value: 'not_converted', label: 'Not Converted' },
            ] as const).map((option) => (
              <Button
                key={option.value}
                variant={leadFilter === option.value ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setLeadFilter(option.value)}
                className="h-7 text-xs"
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-4 text-destructive">
          {error.message}
        </div>
      )}

      {loading ? (
        <Card>
          <CardContent className="p-0">
            <div className="space-y-0">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 border-b last:border-b-0">
                  <Skeleton className="size-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : filteredContacts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-muted mb-4">
              <Users className="size-7 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-1">No contacts found</h3>
            <p className="text-sm text-muted-foreground">
              No contacts match the selected date range.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="py-0">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="font-semibold">Contact</TableHead>
                  <TableHead className="font-semibold">Sessions</TableHead>
                  <TableHead className="font-semibold">Messages</TableHead>
                  <TableHead className="font-semibold">Lead Status</TableHead>
                  <TableHead className="font-semibold">Last Activity</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContacts.map((contact, index) => (
                  <TableRow
                    key={contact.id}
                    className={`${index % 2 === 0 ? 'bg-background' : 'bg-muted/30'} cursor-pointer hover:bg-muted/50`}
                    onClick={() => handleContactClick(contact)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary font-medium text-sm">
                          {contact.first_name?.[0]?.toUpperCase() || contact.email?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {[contact.first_name, contact.last_name].filter(Boolean).join(' ') || 'Unknown'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {contact.email || contact.phone || '—'}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {contact.sessionIds.length}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <MessageSquare className="size-3.5" />
                        <span className="text-sm">{contact.totalMessages}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {contact.convertedToLead ? (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400">
                          Converted
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          Not converted
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {contact.lastMessageAt
                        ? format(new Date(contact.lastMessageAt), 'MMM d, yyyy h:mm a')
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <ChevronRight className="size-4 text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
