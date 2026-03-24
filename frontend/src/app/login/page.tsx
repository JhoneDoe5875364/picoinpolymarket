'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase-browser'

export default function Login() {
  const [email, setEmail] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function send() {
    setBusy(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin }
    })
    setBusy(false)
    setMsg(error ? `Error: ${error.message}` : 'Magic link sent. Check your email.')
  }

  return (
    <div className="max-w-md mx-auto p-8">
      <h1 className="text-2xl font-semibold mb-4">Log in</h1>
      <p className="text-sm mb-4 opacity-80">Enter your email to receive a sign-in link.</p>
      <input
        className="w-full rounded border border-white/10 bg-white/5 p-2 mb-3"
        placeholder="you@example.com"
        value={email}
        onChange={(e)=>setEmail(e.target.value)}
        type="email"
      />
      <button
        className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
        onClick={send}
        disabled={!email || busy}
      >
        {busy ? 'Sending…' : 'Send magic link'}
      </button>
      {msg && <p className="mt-3">{msg}</p>}
    </div>
  )
}
