'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type PaymentFormProps = {
  cell: {
    id: string
    number: string
    price_1m: number
  }
  userId: string
}

export default function PaymentForm({ cell, userId }: PaymentFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handlePayment() {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/payment/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cellId: cell.id,
          userId: userId,
          amount: cell.price_1m,
        }),
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.error)

      // Перенаправление на страницу оплаты YooKassa
      if (data.confirmationUrl) {
        window.location.href = data.confirmationUrl
      }
    } catch (err: any) {
      setError(err.message || 'Ошибка создания платежа')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Оплата аренды</h2>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-gray-700 mb-2">Условия аренды:</p>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>✓ Доступ 24/7 с момента оплаты</li>
          <li>✓ Автоматическое продление каждый месяц</li>
          <li>✓ Отмена подписки в любое время</li>
        </ul>
      </div>

      <div className="flex justify-between items-center mb-6 p-4 bg-gray-50 rounded-lg">
        <span className="text-lg font-semibold">К оплате:</span>
        <span className="text-2xl font-bold text-primary">{cell.price_1m} ₽</span>
      </div>

      <button
        onClick={handlePayment}
        disabled={loading}
        className="btn-primary w-full"
      >
        {loading ? 'Обработка...' : 'Оплатить картой'}
      </button>

      {error && (
        <p className="text-red-500 mt-4">{error}</p>
      )}

      <p className="text-xs text-gray-500 mt-4 text-center">
        Нажимая "Оплатить", вы соглашаетесь с условиями аренды и автоматическим продлением
      </p>
    </div>
  )
}
