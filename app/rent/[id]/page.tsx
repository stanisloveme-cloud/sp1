'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import PhoneAuth from '@/components/PhoneAuth'
import PaymentForm from '@/components/PaymentForm'

type Cell = {
  id: string
  number: string
  size: string
  price_1m: number
}

export default function RentPage() {
  const params = useParams()
  const router = useRouter()
  const [cell, setCell] = useState<Cell | null>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCell()
    checkUser()
  }, [params.id])

  async function fetchCell() {
    try {
      const { data, error } = await supabase
        .from('cells')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) throw error
      setCell(data)
    } catch (error) {
      console.error('Error fetching cell:', error)
    } finally {
      setLoading(false)
    }
  }

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  if (loading) {
    return <div className="max-w-2xl mx-auto px-4 py-8">Загрузка...</div>
  }

  if (!cell) {
    return <div className="max-w-2xl mx-auto px-4 py-8">Ячейка не найдена</div>
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <button
          onClick={() => router.push('/')}
          className="text-primary mb-6 hover:underline"
        >
          ← Назад к каталогу
        </button>

        <div className="card mb-6">
          <h1 className="text-3xl font-bold mb-4">Аренда ячейки #{cell.number}</h1>
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-600">Размер</p>
                <p className="text-xl font-semibold">{cell.size}</p>
              </div>
              <div className="text-right">
                <p className="text-gray-600">Стоимость</p>
                <p className="text-2xl font-bold text-primary">{cell.price_1m} ₽/мес</p>
              </div>
            </div>
          </div>

          {!user ? (
            <PhoneAuth onSuccess={checkUser} />
          ) : (
            <PaymentForm cell={cell} userId={user.id} />
          )}
        </div>
      </div>
    </main>
  )
}
