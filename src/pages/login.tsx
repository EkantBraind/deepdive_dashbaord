import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { useAuthContext } from '@/contexts/auth-context'
import { env } from '@/config/env'
import { Input } from '@/components/ui/input'

export function LoginPage() {
  const { session, loading: authLoading, signIn } = useAuthContext()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: '#f5f7fa' }}>
        <Loader2 className="size-8 animate-spin" style={{ color: '#0A8754' }} />
      </div>
    )
  }

  if (session) {
    return <Navigate to="/" replace />
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await signIn(email, password)
    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Left panel — green brand */}
      <div
        className="hidden lg:flex lg:w-1/2 relative items-center justify-center overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0A8754 0%, #076B43 100%)' }}
      >
        {/* subtle radial highlights */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at top right, rgba(255,255,255,0.08), transparent 60%)' }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at bottom left, rgba(0,0,0,0.06), transparent 60%)' }}
        />

        <div className="relative z-10 px-14 max-w-lg text-center">
          {/* Logo mark */}
          <div className="flex justify-center mb-8">
            <div
              className="flex items-center justify-center rounded-2xl"
              style={{ width: 64, height: 64, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)' }}
            >
              <span style={{ fontSize: 28, fontWeight: 700, color: 'white' }}>
                {env.app.name.charAt(0)}
              </span>
            </div>
          </div>

          <h1 style={{ fontSize: 36, fontWeight: 700, color: 'white', marginBottom: 12 }}>
            {env.app.name}
          </h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.72)', lineHeight: 1.6 }}>
            {env.app.description}
          </p>

          {/* Feature tags */}
          <div className="flex flex-wrap gap-3 justify-center mt-10">
            {['Live Pipeline', 'Conversations'].map((tag) => (
              <span
                key={tag}
                style={{
                  padding: '6px 16px',
                  borderRadius: 20,
                  background: 'rgba(255,255,255,0.15)',
                  color: 'white',
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — login form */}
      <div
        className="flex w-full lg:w-1/2 items-center justify-center p-6 sm:p-12"
        style={{ background: '#ffffff' }}
      >
        <div className="w-full max-w-sm">
          {/* Mobile branding */}
          <div className="flex flex-col items-center mb-8 lg:hidden">
            <div
              className="flex items-center justify-center rounded-2xl mb-3"
              style={{ width: 48, height: 48, background: '#0A8754', color: 'white', fontSize: 20, fontWeight: 700 }}
            >
              {env.app.name.charAt(0)}
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a' }}>{env.app.name}</h1>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h2 style={{ fontSize: 24, fontWeight: 700, color: '#1a1a1a' }}>Welcome back</h2>
            <p className="mt-1" style={{ fontSize: 14, color: '#7a8fa0' }}>
              Sign in to your account to continue
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div
                style={{
                  borderRadius: 10,
                  padding: '10px 14px',
                  fontSize: 13,
                  background: '#fef2f2',
                  color: '#dc2626',
                  border: '1px solid #fecaca',
                }}
              >
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label
                htmlFor="email"
                style={{ fontSize: 13, fontWeight: 500, color: '#5a7a8f', display: 'block' }}
              >
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                autoFocus
                style={{ borderRadius: 10, height: 44, fontSize: 14 }}
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="password"
                style={{ fontSize: 13, fontWeight: 500, color: '#5a7a8f', display: 'block' }}
              >
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  style={{ borderRadius: 10, height: 44, fontSize: 14, paddingRight: 40 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: '#7a8fa0' }}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 transition-colors"
              style={{
                height: 48,
                borderRadius: 12,
                background: loading ? '#7a8fa0' : '#0A8754',
                color: 'white',
                fontSize: 14,
                fontWeight: 600,
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                marginTop: 8,
              }}
              onMouseEnter={(e) => { if (!loading) (e.currentTarget.style.background = '#076B43') }}
              onMouseLeave={(e) => { if (!loading) (e.currentTarget.style.background = '#0A8754') }}
            >
              {loading && <Loader2 className="size-4 animate-spin" />}
              Sign in
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
