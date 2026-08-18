import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (user) {
    return <Navigate to="/" replace />
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setErrorMessage('')

    if (!email || !password) {
      setErrorMessage('Please input email or password')
      return
    }

    setIsSubmitting(true)
    try {
      await login(email, password)
      navigate('/', { replace: true })
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Login gagal. Coba lagi.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="bg-grid min-h-screen bg-[#F2F2EE] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-[420px] bg-white border-2 border-black outline outline-[3px] outline-[#2563EB] outline-offset-6 p-10">
        <h1 className="text-2xl font-bold tracking-tight">RAKMAN</h1>

        <div className="border-t border-black my-6" />

        <h2 className="font-bold text-4xl">Sign in</h2>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
          <div className="space-y-2">
            <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider">
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@company.com"
              className="w-full border-2 border-black rounded-none px-3 py-3 shadow-[3px_3px_0px_0px_black] placeholder:text-gray-400"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-xs font-bold uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                className="w-full border-2 border-black rounded-none px-3 py-3 pr-14 shadow-[3px_3px_0px_0px_black] placeholder:text-gray-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword((isVisible) => !isVisible)}
                className="absolute inset-y-0 right-0 px-3 text-xs font-bold uppercase tracking-wider"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {errorMessage && (
            <div className="bg-[#FBD5D5] border-2 border-black px-3 py-2 font-mono text-sm font-bold">
              SYS_ALERT: {errorMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#FF5C00] border-2 border-black px-4 py-3 font-bold uppercase tracking-wide shadow-[3px_3px_0px_0px_black] disabled:opacity-50"
          >
            {isSubmitting ? 'Processing...' : 'Secure authentication'}
          </button>
        </form>

        <p className="mt-8 text-xs text-gray-500 font-mono">RAKMAN TERMINAL v1.0</p>
      </div>
    </main>
  )
}

export default Login