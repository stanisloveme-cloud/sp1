# Бери Кладовку - MVP Платформа аренды складских ячеек

Ультра-локальное хранение вещей с доступом 24/7. Аренда складских ячеек у дома.

## Технологический стек

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase (Auth + PostgreSQL)
- **Payments**: YooKassa
- **Maps**: Yandex Maps API

## Установка

1. Установите зависимости:
```bash
npm install
```

2. Создайте файл `.env.local` на основе `.env.example`:
```bash
cp .env.example .env.local
```

3. Заполните переменные окружения в `.env.local`:
   - Supabase URL и Anon Key (получите на https://supabase.com)
   - YooKassa Shop ID и Secret Key (получите на https://yookassa.ru)
   - Yandex Maps API Key (получите на https://developer.tech.yandex.ru)

4. Настройте базу данных в Supabase:
   - Откройте SQL Editor в вашем Supabase проекте
   - Скопируйте содержимое `supabase_schema.sql` и выполните его

5. Настройте телефонную авторизацию в Supabase:
   - Перейдите в Authentication > Providers
   - Включите Phone provider
   - Настройте SMS провайдера (Twilio, MessageBird или другой)

## Запуск в режиме разработки

```bash
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000) в браузере.

## Структура проекта

```
beri_kladovky_SP_1/
├── app/
│   ├── api/
│   │   └── payment/        # API routes для платежей
│   ├── cabinet/            # Личный кабинет
│   ├── rent/[id]/          # Страница аренды ячейки
│   ├── layout.tsx          # Корневой layout
│   ├── page.tsx            # Главная страница
│   └── globals.css         # Глобальные стили
├── components/
│   ├── CellCatalog.tsx     # Каталог ячеек
│   ├── CellCard.tsx        # Карточка ячейки
│   ├── MapView.tsx         # Карта с локацией
│   ├── PhoneAuth.tsx       # Компонент авторизации
│   └── PaymentForm.tsx     # Форма оплаты
├── lib/
│   └── supabase.ts         # Supabase клиент
└── types/                  # TypeScript типы
```

## Основные функции MVP

### Для пользователей:
1. **Поиск ячеек**: Карта и список доступных ячеек с фильтрами по размеру
2. **Быстрая аренда**: Вход по телефону (SMS OTP) → Оплата → Мгновенный доступ
3. **Личный кабинет**: Просмотр кода замка, управление автопродлением
4. **Автопродление**: Автоматическая оплата каждый месяц (можно отменить)

### Для администраторов:
- Управление ячейками через Supabase Dashboard
- Просмотр активных аренд
- Изменение кодов замков вручную

## База данных

### Основные таблицы:
- `users` - Пользователи
- `locations` - Локации складов
- `cells` - Складские ячейки
- `rents` - Аренды
- `payments` - Платежи

Полная схема в файле `supabase_schema.sql`

## Интеграция платежей YooKassa

Для работы с рекуррентными платежами:
1. Включите сохранение платежных методов в личном кабинете YooKassa
2. Настройте webhook для уведомлений о платежах
3. Используйте saved_payment_method_id для автоплатежей

## Следующие шаги после MVP

- [ ] Webhook для обработки статусов платежей YooKassa
- [ ] Cron job для автоматического продления аренд
- [ ] Email/SMS уведомления о продлении и окончании аренды
- [ ] Админ-панель для управления ячейками
- [ ] Мобильное приложение
- [ ] Программа лояльности

## Лицензия

Proprietary
