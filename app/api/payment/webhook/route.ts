import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Проверка события от YooKassa
    if (body.event === 'payment.succeeded') {
      const payment = body.object
      const { cellId, userId } = payment.metadata

      // Обновление статуса платежа
      await supabase
        .from('payments')
        .update({ status: 'completed' })
        .eq('provider_id', payment.id)

      // Создание или обновление аренды
      const paidUntilDate = new Date()
      paidUntilDate.setMonth(paidUntilDate.getMonth() + 1)

      const { data: existingRent } = await supabase
        .from('rents')
        .select('*')
        .eq('user_id', userId)
        .eq('cell_id', cellId)
        .eq('status', 'active')
        .single()

      if (existingRent) {
        // Продление существующей аренды
        const newPaidUntil = new Date(existingRent.paid_until_date)
        newPaidUntil.setMonth(newPaidUntil.getMonth() + 1)

        await supabase
          .from('rents')
          .update({ paid_until_date: newPaidUntil.toISOString() })
          .eq('id', existingRent.id)
      } else {
        // Создание новой аренды
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

        // Обновление статуса ячейки
        await supabase
          .from('cells')
          .update({ status: 'rented' })
          .eq('id', cellId)

        // Связываем платеж с арендой
        await supabase
          .from('payments')
          .update({ rent_id: rent.id })
          .eq('provider_id', payment.id)
      }

      return NextResponse.json({ success: true })
    }

    if (body.event === 'payment.canceled' || body.event === 'payment.failed') {
      const payment = body.object

      await supabase
        .from('payments')
        .update({ status: 'failed' })
        .eq('provider_id', payment.id)

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
