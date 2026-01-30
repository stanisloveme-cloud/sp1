'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Rent = {
  id: string
  start_date: string
  paid_until_date: string
  is_auto_renew: boolean
  status: string
  cells: {
    number: string
    size: string
    price_1m: number
    current_lock_code: string
  }
}

export default function CabinetPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [rent, setRent] = useState<Rent | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkUser()
  }, [])

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/')
      return
    }

    setUser(user)
    await fetchRent(user.id)
  }

  async function fetchRent(userId: string) {
    try {
      const { data, error } = await supabase
        .from('rents')
        .select(`
          *,
          cells (
            number,
            size,
            price_1m,
            current_lock_code
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'active')
        .single()

      if (error && error.code !== 'PGRST116') throw error
      setRent(data)
    } catch (error) {
      console.error('Error fetching rent:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleCancelAutoRenew() {
    if (!rent) return

    try {
      const { error } = await supabase
        .from('rents')
        .update({ is_auto_renew: false })
        .eq('id', rent.id)

      if (error) throw error

      setRent({ ...rent, is_auto_renew: false })
      alert('Автопродление отменено')
    } catch (error) {
      console.error('Error canceling auto-renew:', error)
      alert('Ошибка отмены автопродления')
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return <div className="max-w-4xl mx-auto px-4 py-8">Загрузка...</div>
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Личный кабинет</h1>
          <button onClick={handleLogout} className="text-gray-600 hover:text-gray-900">
            Выйти
          </button>
        </div>

        {!rent ? (
          <div className="card">
            <p className="text-gray-600 text-center py-8">У вас нет активной аренды</p>
            <button
              onClick={() => router.push('/')}
              className="btn-primary w-full"
            >
              Найти ячейку
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="card">
              <h2 className="text-2xl font-bold mb-4">Ваша ячейка</h2>

              <div className="bg-primary text-white rounded-lg p-6 mb-6">
                <div className="text-center">
                  <p className="text-sm opacity-90 mb-2">Номер ячейки</p>
                  <p className="text-4xl font-bold mb-4">#{rent.cells.number}</p>
                  <p className="text-sm opacity-90 mb-2">Код замка</p>
                  <p className="text-3xl font-mono font-bold tracking-wider">
                    {rent.cells.current_lock_code}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-600 text-sm mb-1">Размер</p>
                  <p className="text-xl font-semibold">{rent.cells.size}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-600 text-sm mb-1">Стоимость</p>
                  <p className="text-xl font-semibold">{rent.cells.price_1m} ₽/мес</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-gray-600 text-sm mb-2">Оплачено до:</p>
                <p className="text-lg font-semibold mb-4">
                  {new Date(rent.paid_until_date).toLocaleDateString('ru-RU')}
                </p>

                {rent.is_auto_renew ? (
                  <div>
                    <p className="text-green-600 mb-4">✓ Автопродление активно</p>
                    <button
                      onClick={handleCancelAutoRenew}
                      className="btn-secondary w-full"
                    >
                      Отменить автопродление
                    </button>
                  </div>
                ) : (
                  <p className="text-orange-600">
                    ⚠ Автопродление отключено. Аренда завершится {new Date(rent.paid_until_date).toLocaleDateString('ru-RU')}
                  </p>
                )}
              </div>
            </div>

            <div className="card bg-blue-50 border border-blue-200">
              <h3 className="font-semibold mb-2">Правила пользования</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Доступ к ячейке круглосуточный</li>
                <li>• Храните только легальные вещи</li>
                <li>• Запрещено хранение скоропортящихся продуктов</li>
                <li>• При окончании аренды освободите ячейку</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
