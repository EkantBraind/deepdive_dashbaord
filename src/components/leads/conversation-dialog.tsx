import { useEffect, useRef } from 'react'
import { format } from 'date-fns'
import { MessageSquare, Bot, User, Loader2, AlertCircle, Flag, Wrench } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import type { Conversation, ConversationMessage } from '@/types/database'

interface ConversationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  conversations: Conversation[]
  capturePoint: number | null
  loading: boolean
  error: Error | null
}

export function ConversationDialog({
  open,
  onOpenChange,
  conversations,
  capturePoint,
  loading,
  error,
}: ConversationDialogProps) {
  const captureRef = useRef<HTMLDivElement>(null)

  // Scroll to capture point when dialog opens
  useEffect(() => {
    if (open && captureRef.current) {
      setTimeout(() => {
        captureRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 100)
    }
  }, [open, capturePoint])

  // Helper to check if message is a tool call
  const isToolCallMessage = (message: ConversationMessage): boolean => {
    return message.type === 'ai' && Array.isArray(message.tool_calls) && message.tool_calls.length > 0
  }

  // Helper to check if message is a tool response
  const isToolResponseMessage = (message: ConversationMessage): boolean => {
    return message.type === 'tool'
  }

  // Helper to extract human message content (removes "Session ID:" prefix)
  const getHumanContent = (content: string): string => {
    const match = content.match(/User's current message:\s*(.*)$/s)
    return match ? match[1].trim() : content
  }

  // Helper to format tool name for display
  const formatToolName = (name: string): string => {
    return name.replace(/_/g, ' ')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="size-5" />
            Conversation History
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center text-destructive">
            <AlertCircle className="size-8 mb-2" />
            <p>{error.message}</p>
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <MessageSquare className="size-8 mb-2" />
            <p>No conversation found for this lead</p>
          </div>
        ) : (
          <ScrollArea className="h-[calc(80vh-100px)]">
            <div className="space-y-3 py-4 pl-2 pr-4">
              {conversations.map((conv) => {
                const message = conv.message as unknown as ConversationMessage
                const isHuman = message.type === 'human'
                const isCapturePoint = capturePoint !== null && conv.id === capturePoint
                const isToolCall = isToolCallMessage(message)
                const isToolResponse = isToolResponseMessage(message)

                // Skip tool responses entirely
                if (isToolResponse) {
                  return null
                }

                // Render tool call as artifact
                if (isToolCall && message.tool_calls) {
                  const toolName = message.tool_calls[0]?.name || 'Tool'
                  return (
                    <div key={conv.id}>
                      {isCapturePoint && (
                        <div
                          ref={captureRef}
                          className="flex items-center gap-2 py-3 my-2"
                        >
                          <div className="flex-1 h-px bg-primary" />
                          <div className="flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-full">
                            <Flag className="size-3" />
                            Lead Captured Here
                          </div>
                          <div className="flex-1 h-px bg-primary" />
                        </div>
                      )}
                      <div className="flex justify-center my-2">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-dashed text-xs text-muted-foreground">
                          <Wrench className="size-3" />
                          <span>{formatToolName(toolName)}</span>
                        </div>
                      </div>
                    </div>
                  )
                }

                // Get content (clean up human messages)
                const displayContent = isHuman ? getHumanContent(message.content) : message.content

                return (
                  <div key={conv.id}>
                    {isCapturePoint && (
                      <div
                        ref={captureRef}
                        className="flex items-center gap-2 py-3 my-2"
                      >
                        <div className="flex-1 h-px bg-primary" />
                        <div className="flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-full">
                          <Flag className="size-3" />
                          Lead Captured Here
                        </div>
                        <div className="flex-1 h-px bg-primary" />
                      </div>
                    )}
                    <div
                      className={cn(
                        'flex items-end gap-2',
                        isHuman ? 'justify-end' : 'justify-start'
                      )}
                    >
                      {!isHuman && (
                        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted">
                          <Bot className="size-4 text-muted-foreground" />
                        </div>
                      )}
                      <div
                        className={cn(
                          'flex flex-col max-w-[75%]',
                          isHuman ? 'items-end' : 'items-start'
                        )}
                      >
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
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  )
}
