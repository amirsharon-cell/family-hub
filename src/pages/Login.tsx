import { signIn } from '../lib/google'

export default function Login() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm text-center">
        <div className="text-6xl mb-4">🏠</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Family Hub</h1>
        <p className="text-gray-500 text-sm mb-8">
          Shared calendar &amp; resources for your family
        </p>

        <button
          onClick={signIn}
          className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors"
        >
          <GoogleLogo />
          Sign in with Google
        </button>

        <p className="mt-6 text-xs text-gray-400">
          Family Hub uses Google Calendar to store your events.
          No data is stored outside of your Google account.
        </p>
      </div>
    </div>
  )
}

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.859-3.048.859-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
      <path fill="#FBBC05" d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z"/>
    </svg>
  )
}
