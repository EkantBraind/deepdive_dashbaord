import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { format, isToday, isYesterday, differenceInCalendarDays } from 'date-fns'
import { MessageSquare, Wrench, Loader2, AlertCircle, Search, X } from 'lucide-react'
import { useConversations, type SessionWithPreview } from '@/hooks/use-conversations'
import { useDateFilter } from '@/contexts/date-filter-context'
import { useSearch } from '@/contexts/search-context'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import type { Conversation, ConversationMessage } from '@/types/database'

const AVATAR_COLORS = [
  '#EF4444', '#F97316', '#EAB308', '#22C55E', '#06B6D4',
  '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6', '#F59E0B',
]

function getAvatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function formatWhatsAppTime(dateStr: string | null): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (isToday(date)) return format(date, 'h:mm a')
  if (isYesterday(date)) return 'Yesterday'
  if (differenceInCalendarDays(new Date(), date) < 7) return format(date, 'EEE')
  return format(date, 'M/d/yy')
}

function getHumanContent(content: string): string {
  const match = content.match(/User's current message:\s*(.*)$/s)
  return match ? match[1].trim() : content
}

function ChatMessage({ conv }: { conv: Conversation }) {
  const message = conv.message as unknown as ConversationMessage
  const isHuman = message.type === 'human'
  if (message.type === 'tool') return null

  if (message.type === 'ai' && Array.isArray(message.tool_calls) && message.tool_calls.length > 0) {
    return (
      <div className="flex justify-center my-1.5">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 border border-dashed border-[#C4C4C4] text-[11px] text-[#667781]">
          <Wrench className="size-3" />
          <span>{(message.tool_calls[0]?.name || 'Tool').replace(/_/g, ' ')}</span>
        </div>
      </div>
    )
  }

  const displayContent = isHuman ? getHumanContent(message.content) : message.content

  return (
    <div className={cn('flex', isHuman ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'relative max-w-[75%] px-3 py-2 text-[13.5px] leading-relaxed text-[#111B21] shadow-sm',
          isHuman
            ? 'rounded-[8px] rounded-tr-[2px]'
            : 'rounded-[8px] rounded-tl-[2px] bg-white'
        )}
        style={isHuman ? { backgroundColor: '#DCF8C6' } : {}}
      >
        <p className="whitespace-pre-wrap break-words">{displayContent}</p>
        {conv.created_at && (
          <p className="text-[10.5px] text-[#667781] text-right mt-0.5">
            {format(new Date(conv.created_at), 'h:mm a')}
          </p>
        )}
      </div>
    </div>
  )
}

function SessionItem({
  session,
  isSelected,
  onClick,
}: {
  session: SessionWithPreview
  isSelected: boolean
  onClick: () => void
}) {
  const displayName = session.name ?? session.session_id
  const avatarColor = getAvatarColor(displayName)

  return (
    <button
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3 border-b border-[#E9EDEF] text-left transition-colors',
        isSelected ? 'bg-[#F0F2F5]' : 'bg-white hover:bg-[#F5F5F5]'
      )}
      onClick={onClick}
    >
      <div
        className="flex size-12 shrink-0 items-center justify-center rounded-full text-white font-semibold text-lg"
        style={{ backgroundColor: avatarColor }}
      >
        {displayName[0]?.toUpperCase() ?? '?'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-medium text-[#111B21] text-[15px] truncate leading-tight">
            {session.name ?? (
              <span className="font-mono text-[13px]">{session.session_id}</span>
            )}
          </span>
          {session.created_at && (
            <span className="text-[12px] text-[#667781] shrink-0">
              {formatWhatsAppTime(session.created_at)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p className="text-[13px] text-[#667781] truncate flex-1">
            {session.preview || 'No preview'}
          </p>
          <span className="flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full bg-[#25D366] text-white text-[11px] font-semibold shrink-0">
            {session.messageCount}
          </span>
        </div>
      </div>
    </button>
  )
}

export function ConversationsPage() {
  const { dateRange } = useDateFilter()
  const { searchQuery, setSearchQuery } = useSearch()
  const { sessions, loading, error } = useConversations({ dateRange })

  const [minMessages, setMinMessages] = useState(0)
  const [humanOnly, setHumanOnly] = useState(false)
  const [selectedSession, setSelectedSession] = useState<SessionWithPreview | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [chatLoading, setChatLoading] = useState(false)
  const [chatError, setChatError] = useState<Error | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const maxMessages = useMemo(
    () => (sessions.length === 0 ? 0 : Math.max(...sessions.map((s) => s.messageCount))),
    [sessions]
  )

  const filteredSessions = useMemo(() => {
    let filtered = sessions
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter((s) =>
        [s.session_id, s.preview, s.name].filter(Boolean).some((f) => f!.toLowerCase().includes(q))
      )
    }
    if (minMessages > 0) filtered = filtered.filter((s) => s.messageCount >= minMessages)
    if (humanOnly) filtered = filtered.filter((s) => s.hasHumanMessage)
    return filtered
  }, [sessions, searchQuery, minMessages, humanOnly])

  const handleSessionClick = useCallback(async (session: SessionWithPreview) => {
    setSelectedSession(session)
    setChatLoading(true)
    setChatError(null)
    setConversations([])

    try {
      const { data, error: fetchError } = await supabase
        .from('conversations')
        .select('*')
        .or(`session_id.eq.${session.session_id},session_id.eq.+${session.session_id}`)
        .order('id', { ascending: true })

      if (fetchError) throw fetchError
      setConversations(data || [])
    } catch (err) {
      setChatError(err instanceof Error ? err : new Error('Failed to fetch conversation'))
    } finally {
      setChatLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!chatLoading && conversations.length > 0) {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    }
  }, [chatLoading, conversations])

  return (
    <div className="-m-6 flex h-[calc(100vh-64px)] overflow-hidden">
      {/* ── Left Panel ── */}
      <div className="w-[360px] shrink-0 flex flex-col border-r border-[#E9EDEF]">
        {/* Panel header */}
        <div className="flex items-center justify-between px-4 h-14 shrink-0" style={{ backgroundColor: '#075E54' }}>
          <h2 className="text-white font-semibold text-[17px]">Messages</h2>
          <span className="text-[#B2DFDB] text-sm">
            {loading ? '…' : filteredSessions.length}
          </span>
        </div>

        {/* Search bar */}
        <div className="px-3 py-2 bg-[#F0F2F5] shrink-0">
          <div className="relative flex items-center">
            <Search className="absolute left-3 size-4 text-[#667781]" />
            <input
              type="text"
              placeholder="Search conversations"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 rounded-lg bg-white text-[14px] text-[#111B21] placeholder-[#667781] outline-none border-0 focus:ring-0"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 text-[#667781] hover:text-[#111B21]"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#F0F2F5] border-b border-[#E9EDEF] shrink-0">
          <button
            onClick={() => setHumanOnly((v) => !v)}
            className={cn(
              'text-[12px] px-3 py-0.5 rounded-full font-medium border transition-colors',
              humanOnly
                ? 'bg-[#25D366] text-white border-[#25D366]'
                : 'bg-white text-[#667781] border-[#E9EDEF] hover:border-[#667781]'
            )}
          >
            Human only
          </button>
          {maxMessages > 0 && (
            <div className="flex items-center gap-1.5 ml-auto">
              <span className="text-[11px] text-[#667781] whitespace-nowrap">Min: {minMessages}</span>
              <input
                type="range"
                min={0}
                max={maxMessages}
                value={minMessages}
                onChange={(e) => setMinMessages(Number(e.target.value))}
                className="w-20 h-1 accent-[#25D366] cursor-pointer"
              />
            </div>
          )}
        </div>

        {/* Session list */}
        <div className="flex-1 overflow-y-auto bg-white">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="size-5 animate-spin text-[#25D366]" />
            </div>
          ) : error ? (
            <div className="p-4 text-center text-sm text-red-500">{error.message}</div>
          ) : filteredSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 px-6 text-center">
              <MessageSquare className="size-9 text-[#C4C4C4] mb-3" />
              <p className="text-[#667781] text-sm">No conversations found</p>
            </div>
          ) : (
            filteredSessions.map((session) => (
              <SessionItem
                key={session.session_id}
                session={session}
                isSelected={selectedSession?.session_id === session.session_id}
                onClick={() => handleSessionClick(session)}
              />
            ))
          )}
        </div>
      </div>

      {/* ── Right Panel ── */}
      {selectedSession ? (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Chat header */}
          <div className="flex items-center gap-3 px-4 h-14 shrink-0" style={{ backgroundColor: '#075E54' }}>
            <div
              className="flex size-9 shrink-0 items-center justify-center rounded-full text-white font-semibold text-base"
              style={{ backgroundColor: getAvatarColor(selectedSession.name ?? selectedSession.session_id) }}
            >
              {(selectedSession.name ?? selectedSession.session_id)[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white text-[15px] truncate leading-tight">
                {selectedSession.name ?? selectedSession.session_id}
              </p>
              {selectedSession.name && (
                <p className="text-[11px] text-[#B2DFDB] font-mono truncate">
                  {selectedSession.session_id}
                </p>
              )}
            </div>
            <span className="text-[12px] text-[#B2DFDB] shrink-0">
              {selectedSession.messageCount} msgs
            </span>
          </div>

          {/* Messages */}
          <div
            className="flex-1 overflow-y-auto px-6 py-4 space-y-1.5"
            style={{ backgroundColor: '#ECE5DD' }}
          >
            {chatLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="size-7 animate-spin text-[#075E54]" />
              </div>
            ) : chatError ? (
              <div className="flex flex-col items-center justify-center h-full text-red-500">
                <AlertCircle className="size-7 mb-2" />
                <p className="text-sm">{chatError.message}</p>
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex items-center justify-center h-full text-[#667781] text-sm">
                No messages found
              </div>
            ) : (
              <>
                {conversations.map((conv) => (
                  <ChatMessage key={conv.id} conv={conv} />
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center" style={{ backgroundColor: '#ECE5DD' }}>
          <div className="text-center">
            <div className="flex size-24 items-center justify-center rounded-full bg-white/60 mx-auto mb-5">
              <MessageSquare className="size-12 text-[#C4C4C4]" />
            </div>
            <h3 className="text-[#111B21] text-[22px] font-light mb-1">Select a conversation</h3>
            <p className="text-[#667781] text-sm">
              Choose from your existing conversations on the left.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
