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
    if (!phone || phone.length < 10) {
      setError('Введите корректный номер телефона')
      return
    }

    setLoading(true)
    setError('')

    try {
      // MVP: Эмуляция отправки SMS
      await new Promise(resolve => setTimeout(resolve, 1000))
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
      // MVP: Любой 4-значный код подходит
      if (otp.length !== 4) {
        throw new Error('Код должен состоять из 4 цифр')
      }

      // Создаем анонимную сессию в Supabase
      const { data: authData, error: authError } = await supabase.auth.signInAnonymously()

      if (authError) throw authError

      if (!authData.user) throw new Error('Ошибка создания сессии')

      // Сохраняем пользователя в нашей таблице
      const { error: userError } = await supabase
        .from('users')
        .upsert({
          id: authData.user.id,
          phone: phone,
        }, {
          onConflict: 'id'
        })

      if (userError) {
        // Если ошибка foreign key - пользователь уже есть в auth.users но нет в public.users
        // Просто создаем запись
        if (userError.code === '23503') {
          // Игнорируем, продолжаем
        } else {
          console.error('User creation error:', userError)
        }
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

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
        <p className="text-xs text-yellow-800">
          <strong>MVP режим:</strong> Введите любой номер телефона и код <strong>0000</strong> для входа
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
          <p className="text-gray-600 mb-2">Код "отправлен" на {phone}</p>
          <p className="text-sm text-green-600 mb-4">💡 Используйте код: <strong>0000</strong></p>
          <input
            type="text"
            placeholder="Введите код (0000)"
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
