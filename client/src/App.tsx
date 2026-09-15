import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { ThemeProvider } from '@/context/ThemeContext'
import { ThemeRipple } from '@/components/ui/ThemeRipple'
import { Layout } from '@/components/layout/Layout'
import { DashboardPage } from '@/pages/DashboardPage'
import { TemplatesPage } from '@/pages/TemplatesPage'
import { CampaignsListPage } from '@/pages/CampaignsListPage'
import { CampaignPage } from '@/pages/CampaignPage'
import { CampaignDetailPage } from '@/pages/CampaignDetailPage'
import { ContactsPage } from '@/pages/ContactsPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { OAuthCallbackPage } from '@/pages/OAuthCallbackPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5_000,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ThemeRipple />
        <BrowserRouter>
          <Routes>
            {/* OAuth callback — outside layout (full-screen) */}
            <Route path="/auth/callback" element={<OAuthCallbackPage />} />

            {/* Main app — with sidebar layout */}
            <Route path="/*" element={
              <Layout>
                <Routes>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/templates" element={<TemplatesPage />} />
                  <Route path="/campaigns" element={<CampaignsListPage />} />
                  <Route path="/campaigns/new" element={<CampaignPage />} />
                  <Route path="/campaigns/:id" element={<CampaignDetailPage />} />
                  <Route path="/contacts" element={<ContactsPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Layout>
            } />
          </Routes>
        </BrowserRouter>

        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 3000,
            style: {
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: '14px',
              borderRadius: '8px',
            },
          }}
        />
      </ThemeProvider>
    </QueryClientProvider>
  )
}
