import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

type Mode = 'login' | 'register'

interface AuthFormState {
  email: string
  password: string
}

export default function Auth() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, login, register } = useAuth()
  const [mode, setMode] = useState<Mode>('login')
  const [loginForm, setLoginForm] = useState<AuthFormState>({
    email: '',
    password: '',
  })
  const [registerForm, setRegisterForm] = useState<AuthFormState>({
    email: '',
    password: '',
  })
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showRequirements, setShowRequirements] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const returnState = location.state as
    | { returnTo?: string; readerDraft?: unknown }
    | null
  const returnTo = returnState?.returnTo ?? '/'

  if (user) return <Navigate to={returnTo} replace state={returnState} />

  const form = mode === 'login' ? loginForm : registerForm
  const setForm = mode === 'login' ? setLoginForm : setRegisterForm

  const passwordRequirements = [
    { label: 'At least 8 characters', met: form.password.length >= 8 },
    { label: 'Includes a number or symbol', met: /[\d\W]/.test(form.password) },
  ]
  const passwordsMatch = form.password === confirmPassword
  const registerValid =
    passwordRequirements.every((requirement) => requirement.met) && passwordsMatch

  const updateForm = (changes: Partial<AuthFormState>) => {
    setForm((current) => ({ ...current, ...changes }))
  }

  const handleModeChange = (nextMode: Mode) => {
    setMode(nextMode)
    setError(null)
    setShowPassword(false)
    setShowConfirmPassword(false)
    setShowRequirements(false)
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)

    try {
      if (mode === 'login') await login(form.email, form.password)
      else await register(form.email, form.password)
      navigate(returnTo, { state: returnState })
    } catch (err) {
      setError(
        mode === 'login'
          ? 'Wrong email or password.'
          : err instanceof Error
            ? err.message
            : 'Unknown error',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto px-9 py-9 flex justify-center">
      <div className="w-full max-w-md self-start pt-1">
        <div className="mb-6">
          <h1 className="text-3xl font-bold font-display text-ink-900 mb-1">
            {mode === 'login' ? 'Sign in' : 'Create account'}
          </h1>
          <p className="text-sm text-ink-400">
            {mode === 'login'
              ? 'Access your saved readings and vocabulary.'
              : 'Save readings and build your vocabulary history.'}
          </p>
        </div>

        <div className="bg-white border border-ink-50 rounded-lg p-6 flex flex-col gap-4">
          <div className="flex bg-ink-0 rounded-md p-1">
            {(['login', 'register'] as Mode[]).map((item) => (
              <button
                key={item}
                className={`flex-1 rounded-sm px-3 py-2 text-sm font-medium transition-colors ${
                  mode === item
                    ? 'bg-white text-ink-900'
                    : 'text-ink-400 hover:text-ink-900'
                }`}
                onClick={() => handleModeChange(item)}
              >
                {item === 'login' ? 'Sign in' : 'Register'}
              </button>
            ))}
          </div>

          <label className="flex flex-col gap-1.5 text-sm text-ink-900">
            Email
            <input
              className="border border-ink-50 rounded-md px-3 py-2.5 bg-ink-0 outline-none focus:border-ink-200"
              value={form.email}
              onChange={(event) => updateForm({ email: event.target.value })}
              type="email"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm text-ink-900">
            Password
            <div className="relative">
              <input
                className="w-full border border-ink-50 rounded-md px-3 py-2.5 pr-16 bg-ink-0 outline-none focus:border-ink-200"
                value={form.password}
                onChange={(event) => updateForm({ password: event.target.value })}
                onFocus={() => mode === 'register' && setShowRequirements(true)}
                type={showPassword ? 'text' : 'password'}
              />
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium text-ink-400 hover:text-ink-900"
                onClick={() => setShowPassword((value) => !value)}
                type="button"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </label>

          {mode === 'register' && (
            <>
              <label className="flex flex-col gap-1.5 text-sm text-ink-900">
                Confirm password
                <div className="relative">
                  <input
                    className="w-full border border-ink-50 rounded-md px-3 py-2.5 pr-16 bg-ink-0 outline-none focus:border-ink-200"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    type={showConfirmPassword ? 'text' : 'password'}
                  />
                  <button
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium text-ink-400 hover:text-ink-900"
                    onClick={() => setShowConfirmPassword((value) => !value)}
                    type="button"
                  >
                    {showConfirmPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </label>

              <button
                className="flex items-center justify-between text-xs text-ink-400 hover:text-ink-900"
                onClick={() => setShowRequirements((value) => !value)}
                type="button"
              >
                Password requirements
                <span>{showRequirements ? 'Hide' : 'Show'}</span>
              </button>

              {showRequirements && (
                <div className="bg-ink-0 border border-ink-50 rounded-md px-4 py-3 flex flex-col gap-2">
                  {passwordRequirements.map((requirement) => (
                    <div
                      key={requirement.label}
                      className={`text-xs flex items-center gap-2 ${
                        requirement.met ? 'text-teal-800' : 'text-ink-400'
                      }`}
                    >
                      <span className="w-4">{requirement.met ? '✓' : '○'}</span>
                      {requirement.label}
                    </div>
                  ))}
                  <div
                    className={`text-xs flex items-center gap-2 ${
                      confirmPassword && passwordsMatch ? 'text-teal-800' : 'text-ink-400'
                    }`}
                  >
                    <span className="w-4">
                      {confirmPassword && passwordsMatch ? '✓' : '○'}
                    </span>
                    Passwords match
                  </div>
                </div>
              )}
            </>
          )}

          {error && (
            <div className="px-4 py-3 bg-red-50 text-red-800 rounded-md text-xs">
              {error}
            </div>
          )}

          <button
            className="btn-primary rounded-md px-4 py-2.5 font-semibold text-sm"
            onClick={handleSubmit}
            disabled={
              loading ||
              !form.email ||
              !form.password ||
              (mode === 'register' && !registerValid)
            }
          >
            {loading ? 'Working...' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </div>
      </div>
    </div>
  )
}
