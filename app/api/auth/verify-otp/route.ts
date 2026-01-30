import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { phone, code } = await request.json()

    if (!phone || !code) {
      return NextResponse.json({
        error: 'Номер телефона и код обязательны'
      }, { status: 400 })
    }

    // Нормализуем номер
    let normalizedPhone = phone.replace(/\D/g, '')
    if (normalizedPhone.startsWith('8')) {
      normalizedPhone = '7' + normalizedPhone.slice(1)
    }
    if (!normalizedPhone.startsWith('7')) {
      normalizedPhone = '7' + normalizedPhone
    }

    // Ищем код в БД
    const { data: otpData, error: otpError } = await supabase
      .from('otp_codes')
      .select('*')
      .eq('phone', normalizedPhone)
      .eq('code', code)
      .eq('verified', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (otpError || !otpData) {
      return NextResponse.json({
        error: 'Неверный код или код истек'
      }, { status: 400 })
    }

    // Помечаем код как использованный
    await supabase
      .from('otp_codes')
      .update({ verified: true })
      .eq('id', otpData.id)

    // Создаем анонимную сессию в Supabase
    const { data: authData, error: authError } = await supabase.auth.signInAnonymously()

    if (authError || !authData.user) {
      return NextResponse.json({
        error: 'Ошибка создания сессии'
      }, { status: 500 })
    }

    // Сохраняем/обновляем пользователя в нашей таблице
    const { error: userError } = await supabase
      .from('users')
      .upsert({
        id: authData.user.id,
        phone: normalizedPhone,
      }, {
        onConflict: 'id'
      })

    if (userError && userError.code !== '23503') {
      console.error('User creation error:', userError)
    }

    return NextResponse.json({
      success: true,
      message: 'Код подтвержден',
      userId: authData.user.id,
      session: authData.session
    })

  } catch (error: any) {
    console.error('Verify OTP error:', error)
    return NextResponse.json({
      error: 'Внутренняя ошибка сервера',
      details: error.message
    }, { status: 500 })
  }
}
