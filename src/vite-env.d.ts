/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_APP_NAME: string
  readonly VITE_APP_DESCRIPTION: string
  readonly VITE_CLIENT_ID: string
  readonly VITE_CLIENT_THEME: string
  readonly VITE_ACCENT_COLOR: string
  readonly VITE_ENABLE_ANALYTICS: string
  readonly VITE_ENABLE_NOTIFICATIONS: string
  readonly VITE_OUTREACH_MODAL: string
  readonly VITE_CHATBOT_MODAL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}