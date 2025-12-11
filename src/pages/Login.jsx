// src/pages/Login.jsx
import React, { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import { auth } from '../firebase'
import {
  signInWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  sendPasswordResetEmail
} from 'firebase/auth'

export default function Login() {
  const { user, loading } = useAuth() || {}
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    // if already logged and verified, redirect automatically
    if (!loading && user && user.emailVerified) {
      navigate('/', { replace: true })
    }
  }, [user, loading, navigate])

  if (!loading && user && user.emailVerified) {
    return <Navigate to="/" replace />
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setSubmitting(true)
      await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence)
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password)
      if (cred.user.emailVerified) {
        navigate('/', { replace: true })
      } else {
        navigate('/verify-email', { replace: true })
      }
    } catch (err) {
      console.error('[login] error', err)
      alert('Erro ao entrar: ' + (err.message || err))
    } finally {
      setSubmitting(false)
    }
  }

  const handleForgot = async () => {
    if (!email) {
      alert('Informe seu email corporativo para recuperar a senha.')
      return
    }
    try {
      await sendPasswordResetEmail(auth, email.trim())
      alert('Email de recuperação enviado (verifique sua caixa de entrada).')
    } catch (err) {
      console.error('forgot password error', err)
      alert('Erro ao enviar email de recuperação: ' + (err.message || err))
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="w-full max-w-md bg-white/95 rounded-lg shadow p-8">
        <h2 className="text-2xl font-bold text-center mb-4">SQ COMEX UPDATES</h2>

        <form onSubmit={handleSubmit}>
          <label className="text-xs font-semibold">E-MAIL CORPORATIVO (@sqquimica.com)</label>
          <input className="w-full p-2 border rounded mt-1 mb-3" value={email} onChange={e => setEmail(e.target.value)} placeholder="seunome@sqquimica.com" />

          <label className="text-xs font-semibold">SENHA</label>
          <input type="password" className="w-full p-2 border rounded mt-1 mb-2" value={password} onChange={e => setPassword(e.target.value)} placeholder="sua senha" />

          <div className="flex items-center justify-between mb-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} />
              Lembre de mim
            </label>
            <button type="button" onClick={handleForgot} className="text-sm underline">Esqueci minha senha</button>
          </div>

          <button type="submit" disabled={submitting} className="w-full bg-slate-900 text-white py-2 rounded">
            {submitting ? 'Entrando...' : 'ACESSAR SISTEMA'}
          </button>
        </form>

        <div className="text-center mt-4">
          <a href="/register" className="text-sm underline">Criar conta</a>
        </div>
      </div>
    </div>
  )
}
