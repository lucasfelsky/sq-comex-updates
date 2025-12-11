// src/pages/Login.jsx
import React, { useState } from 'react'
import { signInWithEmailAndPassword, setPersistence, browserLocalPersistence, browserSessionPersistence, sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '../firebase'
import { setRememberMe } from '../contexts/AuthContext'
import { useNavigate, Link } from 'react-router-dom'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence)
      setRememberMe(remember)
      await signInWithEmailAndPassword(auth, email.trim(), password)
      // força recarregar o estado de verificação do Firebase
      await auth.currentUser.reload()
      if (!auth.currentUser.emailVerified) {
        navigate('/verify-email')
        return
      }

      navigate('/')
    } catch (err) {
      console.error('login error', err)
      alert('Erro ao entrar: ' + (err.message || err))
    } finally {
      setLoading(false)
    }
  }

  const handleForgot = async () => {
    if (!email) {
      alert('Informe seu e-mail corporativo para receber o link de recuperação.')
      return
    }
    try {
      await sendPasswordResetEmail(auth, email.trim())
      alert('Email de recuperação enviado. Verifique sua caixa de entrada.')
    } catch (err) {
      console.error('forgot password error', err)
      alert('Erro ao enviar email de recuperação: ' + (err.message || err))
    }
  }

  return (
    <div className="login-root">
      <div className="login-bg" />

      <div className="login-center">
        <div className="login-card">
          <div className="login-brand">
            {/* optional: replace by <img src="/assets/logo.png" /> if you have a logo */}
            <h2 className="text-2xl font-bold text-gray-800">SQ COMEX UPDATES</h2>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">E-MAIL CORPORATIVO (@sqquimica.com)</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seunome@sqquimica.com"
                className="w-full input-login"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">SENHA</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="sua senha"
                className="w-full input-login"
                required
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} />
                Lembre de mim
              </label>

              <button type="button" onClick={handleForgot} className="text-sm text-blue-700 hover:underline">
                Esqueci minha senha
              </button>
            </div>

            <button type="submit" className="btn-login w-full" disabled={loading}>
              {loading ? 'Entrando...' : 'ACESSAR SISTEMA'}
            </button>
          </form>

          <div className="mt-4 text-center text-sm">
            <Link to="/register" className="text-blue-700 hover:underline">Criar conta</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
