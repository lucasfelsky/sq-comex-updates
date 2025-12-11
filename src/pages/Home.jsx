// src/pages/Home.jsx
import React, { useEffect, useState } from 'react'
import { db } from '../firebase'
import { doc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore'
import useAuth from '../hooks/useAuth' // robusto: importa o default hook

export default function Home() {
  const auth = useAuth() || {}
  // compute role robustly (supports multiple shapes)
  const role = auth.role || auth.userProfile?.role || null

  const [annText, setAnnText] = useState('')
  const [annError, setAnnError] = useState(null)
  const [editing, setEditing] = useState(false)

  const [barra, setBarra] = useState(null)
  const [barraError, setBarraError] = useState(null)

  const [processes, setProcesses] = useState([])
  const [processesError, setProcessesError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function loadAll() {
      setLoading(true)
      await Promise.allSettled([loadAnnouncements(), loadBarra(), loadUpcomingProcesses()])
      if (mounted) setLoading(false)
    }
    loadAll()
    return () => { mounted = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ANNOUNCEMENTS
  const loadAnnouncements = async () => {
    try {
      setAnnError(null)
      const snap = await getDoc(doc(db, 'announcements', 'home'))
      if (snap.exists()) {
        setAnnText(snap.data().text || '')
      } else {
        setAnnText('')
      }
    } catch (err) {
      console.error('loadAnnouncements error', err)
      setAnnError(err)
      setAnnText('')
    }
  }

  const saveAnnouncements = async () => {
    try {
      await updateDoc(doc(db, 'announcements', 'home'), { text: annText })
      setEditing(false)
      // optimistic reload
      await loadAnnouncements()
    } catch (err) {
      console.error('saveAnnouncements error', err)
      // user-friendly message
      if (err?.code === 'permission-denied') {
        alert('Você não tem permissão para editar os avisos. Apenas administradores/comex podem editar.')
      } else {
        alert('Erro ao salvar aviso: ' + (err?.message || String(err)))
      }
    }
  }

  // BARRA
  const loadBarra = async () => {
    try {
      setBarraError(null)
      const snap = await getDoc(doc(db, 'barra', 'status'))
      if (snap.exists()) setBarra(snap.data())
      else setBarra(null)
    } catch (err) {
      console.error('loadBarra error', err)
      setBarraError(err)
      setBarra(null)
    }
  }

  // PROCESSES (upcoming 15 days) - safe parsing
  const loadUpcomingProcesses = async () => {
    try {
      setProcessesError(null)
      const col = await getDocs(collection(db, 'processes'))
      const now = new Date()
      const limit = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000)

      const prox = []
      col.forEach(d => {
        const p = d.data()
        // try common fields
        const rawEta = p.eta ?? p.eta_original ?? p.etaDate ?? null
        if (!rawEta) return
        let etaDate = null
        try {
          // Firestore Timestamp has toDate
          if (rawEta && typeof rawEta.toDate === 'function') {
            etaDate = rawEta.toDate()
          } else {
            // if ISO string or number
            etaDate = new Date(rawEta)
            if (isNaN(etaDate)) etaDate = null
          }
        } catch (e) {
          etaDate = null
        }
        if (!etaDate) return
        if (etaDate >= now && etaDate <= limit) prox.push({ id: d.id, ...p, __etaDate: etaDate })
      })

      // sort by eta
      prox.sort((a, b) => a.__etaDate - b.__etaDate)
      setProcesses(prox)
    } catch (err) {
      console.error('loadUpcomingProcesses error', err)
      setProcessesError(err)
      setProcesses([])
    }
  }

  const statusStyle = {
    PRATICÁVEL: 'bg-green-500 text-white',
    IMPRATICÁVEL: 'bg-red-500 text-white',
    'PRATICÁVEL C/ RESTRIÇÕES': 'bg-yellow-500 text-black'
  }

  return (
    <div className="space-y-10">
      {/* AVISOS */}
      <div className="bg-white shadow p-6 rounded-xl border">
        <h2 className="text-xl font-bold mb-3">Avisos Importantes</h2>

        {annError ? (
          <div className="text-red-600 mb-3">
            Não foi possível carregar os avisos. Verifique permissões ou contate o administrador.
          </div>
        ) : null}

        {editing ? (
          <>
            <textarea
              value={annText}
              onChange={e => setAnnText(e.target.value)}
              className="w-full p-3 border rounded-lg"
              rows={4}
            />
            <div className="flex gap-3 mt-3">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg" onClick={saveAnnouncements}>
                Salvar
              </button>
              <button className="px-4 py-2 bg-gray-300 rounded-lg" onClick={() => { setEditing(false); loadAnnouncements() }}>
                Cancelar
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-gray-700 whitespace-pre-line">{annText || 'Nenhum aviso no momento.'}</p>
            {(role === 'admin' || role === 'comex') && (
              <button
                className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-lg"
                onClick={() => setEditing(true)}
              >
                Editar Avisos
              </button>
            )}
          </>
        )}
      </div>

      {/* BARRA DE NAVEGAÇÃO */}
      <div className="bg-white shadow p-6 rounded-xl border">
        <h2 className="text-xl font-bold mb-4">Condições da Barra de Itajaí / Navegantes</h2>

        {barraError ? (
          <div className="text-red-600">Não foi possível carregar o status da barra. Verifique permissões.</div>
        ) : null}

        {barra ? (
          <div className={`inline-block px-4 py-2 rounded-lg font-bold ${statusStyle[barra.status] ?? 'bg-gray-200 text-gray-800'}`}>
            {barra.status}
          </div>
        ) : (
          !barraError && <p className="text-gray-600">Carregando...</p>
        )}
      </div>

      {/* PROCESSOS PRÓXIMOS */}
      <div className="bg-white shadow p-6 rounded-xl border">
        <h2 className="text-xl font-bold mb-4">Processos Próximos (até 15 dias)</h2>

        {processesError ? (
          <div className="text-red-600 mb-3">Não foi possível carregar processos. Verifique permissões.</div>
        ) : null}

        {loading ? (
          <div className="text-gray-600">Carregando...</div>
        ) : processes.length === 0 ? (
          <p className="text-gray-600">Nenhum processo dentro do período.</p>
        ) : (
          processes.map(p => (
            <div key={p.id} className="p-4 border rounded-lg mb-3">
              <p className="font-semibold">{p.processo || p.description || p.po || 'Processo'}</p>
              <p className="text-gray-600">ETA: {p.__etaDate ? p.__etaDate.toLocaleString() : (p.eta ? String(p.eta) : '—')}</p>
              {p.status && <div className="text-sm text-gray-700 mt-1">Status: {p.status}</div>}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
