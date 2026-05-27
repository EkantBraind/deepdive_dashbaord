import { useCallback, useState, useMemo } from 'react'
import { ContactsTable } from '@/components/contacts/contacts-table'
import { ConvertToLeadDialog } from '@/components/contacts/convert-to-lead-dialog'
import { useContacts, type ContactWithLead } from '@/hooks/use-contacts'
import { useDateFilter } from '@/contexts/date-filter-context'
import { useSearch } from '@/contexts/search-context'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { env } from '@/config/env'
import type { OriginFilter } from '@/hooks/use-conversations'

export function ContactsPage() {
  if (env.dashboardMode === 'combined') {
    return <CombinedContactsPage />
  }

  if (env.dashboardMode === 'outreach') {
    return <FilteredContactsPage originFilter="outreach" />
  }

  return <FilteredContactsPage originFilter="chatbot" />
}

function CombinedContactsPage() {
  return (
    <Tabs defaultValue="outreach">
      <TabsList>
        <TabsTrigger value="outreach">Outreach</TabsTrigger>
        <TabsTrigger value="chatbot">Chatbot</TabsTrigger>
      </TabsList>
      <TabsContent value="outreach">
        <FilteredContactsPage originFilter="outreach" />
      </TabsContent>
      <TabsContent value="chatbot">
        <FilteredContactsPage originFilter="chatbot" />
      </TabsContent>
    </Tabs>
  )
}

interface FilteredContactsPageProps {
  originFilter?: OriginFilter
}

function FilteredContactsPage({ originFilter }: FilteredContactsPageProps) {
  const { dateRange } = useDateFilter()
  const { searchQuery } = useSearch()
  const { contacts, loading, error, refetch } = useContacts({ dateRange, originFilter })
  const [convertContact, setConvertContact] = useState<ContactWithLead | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return contacts
    const q = searchQuery.toLowerCase()
    return contacts.filter((c) =>
      [c.first_name, c.last_name, c.email, c.phone]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(q))
    )
  }, [contacts, searchQuery])

  const handleConvertToLead = useCallback((contact: ContactWithLead) => {
    setConvertContact(contact)
    setDialogOpen(true)
  }, [])

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        {loading ? 'Loading...' : `${filteredContacts.length} contacts found`}
      </p>

      {error && (
        <div className="rounded-md bg-destructive/10 p-4 text-destructive">
          {error.message}
        </div>
      )}

      <ContactsTable contacts={filteredContacts} loading={loading} onConvertToLead={handleConvertToLead} />

      <ConvertToLeadDialog
        contact={convertContact}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onConverted={refetch}
      />
    </div>
  )
}
