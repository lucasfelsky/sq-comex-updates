// src/pages/Dashboard.jsx
import React from 'react'
import BarStatusCard from '../components/BarStatusCard'

export default function Dashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 gap-6">
        <BarStatusCard />

        <div className="card">
          <h2 className="text-lg font-semibold">Resumo rápido</h2>
          <p className="text-sm text-muted mt-2">
            Links rápidos e estatísticas podem ficar aqui. Ex.: número de processos abertos, alertas de vencimento, etc.
          </p>
        </div>
      </div>
    </div>
  )
}
