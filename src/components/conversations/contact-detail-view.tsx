import { useMemo } from 'react'
import { format } from 'date-fns'
import {
  ArrowLeft,
  Mail,
  Phone,
  MessageSquare,
  Bot,
  User,
  Wrench,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useContactSessions, type ContactSession } from '@/hooks/use-contact-conversations'
import type { ContactWithConversations } from '@/hooks/use-contact-conversations'
import type { Conversation, ConversationMessage } from '@/types/database'

interface ContactDetailViewProps {
  contact: ContactWithConversations
  onBack: () => void
}

function getHumanContent(content: string): string {
  const match = content.match(/User's current message:\s*(.*)$/s)
  return match ? match[1].trim() : content
}

function formatToolName(name: string): string {
  return name.replace(/_/g, ' ')
}

function MessageBubble({ conv }: { conv: Conversation }) {
  const message = conv.message as unknown as ConversationMessage
  const isHuman = message.type === 'human'
  const isToolCall =
    message.type === 'ai' && Array.isArray(message.tool_calls) && message.tool_calls.length > 0
  const isToolResponse = message.type === 'tool'

  if (isToolResponse) return null

  if (isToolCall && message.tool_calls) {
    const toolName = message.tool_calls[0]?.name || 'Tool'
    return (
      <div className="flex justify-center my-2">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-dashed text-xs text-muted-foreground">
          <Wrench className="size-3" />
          <span>{formatToolName(toolName)}</span>
        </div>
      </div>
    )
  }

  const displayContent = isHuman ? getHumanContent(message.content) : message.content

  return (
    <div className={cn('flex items-end gap-2', isHuman ? 'justify-end' : 'justify-start')}>
      {!isHuman && (
        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted">
          <Bot className="size-4 text-muted-foreground" />
        </div>
      )}
      <div className={cn('flex flex-col max-w-[75%]', isHuman ? 'items-end' : 'items-start')}>
        <div
          className={cn(
            'px-4 py-2.5 text-sm',
            isHuman
              ? 'bg-primary text-primary-foreground rounded-2xl rounded-br-md'
              : 'bg-muted rounded-2xl rounded-bl-md'
          )}
        >
          <p className="whitespace-pre-wrap">{displayContent}</p>
        </div>
        {conv.created_at && (
          <span className="text-[10px] text-muted-foreground mt-1 px-1">
            {format(new Date(conv.created_at), 'h:mm a')}
          </span>
        )}
      </div>
      {isHuman && (
        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary">
          <User className="size-4 text-primary-foreground" />
        </div>
      )}
    </div>
  )
}

function SessionBlock({ session }: { session: ContactSession }) {
  const ChannelIcon = session.channel === 'email' ? Mail : Phone
  const channelLabel = session.channel === 'email' ? 'Email' : 'WhatsApp'

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 py-3">
        <div className="flex-1 h-px bg-border" />
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
          <ChannelIcon className="size-3" />
          <span>
            {channelLabel}
            {session.createdAt && ` - ${format(new Date(session.createdAt), 'MMM d, yyyy h:mm a')}`}
          </span>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            {session.messageCount} msgs
          </Badge>
        </div>
        <div className="flex-1 h-px bg-border" />
      </div>
      <div className="space-y-3">
        {session.conversations.map((conv) => (
          <MessageBubble key={conv.id} conv={conv} />
        ))}
      </div>
    </div>
  )
}

export function ContactDetailView({ contact, onBack }: ContactDetailViewProps) {
  const { sessions, loading, error } = useContactSessions(contact)

  const hasEmail = Boolean(contact.email)
  const hasWhatsApp = Boolean(contact.phone)
  const contactName =
    [contact.first_name, contact.last_name].filter(Boolean).join(' ') || 'Unknown Contact'

  const emailSessions = useMemo(() => sessions.filter((s) => s.channel === 'email'), [sessions])
  const whatsappSessions = useMemo(() => sessions.filter((s) => s.channel === 'whatsapp'), [sessions])

  const defaultTab = hasEmail ? 'email' : 'whatsapp'

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
          <ArrowLeft className="size-4" />
          Back
        </Button>
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary font-medium">
            {contact.first_name?.[0]?.toUpperCase() || contact.email?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <h2 className="font-semibold text-lg">{contactName}</h2>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              {contact.email && (
                <span className="flex items-center gap-1">
                  <Mail className="size-3.5" />
                  {contact.email}
                </span>
              )}
              {contact.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="size-3.5" />
                  {contact.phone}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-4 text-destructive flex items-center gap-2">
          <AlertCircle className="size-4" />
          {error.message}
        </div>
      )}

      {/* Channel Tabs */}
      <Tabs defaultValue={defaultTab}>
        <TabsList>
          {hasEmail && (
            <TabsTrigger value="email" className="gap-1.5">
              <Mail className="size-3.5" />
              Email
            </TabsTrigger>
          )}
          {hasWhatsApp && (
            <TabsTrigger value="whatsapp" className="gap-1.5">
              <Phone className="size-3.5" />
              WhatsApp
            </TabsTrigger>
          )}
        </TabsList>

        {hasEmail && (
          <TabsContent value="email">
            <SessionList sessions={emailSessions} loading={loading} />
          </TabsContent>
        )}

        {hasWhatsApp && (
          <TabsContent value="whatsapp">
            <SessionList sessions={whatsappSessions} loading={loading} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

function SessionList({ sessions, loading }: { sessions: ContactSession[]; loading: boolean }) {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-4 w-48 mx-auto" />
              <div className="space-y-2">
                <div className="flex justify-end">
                  <Skeleton className="h-10 w-48 rounded-2xl" />
                </div>
                <div className="flex justify-start">
                  <Skeleton className="h-16 w-64 rounded-2xl" />
                </div>
              </div>
            </div>
          ))}
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
          <h3 className="font-semibold mb-1">No conversations yet</h3>
          <p className="text-sm text-muted-foreground">
            No conversation sessions found for this channel.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-4">
        <ScrollArea className="h-[calc(100vh-320px)]">
          <div className="space-y-2 pr-4">
            {sessions.map((session) => (
              <SessionBlock key={session.sessionId} session={session} />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
