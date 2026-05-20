import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { AuthResponse, User } from '../types'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

interface AuthContextValue {
  user: User | null
  accessToken: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  authenticatedFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
}

const AuthContext = createContext<AuthContextValue | null>(null)

async function readError(response: Response) {
  try {
    const data = await response.json()
    if (Array.isArray(data.message)) return data.message.join(', ')
    if (typeof data.message === 'string') return data.message
  } catch {
    // Fall through to the generic status message.
  }

  return `Server error: ${response.status}`
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const refreshPromiseRef = useRef<Promise<AuthResponse | null> | null>(null)

  const applyAuth = useCallback((auth: AuthResponse) => {
    setUser(auth.user)
    setAccessToken(auth.accessToken)
  }, [])

  const refresh = useCallback(async () => {
    if (refreshPromiseRef.current) return refreshPromiseRef.current

    refreshPromiseRef.current = fetch(`${API_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    })
      .then(async (response) => {
        if (!response.ok) return null

        const auth = (await response.json()) as AuthResponse
        applyAuth(auth)
        return auth
      })
      .finally(() => {
        refreshPromiseRef.current = null
      })

    return refreshPromiseRef.current
  }, [applyAuth])

  useEffect(() => {
    const restoreSession = async () => {
      try {
        await refresh()
      } finally {
        setLoading(false)
      }
    }

    void restoreSession()
  }, [refresh])

  const submitCredentials = useCallback(
    async (path: 'login' | 'register', email: string, password: string) => {
      const response = await fetch(`${API_URL}/api/v1/auth/${path}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) throw new Error(await readError(response))

      applyAuth((await response.json()) as AuthResponse)
    },
    [applyAuth],
  )

  const login = useCallback(
    (email: string, password: string) => submitCredentials('login', email, password),
    [submitCredentials],
  )

  const register = useCallback(
    (email: string, password: string) => submitCredentials('register', email, password),
    [submitCredentials],
  )

  const logout = useCallback(async () => {
    await fetch(`${API_URL}/api/v1/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    })
    setUser(null)
    setAccessToken(null)
  }, [])

  const authenticatedFetch = useCallback(
    async (input: RequestInfo | URL, init: RequestInit = {}) => {
      const send = (token: string | null) =>
        fetch(input, {
          ...init,
          credentials: 'include',
          headers: {
            ...init.headers,
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        })

      let response = await send(accessToken)

      if (response.status === 401) {
        const auth = await refresh()
        if (auth) response = await send(auth.accessToken)
      }

      return response
    },
    [accessToken, refresh],
  )

  const value = useMemo(
    () => ({
      user,
      accessToken,
      loading,
      login,
      register,
      logout,
      authenticatedFetch,
    }),
    [user, accessToken, loading, login, register, logout, authenticatedFetch],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
