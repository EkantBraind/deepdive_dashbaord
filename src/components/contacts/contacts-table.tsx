import { format } from 'date-fns'
import { Mail, Phone, Users } from 'lucide-react'
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
import { Button } from '@/components/ui/button'
import type { ContactWithLead } from '@/hooks/use-contacts'

interface ContactsTableProps {
  contacts: ContactWithLead[]
  loading: boolean
  onConvertToLead?: (contact: ContactWithLead) => void
}

export function ContactsTable({ contacts, loading, onConvertToLead }: ContactsTableProps) {
  if (loading) {
    return (
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
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (contacts.length === 0) {
    return (
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
    )
  }

  return (
    <Card className="py-0">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="font-semibold">Name</TableHead>
              <TableHead className="font-semibold">Email</TableHead>
              <TableHead className="font-semibold">Phone</TableHead>
              <TableHead className="font-semibold">Converted</TableHead>
              <TableHead className="font-semibold">Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts.map((contact, index) => (
              <TableRow
                key={contact.id}
                className={index % 2 === 0 ? 'bg-background' : 'bg-muted/30'}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary font-medium text-sm">
                      {contact.first_name?.[0]?.toUpperCase() || contact.email?.[0]?.toUpperCase() || '?'}
                    </div>
                    <span className="font-medium">
                      {[contact.first_name, contact.last_name].filter(Boolean).join(' ') || '—'}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {contact.email ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="size-4" />
                      <span>{contact.email}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {contact.phone ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="size-4" />
                      <span>{contact.phone}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {contact.convertedToLead ? (
                    <span className="text-sm text-green-600 font-medium">Converted</span>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => onConvertToLead?.(contact)}
                    >
                      Convert to Lead
                    </Button>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {contact.created_at
                    ? format(new Date(contact.created_at), 'MMM d, yyyy')
                    : '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
