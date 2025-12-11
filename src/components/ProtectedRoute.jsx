// src/components/ProtectedRoute.jsx
import React, { useContext } from 'react'
import { Navigate } from 'react-router-dom'
import { AuthContext } from '../contexts/AuthContext'

export default function ProtectedRoute({ children }) {
  const { user } = useContext(AuthContext)

  // 1) usuário não logado → manda para login
  if (!user) return <Navigate to="/login" replace />

  // 2) usuário logado, mas NÃO verificado → só deixa ir para /verify-email
  if (!user.emailVerified) {
    return <Navigate to="/verify-email" replace />
  }

  // 3) usuário logado + email verificado → OK
  return children
}
