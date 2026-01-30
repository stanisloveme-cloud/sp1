'use client'

import { useState } from 'react'

type PhoneAuthProps = {
  onSuccess: () => void
}

export default function PhoneAuth({ onSuccess }: PhoneAuthProps) {
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [channel, setChannel] = useState<'viber' | 'sms' | ''>('')

  async function handleSendOTP() {
    if (!phone || phone.length < 10) {
      setError('Введите корректный номер телефона')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка отправки кода')
      }

      setChannel(data.channel)
      setStep('otp')
    } catch (err: any) {
      setError(err.message || 'Ошибка отправки кода')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyOTP() {
    setLoading(true)
    setError('')

    try {
      if (otp.length !== 4) {
        throw new Error('Код должен состоять из 4 цифр')
      }

      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone, code: otp }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Неверный код')
      }

      // Сохраняем телефон в localStorage для отображения
      if (typeof window !== 'undefined') {
        localStorage.setItem('user_phone', phone)
      }

      onSuccess()
    } catch (err: any) {
      setError(err.message || 'Неверный код')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Вход по телефону</h2>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
        <p className="text-xs text-blue-800">
          <strong>💬 Приоритет:</strong> Сначала попытка отправить через мессенджер, затем SMS
        </p>
      </div>

      {step === 'phone' ? (
        <div>
          <input
            type="tel"
            placeholder="+7 999 123-45-67"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4"
          />
          <button
            onClick={handleSendOTP}
            disabled={loading || !phone}
            className="btn-primary w-full"
          >
            {loading ? 'Отправка...' : 'Получить код'}
          </button>
        </div>
      ) : (
        <div>
          <p className="text-gray-600 mb-2">Код отправлен на {phone}</p>
          {channel && (
            <p className="text-sm text-green-600 mb-4">
              ✓ Отправлено через {channel === 'viber' ? 'мессенджер' : 'SMS'}
            </p>
          )}
          <input
            type="text"
            placeholder="Введите код"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
            maxLength={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4 text-center text-2xl tracking-wider"
          />
          <button
            onClick={handleVerifyOTP}
            disabled={loading || otp.length !== 4}
            className="btn-primary w-full"
          >
            {loading ? 'Проверка...' : 'Подтвердить'}
          </button>
          <button
            onClick={() => {
              setStep('phone')
              setOtp('')
              setError('')
              setChannel('')
            }}
            className="btn-secondary w-full mt-2"
          >
            Изменить номер
          </button>
        </div>
      )}

      {error && (
        <p className="text-red-500 mt-4 text-sm">{error}</p>
      )}
    </div>
  )
}
