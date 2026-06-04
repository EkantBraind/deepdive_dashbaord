import { useState, useEffect, useRef } from 'react'
import { format, formatDistanceToNow } from 'date-fns'
import { Flag, ExternalLink, Loader2, CalendarCheck, Copy, Check, Zap, AlertTriangle, Phone, Link } from 'lucide-react'
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { ConversationDialog } from './conversation-dialog'
import { useLeadConversation } from '@/hooks/use-lead-conversation'
import { supabase } from '@/lib/supabase'
import type { Lead, Campaign, Conversation, ConversationMessage } from '@/types/database'

const AVATAR_COLORS = ['#0A8754', '#3B82F6', '#F59E0B', '#8B5CF6', '#0EAD6A', '#F44336']

function getAvatarColor(name: string) {
  const hash = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

interface LeadDetailSheetProps {
  lead: Lead | null
  statuses: Campaign[]
  open: boolean
  onOpenChange: (open: boolean) => void

}

export function LeadDetailSheet({
  lead,
  statuses,
  open,
  onOpenChange,
}: LeadDetailSheetProps) {
  const [fullConvOpen, setFullConvOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [progressConfirmOpen, setProgressConfirmOpen] = useState(false)
  const [progressing, setProgressing] = useState(false)

  const handleCopyCalendly = (url: string) => {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const STAGE_LABELS: Record<number, string> = {
    0: 'Awaiting Contact',
    1: 'Call Not Answered - 1',
    2: 'Call Not Answered - 2',
    3: 'Call Not Answered - 3',
    4: 'Ivy Outreach',
  }

  const currentCalls = lead?.number_of_calls ?? 0
  const nextCalls = currentCalls + 1
  const nextStageLabel = STAGE_LABELS[Math.min(nextCalls, 4)] ?? 'Ivy Outreach'
  const canProgress = lead?.campaign === 'welcome' && currentCalls < 4

  const handleProgressStage = async () => {
    if (!lead) return
    setProgressing(true)
    try {
      const { error } = await supabase
        .from('leads')
        .update({ number_of_calls: nextCalls })
        .eq('id', lead.id)
      if (error) throw error
      setProgressConfirmOpen(false)
    } catch (err) {
      console.error('Failed to progress stage:', err)
    } finally {
      setProgressing(false)
    }
  }
  const {
    data: convData,
    loading: convLoading,
    error: convError,
    fetchConversation,
    reset,
  } = useLeadConversation()

  useEffect(() => {
    if (open && lead?.phone) {
      fetchConversation(lead.phone)
    }
    if (!open) {
      reset()
      setFullConvOpen(false)
    }
  }, [open, lead?.phone])   // eslint-disable-line react-hooks/exhaustive-deps

  if (!lead) return null

  const campaignInfo = statuses.find((s) =>
    s.filter ? s.filter(lead) : s.name === lead.campaign
  )
  const name = [lead.first_name, lead.last_name].filter(Boolean).join(' ') || 'Unknown'
  const avatarColor = getAvatarColor(name)
  const initials = getInitials(name)

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="p-0 gap-0 flex flex-col"
          style={{ width: 500, maxWidth: '95vw', background: 'white', borderLeft: '1px solid #e0e6ed' }}
        >
          {/* ── Header ─────────────────────────────────────────── */}
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #e0e6ed', flexShrink: 0 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Avatar + name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: avatarColor, color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 15, fontWeight: 700, flexShrink: 0,
                }}>
                  {initials}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {name}
                  </div>
                  <div style={{ fontSize: 13, color: '#7a8fa0' }}>
                    {lead.email || lead.phone || 'No contact info'}
                  </div>
                </div>
              </div>

              {/* Campaign badge + Book Meeting */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                {(campaignInfo || lead.campaign) && (
                  <span style={{
                    display: 'inline-block',
                    padding: '3px 10px',
                    borderRadius: 100,
                    fontSize: 11,
                    fontWeight: 600,
                    color: campaignInfo?.colour || '#6b7280',
                    borderWidth: 1,
                    borderStyle: 'solid',
                    borderColor: campaignInfo?.colour || '#6b7280',
                    background: `${campaignInfo?.colour || '#6b7280'}15`,
                  }}>
                    {campaignInfo?.label || lead.campaign}
                  </span>
                )}
                {lead.calendly_identifier && (() => {
                  const url = `https://calendly.com/matt-deep-dive-trusts/call?utm_source=${lead.calendly_identifier}`
                  return (
                    <>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          padding: '3px 10px',
                          borderRadius: 100,
                          fontSize: 11,
                          fontWeight: 600,
                          color: '#0A8754',
                          borderWidth: 1,
                          borderStyle: 'solid',
                          borderColor: '#0A8754',
                          background: '#0A875415',
                          textDecoration: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        <CalendarCheck style={{ width: 11, height: 11 }} />
                        Book Meeting
                      </a>
                      <button
                        onClick={() => handleCopyCalendly(url)}
                        title="Copy link"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 24,
                          height: 24,
                          borderRadius: 6,
                          border: '1px solid #e0e6ed',
                          background: copied ? '#f0fdf4' : 'white',
                          color: copied ? '#0A8754' : '#7a8fa0',
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                          flexShrink: 0,
                        }}
                      >
                        {copied
                          ? <Check style={{ width: 11, height: 11 }} />
                          : <Copy style={{ width: 11, height: 11 }} />
                        }
                      </button>
                    </>
                  )
                })()}
              </div>
            </div>
          </div>

          {/* ── Scrollable body ────────────────────────────────── */}
          <div style={{ flex: 1, overflowY: 'auto' }}>

            {/* Contact Details */}
            <Section title="Contact Details">
              <DpRow label="Email" value={lead.email || 'Not provided'} />
              <DpRow label="Phone" value={lead.phone || 'N/A'} />
              {lead.source && <DpRow label="Source" value={lead.source} />}
            </Section>

            {/* Qualification */}
            <Section title="Qualification">
              <DpRow label="Current Stage" value={campaignInfo?.label || lead.campaign || 'No status'} />
              {lead.campaign === 'welcome' && <DpRow label="Calls Made" value={String(lead.number_of_calls ?? 0)} />}
              {lead.intent && <DpRow label="Intent" value={lead.intent} />}
              {lead.interest_area && <DpRow label="Interest Area" value={lead.interest_area} />}
              <DpRow label="Estate over £1.5m" value={lead.estate_over_1_5m === true ? 'Yes' : lead.estate_over_1_5m === false ? 'No' : 'Unknown'} />
              <DpRow label="UK Taxpayer" value={lead.uk_taxpayer === true ? 'Yes' : lead.uk_taxpayer === false ? 'No' : 'Unknown'} />
              <DpRow
                label="Created"
                value={lead.created_at
                  ? `${format(new Date(lead.created_at), 'MMM d, yyyy')} · ${formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}`
                  : 'Unknown'}
              />
              {lead.call_scheduled_at && (
                <DpRow
                  label="Call Scheduled"
                  value={format(new Date(lead.call_scheduled_at), 'MMM d, yyyy h:mm a')}
                />
              )}
              {lead.meeting_link && (
                <MeetingLinkRow value={lead.meeting_link} />
              )}
            </Section>

            {/* Conversation Preview */}
            {lead.phone && (
              <Section title="Conversation Preview">
                <ConversationPreview
                  conversations={convData?.conversations || []}
                  capturePoint={null}
                  loading={convLoading}
                  error={convError}
                />
              </Section>
            )}

            {/* Actions */}
            <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {canProgress && (
                <button
                  onClick={() => setProgressConfirmOpen(true)}
                  style={{
                    padding: '10px 16px', borderRadius: 8,
                    background: '#7C3AED', color: 'white', border: 'none',
                    fontSize: 13, fontWeight: 500, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    fontFamily: 'inherit', transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#6D28D9')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '#7C3AED')}
                >
                  <Zap style={{ width: 14, height: 14 }} />
                  Move to {nextStageLabel}
                </button>
              )}
              {lead.phone && (
                <button
                  onClick={() => setFullConvOpen(true)}
                  style={{
                    padding: '10px 16px', borderRadius: 8,
                    background: '#0A8754', color: 'white', border: 'none',
                    fontSize: 13, fontWeight: 500, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    fontFamily: 'inherit', transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#076B43')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '#0A8754')}
                >
                  <ExternalLink style={{ width: 14, height: 14 }} />
                  View Full Conversation
                </button>
              )}
              <button
                onClick={() => onOpenChange(false)}
                style={{
                  padding: '10px 16px', borderRadius: 8,
                  background: 'white', color: '#1a1a1a', border: '1px solid #e0e6ed',
                  fontSize: 13, fontWeight: 500, cursor: 'pointer',
                  textAlign: 'center', fontFamily: 'inherit', transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#f5f7fa')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
              >
                Close
              </button>
            </div>

          </div>
        </SheetContent>
      </Sheet>

      {/* Stage progression confirmation */}
      <Dialog open={progressConfirmOpen} onOpenChange={setProgressConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-amber-500" />
              Move to {nextStageLabel}?
            </DialogTitle>
            <DialogDescription>
              This will move <strong>{[lead.first_name, lead.last_name].filter(Boolean).join(' ') || 'this lead'}</strong> from{' '}
              <strong>{STAGE_LABELS[currentCalls] ?? 'current stage'}</strong> to <strong>{nextStageLabel}</strong>.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <button
              onClick={() => setProgressConfirmOpen(false)}
              disabled={progressing}
              style={{
                padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500,
                background: 'white', color: '#1a1a1a', border: '1px solid #e0e6ed',
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleProgressStage}
              disabled={progressing}
              style={{
                padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500,
                background: progressing ? '#9D71F0' : '#7C3AED', color: 'white', border: 'none',
                cursor: progressing ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              {progressing
                ? <><Loader2 style={{ width: 13, height: 13 }} className="animate-spin" /> Moving…</>
                : <><Zap style={{ width: 13, height: 13 }} /> Confirm</>
              }
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Full conversation dialog */}
      <ConversationDialog
        open={fullConvOpen}
        onOpenChange={setFullConvOpen}
        conversations={convData?.conversations || []}
        capturePoint={null}
        loading={convLoading}
        error={convError}
      />
    </>
  )
}

// ─── Conversation Preview (WhatsApp-style inline) ──────────────────────────────

interface ConversationPreviewProps {
  conversations: Conversation[]
  capturePoint: number | null
  loading: boolean
  error: Error | null
}

function ConversationPreview({ conversations, capturePoint, loading, error }: ConversationPreviewProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversations.length])

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
        <Loader2 style={{ width: 18, height: 18, color: '#7a8fa0' }} className="animate-spin" />
      </div>
    )
  }

  if (error) {
    return <p style={{ fontSize: 13, color: '#dc2626' }}>Failed to load conversation</p>
  }

  if (conversations.length === 0) {
    return <p style={{ fontSize: 13, color: '#7a8fa0' }}>No conversation yet</p>
  }

  const visibleMessages = conversations.filter((conv) => {
    const msg = conv.message as unknown as ConversationMessage
    return (msg.type === 'human' || msg.type === 'ai') &&
      !(msg.type === 'ai' && Array.isArray(msg.tool_calls) && msg.tool_calls.length > 0)
  })

  const getContent = (msg: ConversationMessage) => {
    if (msg.type === 'human') {
      const match = msg.content.match(/User's current message:\s*(.*)$/s)
      return match ? match[1].trim() : msg.content
    }
    return msg.content
  }

  return (
    <div
      style={{
        background: '#ECE5DD',
        borderRadius: 10,
        padding: 12,
        maxHeight: 260,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      {visibleMessages.map((conv) => {
        const msg = conv.message as unknown as ConversationMessage
        const isHuman = msg.type === 'human'
        const isCapturePoint = capturePoint !== null && conv.id === capturePoint
        const content = getContent(msg)

        return (
          <div key={conv.id}>
            {isCapturePoint && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', margin: '4px 0' }}>
                <div style={{ flex: 1, height: 1, background: '#0A8754' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 600, color: '#0A8754', background: '#f0fdf4', padding: '3px 8px', borderRadius: 10 }}>
                  <Flag style={{ width: 9, height: 9 }} />
                  Lead Captured
                </div>
                <div style={{ flex: 1, height: 1, background: '#0A8754' }} />
              </div>
            )}
            <div
              style={{
                maxWidth: '80%',
                padding: '8px 12px',
                borderRadius: 14,
                fontSize: 13,
                lineHeight: 1.5,
                background: isHuman ? '#DCF8C6' : 'white',
                marginLeft: isHuman ? 'auto' : undefined,
                borderTopLeftRadius: isHuman ? 14 : 4,
                borderTopRightRadius: isHuman ? 4 : 14,
                wordBreak: 'break-word',
              }}
            >
              {content}
              {conv.created_at && (
                <div style={{ fontSize: 10, color: '#999', textAlign: 'right', marginTop: 3 }}>
                  {format(new Date(conv.created_at), 'h:mm a')}
                </div>
              )}
            </div>
          </div>
        )
      })}
      <div ref={bottomRef} />
    </div>
  )
}

// ─── Shared sub-components ─────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: '16px 24px', borderBottom: '1px solid #f0f0f0' }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#7a8fa0', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>
        {title}
      </div>
      {children}
    </div>
  )
}

function MeetingLinkRow({ value }: { value: string }) {
  const isUrl = /^https?:\/\//i.test(value.trim())
  const isPhone = !isUrl && /^[\+\d][\d\s\-\(\)\.]{5,}$/.test(value.trim())

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', fontSize: 13, gap: 12, minWidth: 0 }}>
      <span style={{ color: '#7a8fa0', flexShrink: 0 }}>Meeting Link</span>
      {isUrl ? (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            color: '#0A8754', textDecoration: 'none', fontWeight: 500,
            minWidth: 0, overflow: 'hidden',
          }}
        >
          <Link style={{ width: 12, height: 12, flexShrink: 0 }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</span>
          <ExternalLink style={{ width: 11, height: 11, flexShrink: 0, opacity: 0.6 }} />
        </a>
      ) : isPhone ? (
        <a
          href={`tel:${value.replace(/\s/g, '')}`}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            color: '#3B82F6', textDecoration: 'none', fontWeight: 500,
          }}
        >
          <Phone style={{ width: 12, height: 12, flexShrink: 0 }} />
          {value}
        </a>
      ) : (
        <span style={{ color: '#1a1a1a', textAlign: 'right', wordBreak: 'break-word' }}>{value}</span>
      )}
    </div>
  )
}

function DpRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13, gap: 12 }}>
      <span style={{ color: '#7a8fa0', flexShrink: 0, textTransform: 'capitalize' }}>{label}</span>
      <span style={{ color: '#1a1a1a', textAlign: 'right', wordBreak: 'break-word' }}>{value}</span>
    </div>
  )
}
