import { useState, useCallback, useMemo } from 'react'
import { ConversationsTable } from '@/components/conversations/conversations-table'
import { ConversationDialog } from '@/components/leads/conversation-dialog'
import { useConversations, type SessionWithPreview } from '@/hooks/use-conversations'
import { useDateFilter } from '@/contexts/date-filter-context'
import { useSearch } from '@/contexts/search-context'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { User } from 'lucide-react'
import type { Conversation } from '@/types/database'

export function ConversationsPage() {
  const { dateRange } = useDateFilter()
  const { searchQuery } = useSearch()
  const { sessions, loading, error } = useConversations({ dateRange })

  const [minMessages, setMinMessages] = useState(0)
  const [humanOnly, setHumanOnly] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedConversations, setSelectedConversations] = useState<Conversation[]>([])
  const [conversationLoading, setConversationLoading] = useState(false)
  const [conversationError, setConversationError] = useState<Error | null>(null)

  const handleSessionClick = useCallback(async (session: SessionWithPreview) => {
    setDialogOpen(true)
    setConversationLoading(true)
    setConversationError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('conversations')
        .select('*')
        .or(`session_id.eq.${session.session_id},session_id.eq.+${session.session_id}`)
        .order('id', { ascending: true })

      if (fetchError) throw fetchError
      setSelectedConversations(data || [])
    } catch (err) {
      setConversationError(err instanceof Error ? err : new Error('Failed to fetch conversation'))
    } finally {
      setConversationLoading(false)
    }
  }, [])

  const handleDialogClose = useCallback((open: boolean) => {
    setDialogOpen(open)
    if (!open) {
      setSelectedConversations([])
      setConversationError(null)
    }
  }, [])

  const maxMessages = useMemo(
    () => (sessions.length === 0 ? 0 : Math.max(...sessions.map((s) => s.messageCount))),
    [sessions]
  )

  const filteredSessions = useMemo(() => {
    let filtered = sessions
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter((s) =>
        [s.session_id, s.preview].filter(Boolean).some((f) => f!.toLowerCase().includes(q))
      )
    }
    if (minMessages > 0) filtered = filtered.filter((s) => s.messageCount >= minMessages)
    if (humanOnly) filtered = filtered.filter((s) => s.hasHumanMessage)
    return filtered
  }, [sessions, searchQuery, minMessages, humanOnly])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Conversations</h1>
          <p className="text-muted-foreground">
            {loading ? 'Loading…' : `${filteredSessions.length} conversations found`}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant={humanOnly ? 'default' : 'outline'}
            size="sm"
            className="gap-2"
            onClick={() => setHumanOnly((v) => !v)}
          >
            <User className="size-4" />
            Human messages only
          </Button>
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
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-4 text-destructive">
          {error.message}
        </div>
      )}

      <ConversationsTable
        sessions={filteredSessions}
        loading={loading}
        onSessionClick={handleSessionClick}
      />

      <ConversationDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        conversations={selectedConversations}
        capturePoint={null}
        loading={conversationLoading}
        error={conversationError}
      />
    </div>
  )
}
