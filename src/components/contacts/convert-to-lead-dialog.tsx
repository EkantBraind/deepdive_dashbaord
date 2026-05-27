import { useState, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useStatuses } from '@/hooks/use-statuses'
import { supabase } from '@/lib/supabase'
import { Plus, Trash2 } from 'lucide-react'
import type { ContactWithLead } from '@/hooks/use-contacts'

interface ConvertToLeadDialogProps {
  contact: ContactWithLead | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConverted: () => void
}

interface DetailEntry {
  key: string
  value: string
}

export function ConvertToLeadDialog({
  contact,
  open,
  onOpenChange,
  onConverted,
}: ConvertToLeadDialogProps) {
  const { statuses } = useStatuses()
  const [status, setStatus] = useState<string>('')
  const [policy, setPolicy] = useState('')
  const [riskDetails, setRiskDetails] = useState('')
  const [details, setDetails] = useState<DetailEntry[]>([{ key: '', value: '' }])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resetForm = useCallback(() => {
    setStatus('')
    setPolicy('')
    setRiskDetails('')
    setDetails([{ key: '', value: '' }])
    setError(null)
  }, [])

  const handleOpenChange = useCallback(
    (value: boolean) => {
      if (!value) resetForm()
      onOpenChange(value)
    },
    [onOpenChange, resetForm]
  )

  const addDetailEntry = useCallback(() => {
    setDetails((prev) => [...prev, { key: '', value: '' }])
  }, [])

  const removeDetailEntry = useCallback((index: number) => {
    setDetails((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const updateDetailEntry = useCallback(
    (index: number, field: 'key' | 'value', val: string) => {
      setDetails((prev) =>
        prev.map((entry, i) => (i === index ? { ...entry, [field]: val } : entry))
      )
    },
    []
  )

  const handleSubmit = useCallback(async () => {
    if (!contact) return

    try {
      setSubmitting(true)
      setError(null)

      const detailsJson: Record<string, string> = {}
      for (const entry of details) {
        if (entry.key.trim()) {
          detailsJson[entry.key.trim()] = entry.value
        }
      }

      const { error: insertError } = await supabase.from('leads').insert({
        contact_id: contact.id,
        status: status || null,
        policy: policy || null,
        risk_details: riskDetails || null,
        details: Object.keys(detailsJson).length > 0 ? detailsJson : {},
        origin: 'manual',
      })

      if (insertError) throw insertError

      resetForm()
      onOpenChange(false)
      onConverted()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to convert to lead')
    } finally {
      setSubmitting(false)
    }
  }, [contact, status, policy, riskDetails, details, resetForm, onOpenChange, onConverted])

  const contactName =
    [contact?.first_name, contact?.last_name].filter(Boolean).join(' ') ||
    contact?.email ||
    contact?.phone ||
    'this contact'

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Convert to Lead</DialogTitle>
          <DialogDescription>
            Create a lead for <span className="font-medium text-foreground">{contactName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="status" className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((s) => (
                  <SelectItem key={s.id} value={s.name || String(s.id)}>
                    {s.label || s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="policy">Policy</Label>
            <Input
              id="policy"
              placeholder="e.g. Life Insurance, Health Cover"
              value={policy}
              onChange={(e) => setPolicy(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="risk-details">Risk Details</Label>
            <Input
              id="risk-details"
              placeholder="e.g. High risk, pre-existing conditions"
              value={riskDetails}
              onChange={(e) => setRiskDetails(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Additional Details</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={addDetailEntry}
              >
                <Plus className="size-3" />
                Add Field
              </Button>
            </div>
            <div className="space-y-2">
              {details.map((entry, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    placeholder="Field name"
                    value={entry.key}
                    onChange={(e) => updateDetailEntry(index, 'key', e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    placeholder="Value"
                    value={entry.value}
                    onChange={(e) => updateDetailEntry(index, 'value', e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 p-0 text-muted-foreground hover:text-destructive"
                    onClick={() => removeDetailEntry(index)}
                    disabled={details.length === 1}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Converting...' : 'Convert to Lead'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
