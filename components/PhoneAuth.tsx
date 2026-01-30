'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

type PhoneAuthProps = {
  onSuccess: () => void
}

export default function PhoneAuth({ onSuccess }: PhoneAuthProps) {
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSendOTP() {
    setLoading(true)
    setError('')

    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: phone,
      })

      if (error) throw error
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
      const { error } = await supabase.auth.verifyOtp({
        phone: phone,
        token: otp,
        type: 'sms'
      })

      if (error) throw error
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
          <p className="text-gray-600 mb-4">Код отправлен на {phone}</p>
          <input
            type="text"
            placeholder="Введите код из SMS"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4"
          />
          <button
            onClick={handleVerifyOTP}
            disabled={loading || !otp}
            className="btn-primary w-full"
          >
            {loading ? 'Проверка...' : 'Подтвердить'}
          </button>
          <button
            onClick={() => setStep('phone')}
            className="btn-secondary w-full mt-2"
          >
            Изменить номер
          </button>
        </div>
      )}

      {error && (
        <p className="text-red-500 mt-4">{error}</p>
      )}
    </div>
  )
}
