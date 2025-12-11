// src/hooks/useAuth.js
import { useContext } from 'react'
import { AuthContext } from '../contexts/AuthContext'

// hook principal (default)
export default function useAuth() {
  return useContext(AuthContext)
}

// named export (compatibilidade)
export { useAuth }
