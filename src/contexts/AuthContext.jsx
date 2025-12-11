// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react'
import { auth, db } from '../firebase'
import {
  onAuthStateChanged,
  signOut,
  reload
} from 'firebase/auth'
import {
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  serverTimestamp
} from 'firebase/firestore'

export const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [name, setName] = useState(null)
  const [loading, setLoading] = useState(true)
  const [profileLoaded, setProfileLoaded] = useState(false)

  useEffect(() => {
    // Observa mudanças de autenticação
    const unsub = onAuthStateChanged(auth, async (usr) => {
      setUser(usr)
      setProfileLoaded(false)

      if (!usr) {
        // reset state
        setRole(null)
        setName(null)
        setLoading(false)
        return
      }

      // garantir que o objeto user está atualizado (emailVerified, etc)
      try {
        await reload(usr)
      } catch {}

      // Carregar dados do Firestore
      await loadUserProfile(usr.uid)

      setLoading(false)
    })

    return unsub
  }, [])

  /**
   * Carrega documento users/{uid} e configura listener real-time
   */
  const loadUserProfile = async (uid) => {
    const ref = doc(db, 'users', uid)

    // caso o documento não exista, cria automaticamente (usuário novo)
    let snap = await getDoc(ref)
    if (!snap.exists()) {
      await setDoc(ref, {
        uid,
        email: auth.currentUser?.email || null,
        name: auth.currentUser?.displayName || null,
        role: 'user',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      snap = await getDoc(ref)
    }

    // carregar primeira vez
    const data = snap.data()
    setName(data.name || auth.currentUser?.displayName || auth.currentUser?.email)
    setRole(data.role || 'user')
    setProfileLoaded(true)

    // listener realtime (admin pode mudar role no painel e atualizar automaticamente no cliente)
    return onSnapshot(ref, (ds) => {
      const d = ds.data()
      setName(d?.name || null)
      setRole(d?.role || null)
    })
  }

  /**
   * Força reload manual do user auth + profile
   */
  const refreshUser = async () => {
    if (auth.currentUser) {
      await reload(auth.currentUser)
      await loadUserProfile(auth.currentUser.uid)
    }
  }

  /**
   * Logout global
   */
  const logout = async () => {
    await signOut(auth)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        name,
        loading: loading || !profileLoaded,
        refreshUser,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuthContext = () => useContext(AuthContext)
