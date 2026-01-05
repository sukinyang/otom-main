import { useAuth0 } from '@auth0/auth0-react'
import { Navigate } from 'react-router-dom'
import { LogIn, Loader2 } from 'lucide-react'

export default function Login() {
  const { loginWithRedirect, isAuthenticated, isLoading } = useAuth0()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Otom</h1>
          <p className="text-slate-600 mt-2">Sign in to access your dashboard</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
          <button
            onClick={() => loginWithRedirect()}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium"
          >
            <LogIn size={20} />
            Sign in with Auth0
          </button>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500">
              Secure authentication powered by Auth0
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-slate-500">
          <p>Need help? Contact <a href="mailto:support@otomhq.com" className="text-slate-900 hover:underline">support@otomhq.com</a></p>
        </div>
      </div>
    </div>
  )
}
