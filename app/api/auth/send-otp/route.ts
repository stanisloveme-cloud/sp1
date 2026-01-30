import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const SMSAERO_EMAIL = process.env.SMSAERO_EMAIL || 's72627999@yandex.ru'
const SMSAERO_API_KEY = process.env.SMSAERO_API_KEY || 'KsU3eVFItGoeyZeUy3rfBw2uhpRCLzpm'

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json()

    if (!phone) {
      return NextResponse.json({ error: 'Номер телефона обязателен' }, { status: 400 })
    }

    // Нормализуем номер (убираем все кроме цифр, добавляем 7 если нужно)
    let normalizedPhone = phone.replace(/\D/g, '')
    if (normalizedPhone.startsWith('8')) {
      normalizedPhone = '7' + normalizedPhone.slice(1)
    }
    if (!normalizedPhone.startsWith('7')) {
      normalizedPhone = '7' + normalizedPhone
    }

    // Генерируем 4-значный код
    const code = Math.floor(1000 + Math.random() * 9000).toString()

    // Сохраняем код в БД
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 5) // 5 минут

    const { error: dbError } = await supabase
      .from('otp_codes')
      .insert({
        phone: normalizedPhone,
        code: code,
        expires_at: expiresAt.toISOString(),
        verified: false
      })

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json({ error: 'Ошибка сохранения кода' }, { status: 500 })
    }

    // Текст сообщения
    const message = `Ваш код для входа в Бери Кладовку: ${code}. Код действителен 5 минут.`

    // Шаг 1: Попытка отправить через Viber/Telegram (дешевле)
    try {
      const viberResponse = await fetch('https://gate.smsaero.ru/v2/viber/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${Buffer.from(`${SMSAERO_EMAIL}:${SMSAERO_API_KEY}`).toString('base64')}`
        },
        body: JSON.stringify({
          number: normalizedPhone,
          text: message,
          sign: 'Бери Кладовку'
        })
      })

      const viberData = await viberResponse.json()

      if (viberResponse.ok && viberData.success) {
        console.log('Viber sent successfully:', viberData)
        return NextResponse.json({
          success: true,
          message: 'Код отправлен через мессенджер',
          channel: 'viber'
        })
      }

      console.log('Viber failed, falling back to SMS:', viberData)
    } catch (viberError) {
      console.error('Viber error:', viberError)
    }

    // Шаг 2: Если Viber не сработал - отправляем SMS
    try {
      const smsResponse = await fetch('https://gate.smsaero.ru/v2/sms/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${Buffer.from(`${SMSAERO_EMAIL}:${SMSAERO_API_KEY}`).toString('base64')}`
        },
        body: JSON.stringify({
          number: normalizedPhone,
          text: message,
          sign: 'Бери Кладовку'
        })
      })

      const smsData = await smsResponse.json()

      if (!smsResponse.ok) {
        console.error('SMS Aero error:', smsData)
        throw new Error(smsData.message || 'Ошибка отправки SMS')
      }

      console.log('SMS sent successfully:', smsData)
      return NextResponse.json({
        success: true,
        message: 'Код отправлен по SMS',
        channel: 'sms'
      })

    } catch (smsError: any) {
      console.error('SMS sending error:', smsError)
      return NextResponse.json({
        error: 'Ошибка отправки SMS. Попробуйте позже.',
        details: smsError.message
      }, { status: 500 })
    }

  } catch (error: any) {
    console.error('Send OTP error:', error)
    return NextResponse.json({
      error: 'Внутренняя ошибка сервера',
      details: error.message
    }, { status: 500 })
  }
}
