// src/components/Header.jsx
import React, { useContext } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { AuthContext } from '../contexts/AuthContext'
import { BellIcon } from '@heroicons/react/24/outline'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'

export default function Header() {
  const { user, userProfile } = useContext(AuthContext)

  if (!user || !user.emailVerified) return null
  
  const location = useLocation()
  const navigate = useNavigate()

  // show Login/Register only when not on login page
  const isLoginPage = location.pathname === '/login' || location.pathname === '/register'
  const nameToShow = (userProfile && userProfile.name) || (user && user.displayName) || (user && user.email) || 'Usuário'

  const navClass = ({ isActive }) =>
    isActive ? 'header-link-active' : 'px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100'

  const handleLogoClick = (e) => {
    e.preventDefault()
    // go to home always (Home is protected; ProtectedRoute redirect will handle unauthenticated)
    navigate('/')
  }

  const handleLogout = async () => {
    try {
      await signOut(auth)
      navigate('/login')
    } catch (err) {
      console.error('Erro ao deslogar', err)
      alert('Erro ao deslogar: ' + (err.message || err))
    }
  }

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <div className="flex items-center gap-6">
          <a href="/" onClick={handleLogoClick} className="text-xl font-bold text-primary-600">SQ COMEX UPDATES</a>

          <nav className="flex items-center gap-2">
            <NavLink to="/" className={navClass}>Página Inicial</NavLink>
            <NavLink to="/processes" className={navClass}>Processos</NavLink>
            <NavLink to="/admin" className={navClass}>Admin</NavLink>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <button className="p-2 rounded-full hover:bg-gray-100"><BellIcon className="w-5 h-5 text-gray-600" /></button>
              <div className="text-sm text-gray-700">{nameToShow}</div>
              <button onClick={handleLogout} className="ml-3 px-3 py-1 border rounded">Logout</button>
            </>
          ) : (
            !isLoginPage && (
              <div className="flex items-center gap-2">
                <NavLink to="/login" className="text-sm text-gray-700 hover:text-primary-600">Login</NavLink>
                <NavLink to="/register" className="text-sm text-primary-600 font-medium">Cadastrar</NavLink>
              </div>
            )
          )}
        </div>
      </div>
    </header>
  )
}
