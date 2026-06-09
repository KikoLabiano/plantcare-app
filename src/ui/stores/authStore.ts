import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const PIN = import.meta.env.VITE_HOME_PIN ?? '1234'

interface AuthState {
  isAuthenticated: boolean
  login: (pin: string) => boolean
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      login: (pin: string) => {
        if (pin === PIN) {
          set({ isAuthenticated: true })
          return true
        }
        return false
      },
      logout: () => set({ isAuthenticated: false }),
    }),
    {
      name: 'plantcare-auth',
      // Expire after 30 days by storing a timestamp
      partialize: (state) => ({ isAuthenticated: state.isAuthenticated }),
    },
  ),
)
