// src/App.jsx
import React, { useContext } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

import { AuthProvider, AuthContext } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

// components
import Header from './components/Header'

// pages
import Login from './pages/Login'
import Register from './pages/Register'
import VerifyEmail from './pages/VerifyEmail'
import Dashboard from './pages/Dashboard'
import Processes from './pages/Processes'
import ProcessDetail from './pages/ProcessDetail'
import AdminPanel from './pages/AdminPanel'
import Home from './pages/Home'

function Layout({ children }) {
  const { user } = useContext(AuthContext)

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Só mostra o header se o usuário estiver logado */}
      {user && <Header />}

      <main className="max-w-7xl mx-auto p-6">
        {children}
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Layout>
        <Routes>

          {/* ROTAS PÚBLICAS */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />

          {/* ROTAS PRIVADAS */}
          <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/processes" element={<ProtectedRoute><Processes /></ProtectedRoute>} />
          <Route path="/processes/:id" element={<ProtectedRoute><ProcessDetail /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />

          {/* fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Layout>
    </AuthProvider>
  )
}
