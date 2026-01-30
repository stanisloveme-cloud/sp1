# Инструкция по установке и настройке

## Шаг 1: Установка Node.js и зависимостей

1. Убедитесь, что Node.js установлен (версия 18+):
```bash
node --version
```

2. Установите зависимости проекта:
```bash
cd C:\Users\PC\projects\beri_kladovky_SP_1
npm install
```

## Шаг 2: Настройка Supabase

1. Зарегистрируйтесь на https://supabase.com
2. Создайте новый проект
3. Перейдите в раздел SQL Editor
4. Скопируйте содержимое файла `supabase_schema.sql` и выполните его
5. В Settings > API найдите:
   - Project URL
   - anon/public key

6. Настройте Phone Auth:
   - Перейдите в Authentication > Providers
   - Включите Phone provider
   - Выберите провайдера SMS:
     - **Twilio** (рекомендуется для продакшена)
     - **MessageBird** (альтернатива)
     - Для тестов можно использовать встроенный OTP без реальных SMS

## Шаг 3: Настройка YooKassa

1. Зарегистрируйтесь на https://yookassa.ru
2. Создайте магазин
3. Получите:
   - Shop ID (идентификатор магазина)
   - Secret Key (секретный ключ)
4. Настройте webhook:
   - URL: `https://your-domain.com/api/payment/webhook`
   - События: payment.succeeded, payment.canceled, payment.failed

5. Включите рекуррентные платежи в настройках магазина

## Шаг 4: Настройка Yandex Maps

1. Перейдите на https://developer.tech.yandex.ru
2. Зарегистрируйтесь и создайте новое приложение
3. Получите API ключ для JavaScript API

## Шаг 5: Заполнение .env.local

Откройте файл `.env.local` и заполните все переменные:

```env
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# YooKassa
YOOKASSA_SHOP_ID=123456
YOOKASSA_SECRET_KEY=live_xxxxxxxxxxxxxx

# Yandex Maps
NEXT_PUBLIC_YANDEX_MAPS_API_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# SMS Aero (опционально)
SMSAERO_EMAIL=your@email.com
SMSAERO_API_KEY=your_api_key
```

## Шаг 6: Изменение координат склада

Откройте `components/MapView.tsx` и измените координаты на свои:

```typescript
center: [55.751244, 37.618423], // Замените на ваши координаты
```

Также обновите координаты в базе данных Supabase (таблица `locations`).

## Шаг 7: Запуск проекта

```bash
npm run dev
```

Откройте http://localhost:3000 в браузере.

## Шаг 8: Тестирование функционала

### Тест 1: Просмотр ячеек
- Откройте главную страницу
- Проверьте, что карта загружается
- Проверьте, что список ячеек отображается
- Попробуйте фильтры по размеру (S/M/L)

### Тест 2: Авторизация
- Нажмите "Арендовать" на любой ячейке
- Введите номер телефона (если настроен SMS провайдер)
- Введите OTP код
- Проверьте, что авторизация прошла успешно

### Тест 3: Оплата (тестовый режим)
- После авторизации нажмите "Оплатить картой"
- Используйте тестовую карту YooKassa:
  - Номер: 5555 5555 5555 4477
  - Срок: 12/24
  - CVC: 123
- Проверьте редирект в личный кабинет

### Тест 4: Личный кабинет
- Проверьте отображение номера ячейки
- Проверьте отображение кода замка
- Проверьте дату окончания аренды
- Попробуйте отключить автопродление

## Деплой на Vercel

1. Установите Vercel CLI:
```bash
npm install -g vercel
```

2. Задеплойте проект:
```bash
vercel
```

3. Добавьте переменные окружения в Vercel Dashboard
4. Обновите `NEXT_PUBLIC_APP_URL` на продакшн URL
5. Обновите webhook URL в YooKassa на `https://your-domain.vercel.app/api/payment/webhook`

## Troubleshooting

### Ошибка "Supabase URL not defined"
- Убедитесь, что `.env.local` создан и заполнен
- Перезапустите dev сервер

### Карта не загружается
- Проверьте API ключ Yandex Maps
- Откройте консоль браузера для деталей ошибки

### SMS не приходят
- Проверьте настройки Phone Auth в Supabase
- Убедитесь, что SMS провайдер настроен правильно
- Для тестов можно отключить OTP и использовать mock авторизацию

### Платеж не проходит
- Убедитесь, что YooKassa настроена в тестовом режиме
- Проверьте Shop ID и Secret Key
- Проверьте логи в консоли браузера и терминале

## Дальнейшие улучшения

- [ ] Настроить cron job для автоматического продления аренд
- [ ] Добавить email уведомления
- [ ] Создать админ-панель через Retool или custom interface
- [ ] Добавить историю платежей
- [ ] Добавить возможность продления на несколько месяцев со скидкой
- [ ] Реализовать систему уведомлений в Telegram
