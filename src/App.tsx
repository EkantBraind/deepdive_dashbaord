import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { ThemeProvider } from '@/components/theme-provider'
import { AuthProvider, useAuthContext } from '@/contexts/auth-context'
import { DateFilterProvider } from '@/contexts/date-filter-context'
import { SearchProvider } from '@/contexts/search-context'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { DashboardPage } from '@/pages/dashboard'

import { LeadsPage } from '@/pages/leads'
import { ConversationsPage } from '@/pages/conversations'
import { SettingsPage } from '@/pages/settings'
import { LoginPage } from '@/pages/login'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuthContext()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <SearchProvider>
                  <DateFilterProvider>
                    <DashboardLayout>
                      <Routes>
                        <Route path="/" element={<DashboardPage />} />

                        <Route path="/leads" element={<LeadsPage />} />
                        <Route path="/conversations" element={<ConversationsPage />} />
                        <Route path="/settings" element={<SettingsPage />} />
                      </Routes>
                    </DashboardLayout>
                  </DateFilterProvider>
                  </SearchProvider>
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
