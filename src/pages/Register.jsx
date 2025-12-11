// src/pages/Register.jsx
import React, { useEffect, useRef, useState } from 'react'
import { auth, db } from '../firebase'
import {
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification
} from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { useNavigate } from 'react-router-dom'

const POLL_INTERVAL_SEC = 5

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  // modal
  const [showVerifyModal, setShowVerifyModal] = useState(false)
  const [verifySending, setVerifySending] = useState(false)
  const [verifyError, setVerifyError] = useState(null)
  const [lastSentAt, setLastSentAt] = useState(null)
  // polling countdown
  const [countdown, setCountdown] = useState(POLL_INTERVAL_SEC)
  const countdownRef = useRef(null)
  const navigatingRef = useRef(false)

  const navigate = useNavigate()

  useEffect(() => {
    return () => stopCountdown()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function startCountdown() {
    stopCountdown()
    setCountdown(POLL_INTERVAL_SEC)
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          checkEmailVerifiedNow()
          return POLL_INTERVAL_SEC
        }
        return prev - 1
      })
    }, 1000)
  }

  function stopCountdown() {
    if (countdownRef.current) {
      clearInterval(countdownRef.current)
      countdownRef.current = null
    }
  }

  async function checkEmailVerifiedNow() {
    try {
      const user = auth.currentUser
      if (!user) {
        console.log('[checkEmail] no currentUser')
        return
      }
      await user.reload()
      const u = auth.currentUser
      console.log('[checkEmail] reloaded user, emailVerified=', u?.emailVerified)
      if (u && u.emailVerified) {
        if (navigatingRef.current) return
        navigatingRef.current = true
        try {
          await setDoc(doc(db, 'users', u.uid), { emailVerified: true, updatedAt: serverTimestamp() }, { merge: true })
        } catch (e) {
          console.warn('[checkEmail] failed to set users/{uid} emailVerified', e)
        }
        stopCountdown()
        setShowVerifyModal(false)
        navigate('/')
      }
    } catch (err) {
      console.error('[checkEmail] error', err)
    }
  }

  async function trySendVerification(userParam) {
    setVerifyError(null)
    setVerifySending(true)
    try {
      const target = userParam || auth.currentUser
      if (!target) throw new Error('Usuário não encontrado para envio de verificação.')
      console.log('[sendEmail] sending to', target.uid || '(unknown uid)')
      await sendEmailVerification(target)
      setLastSentAt(new Date())
      setVerifySending(false)
      console.log('[sendEmail] sent successfully')
      return { ok: true }
    } catch (err) {
      console.error('[sendEmail] failed:', err)
      setVerifyError(err?.message || String(err))
      setVerifySending(false)
      return { ok: false, err }
    }
  }

  // MAIN: register handler
  const handleRegister = async (e) => {
    e.preventDefault()
    console.log('[register] start', { name, email })
    if (!email.endsWith('@sqquimica.com')) {
      alert('Use seu e-mail corporativo @sqquimica.com')
      return
    }
    if (!name.trim()) {
      alert('Informe seu nome completo')
      return
    }

    setLoading(true)
    setVerifyError(null)
    try {
      // create user
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password)
      const user = userCredential.user
      console.log('[register] created user', user.uid, user.email)

      // updateProfile
      try {
        await updateProfile(user, { displayName: name })
      } catch (upErr) {
        console.warn('[register] updateProfile failed', upErr)
      }

      // write firestore user doc
      try {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          name,
          role: 'user',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          emailVerified: false
        })
        console.log('[register] users doc created')
      } catch (fsErr) {
        console.warn('[register] failed to write users doc', fsErr)
      }

      // try send verification using the returned user first
      let res = await trySendVerification(user)
      // if failed and auth.currentUser differs, try using auth.currentUser as fallback
      if (!res.ok) {
        console.log('[register] first send failed, trying fallback with auth.currentUser')
        res = await trySendVerification()
      }

      // show modal regardless so user sees next steps
      setShowVerifyModal(true)

      if (res.ok) {
        // refresh and start polling
        try {
          await (auth.currentUser ? auth.currentUser.reload() : Promise.resolve())
        } catch (reloadErr) {
          console.warn('[register] reload failed', reloadErr)
        }
        startCountdown()
      } else {
        // send failed: keep modal open and show error; do NOT start polling
        console.warn('[register] verification not sent, user must click reenviar')
      }

      console.log('[register] done flow')
    } catch (err) {
      console.error('[register] main error', err)
      alert('Erro ao cadastrar: ' + (err.message || err))
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setVerifyError(null)
    setVerifySending(true)
    try {
      const res = await trySendVerification()
      if (res.ok) {
        startCountdown()
      }
    } finally {
      setVerifySending(false)
    }
  }

  const handleGotoLogin = () => {
    stopCountdown()
    setShowVerifyModal(false)
    navigate('/login')
  }

  // dev helper: open modal (for manual testing)
  const devOpenModal = () => setShowVerifyModal(true)

  return (
    <div className="login-root">
      <div className="login-bg" />

      <div className="login-center">
        <div className="login-card">
          <div className="login-brand">
            <h2 className="text-2xl font-bold text-gray-800">Criar Conta</h2>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">NOME COMPLETO</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome completo" className="w-full input-login" required />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">E-MAIL CORPORATIVO (@sqquimica.com)</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seunome@sqquimica.com" className="w-full input-login" required />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">SENHA</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Crie uma senha segura" className="w-full input-login" required />
            </div>

            <button type="submit" className="btn-login w-full" disabled={loading}>
              {loading ? 'Registrando...' : 'CRIAR CONTA'}
            </button>
          </form>

          <div className="mt-4 text-center text-sm">
            <button onClick={() => navigate('/login')} className="text-blue-700 hover:underline">Já tenho conta</button>
            {/* dev helper */}
            <button onClick={devOpenModal} className="ml-3 text-sm text-gray-500">[abrir modal]</button>
          </div>
        </div>
      </div>

      {showVerifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black opacity-40" />
          <div className="bg-white rounded-xl shadow-xl z-60 w-full max-w-lg p-6 mx-4">
            <h3 className="text-lg font-semibold mb-2">Verifique seu e-mail</h3>
            <p className="text-sm text-gray-700 mb-3">Enviamos um e-mail de verificação para <strong>{email}</strong>. Abra sua caixa de entrada e clique no link de verificação para ativar sua conta.</p>

            {lastSentAt && <div className="text-xs text-gray-500 mb-3">Último envio: {lastSentAt.toLocaleString()}</div>}
            {verifyError && <div className="text-sm text-red-600 mb-2">Erro ao enviar: {verifyError}</div>}

            <div className="flex items-center gap-3">
              <button onClick={handleResend} disabled={verifySending} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
                {verifySending ? 'Enviando...' : 'Reenviar e-mail'}
              </button>

              <button onClick={handleGotoLogin} className="px-4 py-2 border rounded-lg">Ir para Login</button>

              <button onClick={() => { stopCountdown(); setShowVerifyModal(false) }} className="ml-auto text-sm text-gray-600">Fechar</button>
            </div>

            <div className="mt-4 flex items-center gap-3 text-sm text-gray-600">
              <div className="spinner-small" aria-hidden="true" />
              <div>Verificando automaticamente... próximo check em <strong>{countdown}s</strong></div>
            </div>

            <div className="text-xs text-gray-400 mt-3">Se não receber o e-mail, verifique o spam ou peça para reenviar.</div>
          </div>
        </div>
      )}
    </div>
  )
}
