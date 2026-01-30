'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import CellCard from './CellCard'

type Cell = {
  id: string
  number: string
  size: 'S' | 'M' | 'L'
  price_1m: number
  status: 'available' | 'rented' | 'maintenance'
}

export default function CellCatalog() {
  const [cells, setCells] = useState<Cell[]>([])
  const [filter, setFilter] = useState<'all' | 'S' | 'M' | 'L'>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCells()
  }, [])

  async function fetchCells() {
    try {
      const { data, error } = await supabase
        .from('cells')
        .select('*')
        .order('number', { ascending: true })

      if (error) throw error
      setCells(data || [])
    } catch (error) {
      console.error('Error fetching cells:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredCells = filter === 'all'
    ? cells
    : cells.filter(cell => cell.size === filter)

  const availableCells = filteredCells.filter(cell => cell.status === 'available')

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Доступные ячейки</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded ${filter === 'all' ? 'bg-primary text-white' : 'bg-gray-200'}`}
          >
            Все
          </button>
          <button
            onClick={() => setFilter('S')}
            className={`px-4 py-2 rounded ${filter === 'S' ? 'bg-primary text-white' : 'bg-gray-200'}`}
          >
            S
          </button>
          <button
            onClick={() => setFilter('M')}
            className={`px-4 py-2 rounded ${filter === 'M' ? 'bg-primary text-white' : 'bg-gray-200'}`}
          >
            M
          </button>
          <button
            onClick={() => setFilter('L')}
            className={`px-4 py-2 rounded ${filter === 'L' ? 'bg-primary text-white' : 'bg-gray-200'}`}
          >
            L
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Загрузка...</div>
      ) : (
        <div className="grid gap-4">
          {availableCells.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Нет доступных ячеек</p>
          ) : (
            availableCells.map(cell => (
              <CellCard key={cell.id} cell={cell} />
            ))
          )}
        </div>
      )}
    </div>
  )
}
