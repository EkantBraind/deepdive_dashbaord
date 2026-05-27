import { format } from 'date-fns'
import { MessageSquare } from 'lucide-react'
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
import type { SessionWithPreview } from '@/hooks/use-conversations'

interface ConversationsTableProps {
  sessions: SessionWithPreview[]
  loading: boolean
  onSessionClick?: (session: SessionWithPreview) => void
}

export function ConversationsTable({ sessions, loading, onSessionClick }: ConversationsTableProps) {
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
                  <Skeleton className="h-3 w-64" />
                </div>
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (sessions.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-muted mb-4">
            <MessageSquare className="size-7 text-muted-foreground" />
          </div>
          <h3 className="font-semibold mb-1">No conversations found</h3>
          <p className="text-sm text-muted-foreground">
            No conversations match the selected date range.
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
              <TableHead className="font-semibold">Contact</TableHead>
              <TableHead className="font-semibold">Preview</TableHead>
              <TableHead className="font-semibold">Messages</TableHead>
              <TableHead className="font-semibold">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.map((session, index) => (
              <TableRow
                key={session.session_id}
                className={`${index % 2 === 0 ? 'bg-background' : 'bg-muted/30'} ${onSessionClick ? 'cursor-pointer hover:bg-muted/50' : ''}`}
                onClick={() => onSessionClick?.(session)}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary font-medium text-sm">
                      {(session.name ?? session.session_id)[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {session.name ?? <span className="font-mono text-muted-foreground">{session.session_id}</span>}
                      </p>
                      {session.name && (
                        <p className="text-xs text-muted-foreground font-mono">{session.session_id}</p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="max-w-md">
                  <p className="text-sm text-muted-foreground truncate">
                    {session.preview || <span className="italic">No preview available</span>}
                  </p>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{session.messageCount}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {session.created_at
                    ? format(new Date(session.created_at), 'MMM d, yyyy h:mm a')
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
