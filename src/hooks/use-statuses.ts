import { ALL_CAMPAIGNS } from '@/types/database'
import type { Campaign } from '@/types/database'

// Returns all campaigns (main + pre-call) — used for dropdowns and detail sheet
export function useStatuses() {
  return {
    statuses: ALL_CAMPAIGNS as Campaign[],
    loading: false,
    error: null,
  }
}
