import { useMemo } from 'react'
import { format } from 'date-fns'
import {
  ArrowLeft,
  Mail,
  Phone,
  MessageSquare,
  Wrench,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
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
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/70 border border-dashed border-gray-300 text-xs text-gray-500">
          <Wrench className="size-3" />
          <span>{formatToolName(toolName)}</span>
        </div>
      </div>
    )
  }

  const displayContent = isHuman ? getHumanContent(message.content) : message.content

  return (
    <div className={cn('flex', isHuman ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[75%] px-3.5 py-2.5 text-[13px] leading-relaxed text-gray-900',
          isHuman
            ? 'rounded-[14px] rounded-tr-[4px]'
            : 'bg-white rounded-[14px] rounded-tl-[4px]'
        )}
        style={isHuman ? { backgroundColor: '#DCF8C6' } : {}}
      >
        <p className="whitespace-pre-wrap">{displayContent}</p>
        {conv.created_at && (
          <p className="text-[10px] text-gray-400 text-right mt-1">
            {isHuman ? 'You' : 'Ivy'} · {format(new Date(conv.created_at), 'h:mm a')}
          </p>
        )}
      </div>
    </div>
  )
}

function SessionBlock({ session }: { session: ContactSession }) {
  const ChannelIcon = session.channel === 'email' ? Mail : Phone
  const channelLabel = session.channel === 'email' ? 'Email' : 'WhatsApp'

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 py-3">
        <div className="flex-1 h-px bg-[#c5b9ae]" />
        <div className="flex items-center gap-2 text-xs text-gray-500 bg-[#d4c8be] px-3 py-1.5 rounded-full">
          <ChannelIcon className="size-3" />
          <span>
            {channelLabel}
            {session.createdAt && ` - ${format(new Date(session.createdAt), 'MMM d, yyyy h:mm a')}`}
          </span>
          <span className="text-[10px] font-medium">{session.messageCount} msgs</span>
        </div>
        <div className="flex-1 h-px bg-[#c5b9ae]" />
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

  const defaultTab = hasWhatsApp ? 'whatsapp' : 'email'

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5 text-[#0A8754] hover:text-[#0A8754] hover:bg-green-50 font-semibold">
          <ArrowLeft className="size-4" />
          Back to Conversations
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
          {hasWhatsApp && (
            <TabsTrigger value="whatsapp" className="gap-1.5">
              <Phone className="size-3.5" />
              WhatsApp
            </TabsTrigger>
          )}
          {hasEmail && (
            <TabsTrigger value="email" className="gap-1.5">
              <Mail className="size-3.5" />
              Email
            </TabsTrigger>
          )}
        </TabsList>

        {hasWhatsApp && (
          <TabsContent value="whatsapp">
            <SessionList sessions={whatsappSessions} loading={loading} />
          </TabsContent>
        )}

        {hasEmail && (
          <TabsContent value="email">
            <SessionList sessions={emailSessions} loading={loading} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

function SessionList({ sessions, loading }: { sessions: ContactSession[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="h-[calc(100vh-300px)] rounded-xl p-6 space-y-4" style={{ backgroundColor: '#ECE5DD' }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-4 w-48 mx-auto bg-[#d4c8be]" />
            <div className="space-y-2">
              <div className="flex justify-end">
                <Skeleton className="h-10 w-48 rounded-2xl bg-[#d4c8be]" />
              </div>
              <div className="flex justify-start">
                <Skeleton className="h-16 w-64 rounded-2xl bg-[#d4c8be]" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (sessions.length === 0) {
    return (
      <div className="h-[calc(100vh-300px)] rounded-xl flex flex-col items-center justify-center text-center" style={{ backgroundColor: '#ECE5DD' }}>
        <div className="flex size-14 items-center justify-center rounded-full bg-[#d4c8be] mb-4">
          <MessageSquare className="size-7 text-gray-500" />
        </div>
        <h3 className="font-semibold mb-1 text-gray-700">No conversations yet</h3>
        <p className="text-sm text-gray-500">No conversation sessions found for this channel.</p>
      </div>
    )
  }

  return (
    <ScrollArea className="h-[calc(100vh-300px)] rounded-xl" style={{ backgroundColor: '#ECE5DD' }}>
      <div className="p-4 space-y-2">
        {sessions.map((session) => (
          <SessionBlock key={session.sessionId} session={session} />
        ))}
      </div>
    </ScrollArea>
  )
}
