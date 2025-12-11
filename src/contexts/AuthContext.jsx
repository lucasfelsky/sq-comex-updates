// src/contexts/AuthContext.jsx
import React, { createContext, useEffect, useState } from 'react'
import { onAuthStateChanged, setPersistence, browserLocalPersistence, browserSessionPersistence } from 'firebase/auth'
import { auth, db } from '../firebase'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'

export const AuthContext = createContext()

// Remember-me global preference (applied at login time by Login.jsx)
let globalRemember = false
export function setRememberMe(value) {
  globalRemember = !!value
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null) // firebase user
  const [userProfile, setUserProfile] = useState(null) // firestore users/{uid}
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        await u.reload() // <– força atualização do estado do Firebase
      }
      setUser(u)
      setLoading(false)

      // If logged, ensure users/{uid} doc exists and load it into userProfile
      if (u) {
        try {
          const uref = doc(db, 'users', u.uid)
          const snap = await getDoc(uref)
          if (!snap.exists()) {
            // create default profile
            await setDoc(uref, {
              uid: u.uid,
              email: u.email || null,
              role: 'user',
              name: u.displayName || null,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            })
            setUserProfile({ uid: u.uid, email: u.email, role: 'user', name: u.displayName || null })
          } else {
            setUserProfile(snap.data())
          }

          if (u.emailVerified) {
            try {
              await setDoc(uref, { emailVerified: true, updatedAt: serverTimestamp() }, { merge: true })
            } catch(e) { console.error('err update users emailVerified', e) }
          }
        } catch (e) {
          console.error('Erro ao garantir users/{uid}:', e)
        }
      } else {
        setUserProfile(null)
      }
    })

    return () => unsub()
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, userProfile }}>
      {children}
    </AuthContext.Provider>
  )
}
