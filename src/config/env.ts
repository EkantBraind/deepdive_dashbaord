const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = import.meta.env[key] ?? defaultValue
  if (value === undefined) {
    throw new Error(`Missing environment variable: ${key}`)
  }
  return value
}

const getBoolEnvVar = (key: string, defaultValue: boolean): boolean => {
  const value = import.meta.env[key]
  if (value === undefined) return defaultValue
  return value === 'true'
}

export type DashboardMode = 'default' | 'outreach' | 'combined'

const outreachModal = getBoolEnvVar('VITE_OUTREACH_MODAL', false)
const chatbotModal = getBoolEnvVar('VITE_CHATBOT_MODAL', false)

const dashboardMode: DashboardMode =
  outreachModal && chatbotModal ? 'combined' :
  outreachModal ? 'outreach' :
  'default'

export const env = {
  // Supabase
  supabase: {
    url: getEnvVar('VITE_SUPABASE_URL'),
    anonKey: getEnvVar('VITE_SUPABASE_ANON_KEY'),
  },

  // App
  app: {
    name: getEnvVar('VITE_APP_NAME', 'InsureAI Dashboard'),
    description: getEnvVar('VITE_APP_DESCRIPTION', 'AI-Powered Insurance Dashboard'),
  },

  // Client (multi-tenant)
  client: {
    id: getEnvVar('VITE_CLIENT_ID', 'default'),
    theme: getEnvVar('VITE_CLIENT_THEME', 'default'),
    accentColor: getEnvVar('VITE_ACCENT_COLOR', '0.546 0.245 262.881'),
  },

  // Feature Flags
  features: {
    analytics: getBoolEnvVar('VITE_ENABLE_ANALYTICS', true),
    notifications: getBoolEnvVar('VITE_ENABLE_NOTIFICATIONS', true),
    outreachModal,
    chatbotModal,
  },

  // Derived mode
  dashboardMode,

  // Environment
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
} as const

export type Env = typeof env
