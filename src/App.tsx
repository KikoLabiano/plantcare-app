import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ContainerProvider } from '@/di/container'
import { useAuthStore } from '@/ui/stores/authStore'
import { BottomNav } from '@/ui/components/shared/BottomNav/BottomNav'
import { LoginPage } from '@/ui/pages/LoginPage/LoginPage'
import { DashboardPage } from '@/ui/pages/DashboardPage/DashboardPage'
import { PlantDetailPage } from '@/ui/pages/PlantDetailPage/PlantDetailPage'
import { AddPlantPage } from '@/ui/pages/AddPlantPage/AddPlantPage'
import { IdentifyPage } from '@/ui/pages/IdentifyPage/IdentifyPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
})

function AuthGuard() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return (
    <>
      <Outlet />
      <BottomNav />
    </>
  )
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ContainerProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route element={<AuthGuard />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/plants" element={<DashboardPage />} />
              <Route path="/plants/:id" element={<PlantDetailPage />} />
              <Route path="/add" element={<AddPlantPage />} />
              <Route path="/identify" element={<IdentifyPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ContainerProvider>
    </QueryClientProvider>
  )
}
