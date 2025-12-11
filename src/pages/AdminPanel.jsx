// src/pages/AdminPanel.jsx
import React, { useEffect, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'

export default function AdminPanel() {
  const [users, setUsers] = useState([])

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snap) => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    }, err => console.error(err))
    return () => unsub()
  }, [])

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Painel Admin</h1>

      <div className="card">
        <h3 className="text-lg font-semibold">Usuários cadastrados</h3>
        <div className="mt-3 space-y-2">
          {users.map(u => (
            <div key={u.uid || u.id} className="p-3 border rounded-lg flex items-center justify-between">
              <div>
                <div className="font-medium">{u.name || u.email}</div>
                <div className="text-sm text-muted">{u.email}</div>
              </div>
              <div className="text-sm font-medium">{u.role}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
