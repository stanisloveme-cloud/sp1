import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { cellId, userId, amount } = await request.json()

    // Создание платежа в YooKassa
    const yookassaResponse = await fetch('https://api.yookassa.ru/v3/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotence-Key': `${userId}-${cellId}-${Date.now()}`,
        'Authorization': `Basic ${Buffer.from(
          `${process.env.YOOKASSA_SHOP_ID}:${process.env.YOOKASSA_SECRET_KEY}`
        ).toString('base64')}`
      },
      body: JSON.stringify({
        amount: {
          value: amount.toFixed(2),
          currency: 'RUB'
        },
        capture: true,
        confirmation: {
          type: 'redirect',
          return_url: `${process.env.NEXT_PUBLIC_APP_URL}/cabinet`
        },
        description: `Аренда ячейки на 1 месяц`,
        metadata: {
          cellId,
          userId
        },
        save_payment_method: true // Для рекуррентных платежей
      })
    })

    const paymentData = await yookassaResponse.json()

    if (!yookassaResponse.ok) {
      throw new Error(paymentData.description || 'Ошибка создания платежа')
    }

    // Сохранение информации о платеже в БД
    const { error: dbError } = await supabase
      .from('payments')
      .insert({
        provider_id: paymentData.id,
        amount: amount,
        status: 'pending',
        user_id: userId,
        cell_id: cellId
      })

    if (dbError) throw dbError

    return NextResponse.json({
      confirmationUrl: paymentData.confirmation.confirmation_url,
      paymentId: paymentData.id
    })

  } catch (error: any) {
    console.error('Payment creation error:', error)
    return NextResponse.json(
      { error: error.message || 'Ошибка создания платежа' },
      { status: 500 }
    )
  }
}
