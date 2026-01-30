'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function MockPaymentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const cellId = searchParams.get('cellId')
  const userId = searchParams.get('userId')
  const amount = searchParams.get('amount')
  const cellNumber = searchParams.get('cellNumber')

  async function handleSuccessPayment() {
    setLoading(true)
    setError('')

    try {
      // Создаем аренду
      const paidUntilDate = new Date()
      paidUntilDate.setMonth(paidUntilDate.getMonth() + 1)

      const { data: rent, error: rentError } = await supabase
        .from('rents')
        .insert({
          user_id: userId,
          cell_id: cellId,
          start_date: new Date().toISOString(),
          paid_until_date: paidUntilDate.toISOString(),
          is_auto_renew: true,
          status: 'active'
        })
        .select()
        .single()

      if (rentError) throw rentError

      // Обновляем статус ячейки
      const { error: cellError } = await supabase
        .from('cells')
        .update({ status: 'rented' })
        .eq('id', cellId)

      if (cellError) throw cellError

      // Создаем запись о платеже (для истории)
      await supabase
        .from('payments')
        .insert({
          rent_id: rent.id,
          user_id: userId,
          cell_id: cellId,
          amount: parseFloat(amount || '0'),
          provider_id: `mock-${Date.now()}`,
          status: 'completed'
        })

      // Редирект в личный кабинет
      setTimeout(() => {
        router.push('/cabinet')
      }, 2000)

    } catch (err: any) {
      console.error('Payment error:', err)
      setError(err.message || 'Ошибка создания аренды')
      setLoading(false)
    }
  }

  function handleCancelPayment() {
    router.push('/')
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="card max-w-md w-full text-center">
          <div className="mb-4">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          </div>
          <h2 className="text-xl font-semibold mb-2">Обработка платежа...</h2>
          <p className="text-gray-600">Создаем вашу аренду</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="card max-w-md w-full">
        {/* Имитация интерфейса платежного шлюза */}
        <div className="text-center mb-6">
          <div className="inline-block bg-blue-100 rounded-full p-4 mb-4">
            <svg className="w-12 h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2">Оплата аренды</h1>
          <p className="text-gray-600">Эмуляция платежного шлюза (MVP)</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-gray-600">Ячейка:</span>
            <span className="font-semibold">#{cellNumber}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-gray-600">Период:</span>
            <span className="font-semibold">1 месяц</span>
          </div>
          <div className="flex justify-between pt-2 border-t">
            <span className="text-lg font-semibold">Итого:</span>
            <span className="text-2xl font-bold text-primary">{amount} ₽</span>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={handleSuccessPayment}
            disabled={loading}
            className="btn-primary w-full"
          >
            ✓ Эмулировать успешную оплату
          </button>

          <button
            onClick={handleCancelPayment}
            disabled={loading}
            className="btn-secondary w-full"
          >
            ✗ Отменить оплату
          </button>
        </div>

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xs text-yellow-800">
            <strong>MVP режим:</strong> Это эмуляция платежной системы для тестирования.
            В продакшене здесь будет реальная интеграция с YooKassa.
          </p>
        </div>
      </div>
    </main>
  )
}
