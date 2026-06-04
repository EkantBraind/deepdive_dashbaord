export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      leads: {
        Row: {
          id: string
          email: string | null
          phone: string | null
          first_name: string | null
          last_name: string | null
          intent: string | null
          source: string | null
          campaign: string | null
          mailchimp_id: string | null
          estate_over_1_5m: boolean | null
          uk_taxpayer: boolean | null
          interest_area: string | null
          booked: boolean | null
          opted_out: boolean | null
          tag: string | null
          status: string | null
          created_at: string | null
          updated_at: string | null
          calendly_identifier: string | null
          call_scheduled_at: string | null
          meeting_link: string | null
          number_of_calls: number | null
          notes: string | null
        }
        Insert: {
          id?: string
          email?: string | null
          phone?: string | null
          first_name?: string | null
          last_name?: string | null
          intent?: string | null
          source?: string | null
          campaign?: string | null
          mailchimp_id?: string | null
          estate_over_1_5m?: boolean | null
          uk_taxpayer?: boolean | null
          interest_area?: string | null
          booked?: boolean | null
          opted_out?: boolean | null
          tag?: string | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
          calendly_identifier?: string | null
          call_scheduled_at?: string | null
          meeting_link?: string | null
          number_of_calls?: number | null
          notes?: string | null
        }
        Update: {
          id?: string
          email?: string | null
          phone?: string | null
          first_name?: string | null
          last_name?: string | null
          intent?: string | null
          source?: string | null
          campaign?: string | null
          mailchimp_id?: string | null
          estate_over_1_5m?: boolean | null
          uk_taxpayer?: boolean | null
          interest_area?: string | null
          booked?: boolean | null
          opted_out?: boolean | null
          tag?: string | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
          calendly_identifier?: string | null
          call_scheduled_at?: string | null
          meeting_link?: string | null
          number_of_calls?: number | null
          notes?: string | null
        }
      }
      conversations: {
        Row: {
          id: number
          session_id: string | null
          message: Json
          created_at: string | null
        }
        Insert: {
          id?: number
          session_id?: string | null
          message: Json
          created_at?: string | null
        }
        Update: {
          id?: number
          session_id?: string | null
          message?: Json
          created_at?: string | null
        }
      }
      campaign_steps: {
        Row: {
          id: string
          campaign: string
          day_number: number
          template_name: string
          template_params: Json | null
          active: boolean | null
          created_at: string | null
          message_body: string | null
          button_type: string | null
          button_text: string | null
          button_url: string | null
        }
        Insert: {
          id?: string
          campaign: string
          day_number: number
          template_name: string
          template_params?: Json | null
          active?: boolean | null
          created_at?: string | null
          message_body?: string | null
          button_type?: string | null
          button_text?: string | null
          button_url?: string | null
        }
        Update: {
          id?: string
          campaign?: string
          day_number?: number
          template_name?: string
          template_params?: Json | null
          active?: boolean | null
          created_at?: string | null
          message_body?: string | null
          button_type?: string | null
          button_text?: string | null
          button_url?: string | null
        }
      }
      lead_campaign_enrollments: {
        Row: {
          id: string
          lead_id: string
          campaign: string
          enrolled_at: string | null
          status: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          lead_id: string
          campaign: string
          enrolled_at?: string | null
          status?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          lead_id?: string
          campaign?: string
          enrolled_at?: string | null
          status?: string | null
          created_at?: string | null
        }
      }
      whatsapp_message_log: {
        Row: {
          id: string
          lead_id: string
          campaign: string
          day_number: number
          template_name: string
          status: string | null
          provider_response: Json | null
          sent_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          lead_id: string
          campaign: string
          day_number: number
          template_name: string
          status?: string | null
          provider_response?: Json | null
          sent_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          lead_id?: string
          campaign?: string
          day_number?: number
          template_name?: string
          status?: string | null
          provider_response?: Json | null
          sent_at?: string | null
          created_at?: string | null
        }
      }
      whatsapp_scheduled_sends: {
        Row: {
          id: string
          lead_id: string
          campaign: string
          template_name: string | null
          template_params: Json | null
          message_body: string | null
          button_type: string | null
          button_text: string | null
          button_url: string | null
          scheduled_at: string
          status: string | null
          sent_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          lead_id: string
          campaign: string
          template_name?: string | null
          template_params?: Json | null
          message_body?: string | null
          button_type?: string | null
          button_text?: string | null
          button_url?: string | null
          scheduled_at: string
          status?: string | null
          sent_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          lead_id?: string
          campaign?: string
          template_name?: string | null
          template_params?: Json | null
          message_body?: string | null
          button_type?: string | null
          button_text?: string | null
          button_url?: string | null
          scheduled_at?: string
          status?: string | null
          sent_at?: string | null
          created_at?: string | null
        }
      }
    }
    Views: {
      [key: string]: {
        Row: Record<string, unknown>
      }
    }
    Functions: {
      [key: string]: {
        Args: Record<string, unknown>
        Returns: unknown
      }
    }
    Enums: {
      [key: string]: string
    }
  }
}

export type Lead = Database['public']['Tables']['leads']['Row']
export type LeadInsert = Database['public']['Tables']['leads']['Insert']
export type LeadUpdate = Database['public']['Tables']['leads']['Update']

// Alias kept so existing component props compile without changes
export type LeadWithContact = Lead

export type Conversation = Database['public']['Tables']['conversations']['Row']

export interface Campaign {
  name: string
  label: string
  colour: string
  filter?: (lead: Lead) => boolean
}

export const CAMPAIGN_CONFIG: Record<string, { label: string; colour: string }> = {
  need_to_call:      { label: 'Awaiting Contact',      colour: '#3b82f6' },
  welcome:           { label: 'Ivy Outreach',            colour: '#10b981' },
  not_right_now:     { label: 'Not Right Now',      colour: '#6b7280' },
  reactivation:      { label: 'Follow Up',       colour: '#ef4444' },
  pre_call_same_day: { label: 'Pre-Call (Same Day)', colour: '#f97316' },
  pre_call_2_4:      { label: 'Pre-Call (2-4)',     colour: '#f59e0b' },
  pre_call_5_plus:   { label: 'Pre-Call (5+)',      colour: '#8b5cf6' },
}

export const CAMPAIGNS: Campaign[] = [
  {
    name: 'welcome_ntc', label: 'Awaiting Contact', colour: '#3b82f6',
    filter: (l: Lead) => l.campaign === 'welcome' && (l.number_of_calls ?? 0) === 0,
  },
  {
    name: 'welcome_cna1', label: 'Call Not Answered - 1', colour: '#f97316',
    filter: (l: Lead) => l.campaign === 'welcome' && (l.number_of_calls ?? 0) === 1,
  },
  {
    name: 'welcome_cna2', label: 'Call Not Answered - 2', colour: '#f59e0b',
    filter: (l: Lead) => l.campaign === 'welcome' && (l.number_of_calls ?? 0) === 2,
  },
  {
    name: 'welcome_cna3', label: 'Call Not Answered - 3', colour: '#ef4444',
    filter: (l: Lead) => l.campaign === 'welcome' && (l.number_of_calls ?? 0) === 3,
  },
  {
    name: 'welcome', label: 'Ivy Outreach', colour: '#10b981',
    filter: (l: Lead) => l.campaign === 'welcome' && (l.number_of_calls ?? 0) >= 4,
  },
  { name: 'not_right_now', label: 'Not Right Now', colour: '#6b7280' },
  { name: 'reactivation',  label: 'Follow Up',     colour: '#ef4444' },
]

export const PRECALL_CAMPAIGNS: Campaign[] = [
  { name: 'pre_call_same_day', label: 'Pre-Call (Same Day)', colour: '#f97316' },
  { name: 'pre_call_2_4',      label: 'Pre-Call (2-4)',      colour: '#f59e0b' },
  { name: 'pre_call_5_plus',   label: 'Pre-Call (5+)',       colour: '#8b5cf6' },
]

export const ALL_CAMPAIGNS: Campaign[] = [...CAMPAIGNS, ...PRECALL_CAMPAIGNS]

// Legacy stub types — contacts/sessions tables don't exist in the DeepDive DB
// but are still referenced by the conversations/contacts pages
export interface Contact {
  id: string
  phone: string | null
  email: string | null
  first_name: string | null
  last_name: string | null
  origin: string | null
  created_at: string | null
}

export interface Session {
  id: string
  session_id: string
  created_at: string | null
  origin: string | null
}

export interface LeadGenerationLog {
  id: string
  session_id: string | null
  lead_id: string | null
  summary: string | null
  processed_until: number | null
  created_at: string | null
}

export type Status = Campaign

export interface ToolCall {
  id: string
  name: string
  args?: Record<string, unknown>
  type?: string
}

export interface ConversationMessage {
  type: 'human' | 'ai' | 'tool'
  content: string
  name?: string
  tool_calls?: ToolCall[]
  tool_call_id?: string
}
