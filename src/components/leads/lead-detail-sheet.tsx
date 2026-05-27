import { useState, useEffect, useCallback } from 'react'
import { format, formatDistanceToNow } from 'date-fns'
import {
  Mail,
  Phone,
  Calendar,
  Clock,
  Tag,
  Globe,
  CheckCircle2,
  XCircle,
  Heart,
  MessageSquare,
  CalendarPlus,
  Copy,
  Check,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ConversationDialog } from './conversation-dialog'
import { useLeadConversation } from '@/hooks/use-lead-conversation'
import type { Lead, Campaign } from '@/types/database'

interface LeadDetailSheetProps {
  lead: Lead | null
  statuses: Campaign[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onStatusChange?: (leadId: string, newCampaign: string) => void
  updating?: boolean
}

const CALENDLY_BASE = 'https://calendly.com/matt-deep-dive-trusts/call'

export function LeadDetailSheet({
  lead,
  statuses,
  open,
  onOpenChange,
}: LeadDetailSheetProps) {
  const [conversationOpen, setConversationOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const { data, loading: convLoading, error: convError, fetchConversation, reset } = useLeadConversation()

  useEffect(() => {
    if (!open) {
      reset()
      setConversationOpen(false)
      setCopied(false)
    }
  }, [open, reset])

  if (!lead) return null

  const campaignInfo = statuses.find((c) => c.name === lead.campaign)
  const name = [lead.first_name, lead.last_name].filter(Boolean).join(' ') || 'Unknown'
  const meetingUrl = lead.email
    ? `${CALENDLY_BASE}?utm_source=${encodeURIComponent(lead.email)}`
    : null

  const handleViewConversation = () => {
    if (lead.phone) {
      fetchConversation(lead.phone)
      setConversationOpen(true)
    }
  }

  const handleCopyMeetingLink = useCallback(() => {
    if (!meetingUrl) return
    navigator.clipboard.writeText(meetingUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [meetingUrl])

  return (
    <>

    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!w-[65vw] !max-w-[65vw] p-0 gap-0 overflow-hidden bg-gray-100 dark:bg-gray-900">
        <DialogHeader className="px-6 py-4 border-b flex flex-row items-center justify-between pr-12">
          <DialogTitle className="text-lg font-semibold">Lead Details</DialogTitle>
          <div className="flex items-center gap-2">
            {meetingUrl && (
              <>
                <a href={meetingUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="gap-2 shrink-0">
                    <CalendarPlus className="size-4" />
                    Book Meeting
                  </Button>
                </a>
                <Button variant="outline" size="sm" className="gap-2 shrink-0" onClick={handleCopyMeetingLink}>
                  {copied ? <Check className="size-4 text-green-500" /> : <Copy className="size-4" />}
                  {copied ? 'Copied!' : 'Copy Link'}
                </Button>
              </>
            )}
            {lead.phone && (
              <Button variant="outline" size="sm" className="gap-2 shrink-0" onClick={handleViewConversation}>
                <MessageSquare className="size-4" />
                View Conversation
              </Button>
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          <div className="px-6 py-5 space-y-5">
            {/* Name and Campaign */}
            <div className="flex items-start justify-between">
              <h2 className="text-2xl font-bold">{name}</h2>
              {campaignInfo ? (
                <Badge
                  className="text-white text-sm px-3 py-1 rounded-full"
                  style={{ backgroundColor: campaignInfo.colour }}
                >
                  {campaignInfo.label}
                </Badge>
              ) : lead.campaign ? (
                <Badge variant="secondary">{lead.campaign}</Badge>
              ) : null}
            </div>

            {/* Contact Information */}
            <div className="rounded-xl border p-5 bg-white dark:bg-gray-800">
              <h3 className="flex items-center gap-2 text-base font-semibold mb-4">
                <svg className="size-5 text-teal-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                Contact Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-cyan-50 dark:bg-cyan-950">
                    <Mail className="size-5 text-cyan-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{lead.email || 'Not provided'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950">
                    <Phone className="size-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{lead.phone || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="rounded-xl border p-5 bg-white dark:bg-gray-800">
              <h3 className="flex items-center gap-2 text-base font-semibold mb-4">
                <Clock className="size-5" />
                Timeline
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                    <Calendar className="size-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Created</p>
                    <p className="font-medium">
                      {lead.created_at
                        ? format(new Date(lead.created_at), 'M/d/yyyy, h:mm:ss a')
                        : 'Unknown'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {lead.created_at
                        ? formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })
                        : ''}
                    </p>
                  </div>
                </div>
                {lead.call_scheduled_at && (
                  <div className="flex items-start gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-blue-500/10">
                      <Calendar className="size-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Call Scheduled</p>
                      <p className="font-medium">
                        {format(new Date(lead.call_scheduled_at), 'M/d/yyyy, h:mm a')}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10">
                    <Tag className="size-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pipeline Stage</p>
                    <p className="font-medium">
                      {campaignInfo?.label || lead.campaign || 'Not set'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Intent & Source */}
            <div className="rounded-xl border p-5 bg-white dark:bg-gray-800">
              <h3 className="flex items-center gap-2 text-base font-semibold mb-4">
                <Globe className="size-5" />
                Intent &amp; Source
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                    <Heart className="size-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Intent</p>
                    <p className="font-medium">{lead.intent || 'Not specified'}</p>
                  </div>
                </div>
                {lead.interest_area && (
                  <div className="flex items-start gap-3 col-span-2">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                      <Tag className="size-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Interest Area</p>
                      <p className="font-medium">{lead.interest_area}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Qualification Flags */}
            <div className="rounded-xl border p-5 bg-white dark:bg-gray-800">
              <h3 className="flex items-center gap-2 text-base font-semibold mb-4">
                <CheckCircle2 className="size-5" />
                Qualification
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <QualFlag label="Estate over £1.5m" value={lead.estate_over_1_5m} />
                <QualFlag label="UK Taxpayer" value={lead.uk_taxpayer} />
              </div>
            </div>

            {/* Meeting Link */}
            {lead.meeting_link && (
              <div className="rounded-xl border p-5 bg-white dark:bg-gray-800">
                <h3 className="text-base font-semibold mb-3">Meeting Link</h3>
                <a
                  href={lead.meeting_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-500 underline break-all"
                >
                  {lead.meeting_link}
                </a>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-muted/30">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    <ConversationDialog
      open={conversationOpen}
      onOpenChange={setConversationOpen}
      conversations={data?.conversations || []}
      capturePoint={null}
      loading={convLoading}
      error={convError}
    />
    </>
  )
}

function QualFlag({ label, value, inverted = false }: { label: string; value: boolean | null; inverted?: boolean }) {
  const positive = inverted ? !value : value
  return (
    <div className="flex items-center gap-2 text-sm">
      {positive ? (
        <CheckCircle2 className="size-4 text-green-500" />
      ) : (
        <XCircle className="size-4 text-muted-foreground" />
      )}
      <span className={positive ? 'font-medium' : 'text-muted-foreground'}>{label}</span>
    </div>
  )
}
