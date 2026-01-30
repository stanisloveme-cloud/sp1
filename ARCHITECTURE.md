# Техническая документация: Бери Кладовку MVP

## Оглавление
1. [Обзор архитектуры](#обзор-архитектуры)
2. [Технологический стек](#технологический-стек)
3. [Архитектура базы данных](#архитектура-базы-данных)
4. [Структура приложения](#структура-приложения)
5. [Компоненты и их взаимодействие](#компоненты-и-их-взаимодействие)
6. [Потоки данных](#потоки-данных)
7. [Безопасность](#безопасность)
8. [API интеграции](#api-интеграции)
9. [Развертывание](#развертывание)

---

## Обзор архитектуры

### Общая схема

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Browser     │  │ React/Next.js│  │  Yandex Maps │      │
│  │  (Chrome)    │◄─┤  Components  │◄─┤     API      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     Application Layer                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Next.js     │  │  API Routes  │  │  Middleware  │      │
│  │  App Router  │◄─┤  /api/*      │◄─┤   (Auth)     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Services Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Supabase    │  │  YooKassa    │  │  SMS Aero    │      │
│  │  Auth + DB   │  │  Payments    │  │  (Optional)  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Принципы архитектуры

1. **JAMstack** - JavaScript, APIs, Markup
2. **Serverless** - без управления серверами
3. **API-First** - все взаимодействия через REST API
4. **Mobile-First** - адаптивный дизайн с приоритетом мобильных устройств
5. **Security by Default** - Row Level Security (RLS) на уровне БД

---

## Технологический стек

### Frontend
```javascript
{
  "framework": "Next.js 14.1.0",
  "language": "TypeScript 5.x",
  "styling": "Tailwind CSS 3.3",
  "runtime": "React 18.2"
}
```

**Выбор Next.js:**
- Server-Side Rendering (SSR) для SEO
- App Router для современной маршрутизации
- API Routes для backend логики
- Оптимизация изображений и бандлов

**Выбор TypeScript:**
- Статическая типизация
- Автокомплит в IDE
- Снижение количества ошибок

### Backend & Database
```javascript
{
  "platform": "Supabase",
  "database": "PostgreSQL 15",
  "auth": "Supabase Auth (Phone OTP)",
  "storage": "Supabase Storage (future)",
  "realtime": "Supabase Realtime (future)"
}
```

**Выбор Supabase:**
- Полностью управляемый PostgreSQL
- Встроенная аутентификация
- Row Level Security (RLS)
- Real-time subscriptions
- REST API из коробки

### Платежи
```javascript
{
  "provider": "YooKassa",
  "features": [
    "Рекуррентные платежи",
    "Webhook notifications",
    "3D-Secure поддержка",
    "Возвраты и отмены"
  ]
}
```

### Карты
```javascript
{
  "provider": "Yandex Maps API 2.1",
  "features": [
    "Интерактивная карта",
    "Геометки",
    "Геокодирование"
  ]
}
```

---

## Архитектура базы данных

### Схема данных

```sql
┌─────────────────────────────────────────────────────────────┐
│                     auth.users (Supabase)                    │
│  - id: UUID (PK)                                             │
│  - phone: TEXT                                               │
│  - created_at: TIMESTAMP                                     │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ 1:1
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      public.users                            │
│  - id: UUID (PK, FK → auth.users)                           │
│  - phone: TEXT (UNIQUE)                                      │
│  - created_at: TIMESTAMP                                     │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ 1:N
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      public.rents                            │
│  - id: UUID (PK)                                             │
│  - user_id: UUID (FK → users)                               │
│  - cell_id: UUID (FK → cells)                               │
│  - start_date: TIMESTAMP                                     │
│  - paid_until_date: TIMESTAMP                                │
│  - is_auto_renew: BOOLEAN                                    │
│  - status: ENUM (active/cancelled/ended)                     │
└─────────────────────────────────────────────────────────────┘
         │                              │
         │ 1:N                          │ N:1
         ▼                              ▼
┌──────────────────────┐    ┌──────────────────────────────┐
│  public.payments     │    │      public.cells            │
│  - id: UUID (PK)     │    │  - id: UUID (PK)             │
│  - rent_id: UUID     │    │  - location_id: UUID (FK)    │
│  - user_id: UUID     │    │  - number: TEXT              │
│  - cell_id: UUID     │    │  - size: ENUM (S/M/L)        │
│  - amount: DECIMAL   │    │  - price_1m: DECIMAL         │
│  - provider_id: TEXT │    │  - status: ENUM              │
│  - status: ENUM      │    │  - current_lock_code: TEXT   │
└──────────────────────┘    └──────────────────────────────┘
                                         │
                                         │ N:1
                                         ▼
                            ┌──────────────────────────────┐
                            │    public.locations          │
                            │  - id: UUID (PK)             │
                            │  - name: TEXT                │
                            │  - address: TEXT             │
                            │  - lat: DECIMAL              │
                            │  - lng: DECIMAL              │
                            └──────────────────────────────┘
```

### Индексы для оптимизации

```sql
-- Поиск ячеек по статусу (главная страница)
CREATE INDEX idx_cells_status ON cells(status);

-- Аренды конкретного пользователя (личный кабинет)
CREATE INDEX idx_rents_user_id ON rents(user_id);

-- Активные аренды (cron job для продления)
CREATE INDEX idx_rents_status ON rents(status);

-- Поиск платежа по ID провайдера (webhook)
CREATE INDEX idx_payments_provider_id ON payments(provider_id);
```

### Row Level Security (RLS) Policies

```sql
-- Ячейки: все могут видеть все ячейки
ALTER TABLE cells DISABLE ROW LEVEL SECURITY;

-- Пользователи: только свои данные
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

-- Аренды: только свои аренды
CREATE POLICY "Users can view own rents" ON rents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own rents" ON rents
  FOR UPDATE USING (auth.uid() = user_id);

-- Платежи: только свои платежи
CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT USING (auth.uid() = user_id);
```

---

## Структура приложения

### Файловая структура

```
beri_kladovky_SP_1/
│
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Корневой layout
│   ├── page.tsx                 # Главная страница (/)
│   ├── globals.css              # Глобальные стили
│   │
│   ├── rent/[id]/               # Динамический маршрут
│   │   └── page.tsx             # Страница аренды (/rent/:id)
│   │
│   ├── cabinet/                 # Личный кабинет
│   │   └── page.tsx             # Страница ЛК (/cabinet)
│   │
│   └── api/                     # API Routes
│       └── payment/
│           ├── create/
│           │   └── route.ts     # POST /api/payment/create
│           └── webhook/
│               └── route.ts     # POST /api/payment/webhook
│
├── components/                   # React компоненты
│   ├── CellCatalog.tsx          # Каталог ячеек
│   ├── CellCard.tsx             # Карточка ячейки
│   ├── MapView.tsx              # Яндекс.Карта
│   ├── PhoneAuth.tsx            # Авторизация по телефону
│   └── PaymentForm.tsx          # Форма оплаты
│
├── lib/                         # Утилиты и конфигурация
│   └── supabase.ts              # Supabase клиент
│
├── types/                       # TypeScript типы
│   └── database.types.ts        # Типы для БД
│
├── public/                      # Статические файлы
│
├── .env.local                   # Переменные окружения (не в git)
├── .env.example                 # Пример переменных
├── next.config.js               # Конфигурация Next.js
├── tailwind.config.ts           # Конфигурация Tailwind
├── tsconfig.json                # Конфигурация TypeScript
├── package.json                 # Зависимости npm
│
└── supabase_schema.sql          # SQL схема БД
```

---

## Компоненты и их взаимодействие

### 1. Главная страница (`app/page.tsx`)

**Роль:** Точка входа, отображает каталог и карту

```typescript
Component Tree:
└── Home
    ├── Header (логотип, описание)
    ├── MapView (карта с локацией)
    └── CellCatalog (список ячеек)
        └── CellCard[] (карточки ячеек)
```

**Данные:**
- Загружает ячейки из Supabase
- Статическая карта с координатами склада

### 2. Каталог ячеек (`components/CellCatalog.tsx`)

**Функционал:**
```typescript
// State
const [cells, setCells] = useState<Cell[]>([])
const [filter, setFilter] = useState<'all' | 'S' | 'M' | 'L'>('all')

// Загрузка данных
useEffect(() => {
  const { data } = await supabase
    .from('cells')
    .select('*')
    .order('number', { ascending: true })

  setCells(data)
}, [])

// Фильтрация
const filteredCells = filter === 'all'
  ? cells
  : cells.filter(cell => cell.size === filter)
```

### 3. Карта (`components/MapView.tsx`)

**Технические детали:**
```typescript
// Загрузка Yandex Maps API
const script = document.createElement('script')
script.src = `https://api-maps.yandex.ru/2.1/?apikey=${API_KEY}&lang=ru_RU`

// Инициализация карты
window.ymaps.ready(() => {
  const map = new window.ymaps.Map(mapRef.current, {
    center: [55.751244, 37.618423],
    zoom: 15,
    controls: ['zoomControl']
  })

  // Добавление маркера
  const placemark = new window.ymaps.Placemark(
    [55.751244, 37.618423],
    { balloonContent: 'Склад "Бери Кладовку"' }
  )

  map.geoObjects.add(placemark)
})
```

**Оптимизация:**
- Проверка на дубликаты карты
- Cleanup при размонтировании
- Fallback на заглушку без API ключа

### 4. Страница аренды (`app/rent/[id]/page.tsx`)

**Логика:**
```typescript
// 1. Загрузка данных ячейки
const { data: cell } = await supabase
  .from('cells')
  .select('*')
  .eq('id', params.id)
  .single()

// 2. Проверка авторизации
const { data: { user } } = await supabase.auth.getUser()

// 3. Условный рендеринг
if (!user) {
  return <PhoneAuth onSuccess={checkUser} />
} else {
  return <PaymentForm cell={cell} userId={user.id} />
}
```

### 5. Авторизация (`components/PhoneAuth.tsx`)

**Процесс:**
```typescript
// Шаг 1: Отправка OTP
const handleSendOTP = async () => {
  await supabase.auth.signInWithOtp({
    phone: phone,
  })
  setStep('otp')
}

// Шаг 2: Верификация OTP
const handleVerifyOTP = async () => {
  await supabase.auth.verifyOtp({
    phone: phone,
    token: otp,
    type: 'sms'
  })
  onSuccess()
}
```

### 6. Личный кабинет (`app/cabinet/page.tsx`)

**Функционал:**
```typescript
// Загрузка активной аренды
const { data: rent } = await supabase
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

// Отмена автопродления
const handleCancelAutoRenew = async () => {
  await supabase
    .from('rents')
    .update({ is_auto_renew: false })
    .eq('id', rent.id)
}
```

---

## Потоки данных

### Поток 1: Просмотр ячеек (неавторизованный)

```
User → Browser → app/page.tsx → CellCatalog
                                     ↓
                              Supabase.from('cells')
                                     ↓
                            [Cell, Cell, Cell, ...]
                                     ↓
                              CellCard[] render
```

### Поток 2: Создание аренды (полный цикл)

```
1. User нажимает "Арендовать"
   ↓
2. /rent/[id] → Проверка auth
   ↓
3. Если нет auth → PhoneAuth
   ├─ Отправка SMS через Supabase
   └─ Верификация OTP
   ↓
4. PaymentForm → POST /api/payment/create
   ↓
5. Backend создает платеж в YooKassa
   ├─ Генерация Idempotence-Key
   ├─ Запись в payments (status: pending)
   └─ Возврат confirmationUrl
   ↓
6. Redirect на YooKassa
   ↓
7. User оплачивает
   ↓
8. YooKassa → POST /api/payment/webhook
   ├─ Обновление payments (status: completed)
   ├─ Создание rents (status: active)
   └─ Обновление cells (status: rented)
   ↓
9. Redirect на /cabinet
   ↓
10. Показ кода замка
```

### Поток 3: Автоматическое продление (будущий cron job)

```
Daily Cron Job (00:00 UTC)
   ↓
1. SELECT * FROM rents
   WHERE paid_until_date = TODAY
   AND is_auto_renew = true
   ↓
2. Для каждой аренды:
   ├─ GET saved_payment_method_id
   ├─ POST YooKassa /payments (с saved_payment_method)
   ├─ UPDATE payments (новый платеж)
   └─ IF success → UPDATE rents.paid_until_date + 1 month
   ↓
3. Отправка уведомлений (email/sms)
```

---

## Безопасность

### 1. Аутентификация и Авторизация

**Phone OTP через Supabase:**
```typescript
// Отправка OTP
await supabase.auth.signInWithOtp({ phone })

// Токены хранятся в localStorage
// JWT токен автоматически добавляется в headers
```

**Row Level Security:**
```sql
-- Пример: только владелец видит свои аренды
CREATE POLICY "Users can view own rents" ON rents
  FOR SELECT USING (auth.uid() = user_id);
```

### 2. Защита API Routes

```typescript
// Проверка webhook от YooKassa
export async function POST(request: NextRequest) {
  // TODO: Проверка подписи webhook
  const signature = request.headers.get('x-yookassa-signature')

  if (!verifySignature(signature, body)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
  }
}
```

### 3. Переменные окружения

**Не коммитим в git:**
- `.env.local` в `.gitignore`
- Секретные ключи только на сервере

**Префиксы Next.js:**
- `NEXT_PUBLIC_*` - доступны на клиенте
- Без префикса - только на сервере

```bash
# Клиент
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_YANDEX_MAPS_API_KEY=xxx

# Сервер
YOOKASSA_SECRET_KEY=live_xxx  # НЕ NEXT_PUBLIC!
```

### 4. SQL Injection Protection

**Supabase ORM защищает автоматически:**
```typescript
// ✅ Безопасно (параметризованный запрос)
await supabase
  .from('cells')
  .select('*')
  .eq('id', userInput)

// ❌ Опасно (если бы использовали raw SQL)
// await supabase.rpc('raw_sql', { query: `SELECT * FROM cells WHERE id = '${userInput}'` })
```

### 5. XSS Protection

**React автоматически экранирует:**
```typescript
// ✅ Безопасно
<div>{userInput}</div>

// ❌ Опасно (не используем)
<div dangerouslySetInnerHTML={{ __html: userInput }} />
```

---

## API интеграции

### 1. Supabase REST API

**Автоматически генерируется из схемы БД:**

```typescript
// GET /rest/v1/cells?status=eq.available
const { data, error } = await supabase
  .from('cells')
  .select('*')
  .eq('status', 'available')

// Под капотом:
// Authorization: Bearer <JWT_TOKEN>
// apikey: <SUPABASE_ANON_KEY>
```

### 2. YooKassa API

**Создание платежа:**
```typescript
POST https://api.yookassa.ru/v3/payments
Headers:
  Authorization: Basic <base64(shop_id:secret_key)>
  Idempotence-Key: <unique_key>
  Content-Type: application/json

Body:
{
  "amount": { "value": "1500.00", "currency": "RUB" },
  "capture": true,
  "confirmation": {
    "type": "redirect",
    "return_url": "https://domain.com/cabinet"
  },
  "description": "Аренда ячейки #101 на 1 месяц",
  "metadata": {
    "cellId": "uuid",
    "userId": "uuid"
  },
  "save_payment_method": true  // Для рекуррентных платежей
}
```

**Webhook события:**
```json
{
  "event": "payment.succeeded",
  "object": {
    "id": "2c5a1ce7-...",
    "status": "succeeded",
    "paid": true,
    "amount": { "value": "1500.00", "currency": "RUB" },
    "metadata": {
      "cellId": "...",
      "userId": "..."
    },
    "payment_method": {
      "type": "bank_card",
      "id": "2c5a1ce7-...",  // Сохраненный метод
      "saved": true
    }
  }
}
```

### 3. Yandex Maps API

**Загрузка скрипта:**
```html
<script src="https://api-maps.yandex.ru/2.1/?apikey=xxx&lang=ru_RU"></script>
```

**Использование:**
```javascript
ymaps.ready(() => {
  const map = new ymaps.Map('map', {
    center: [55.75, 37.61],
    zoom: 15
  })

  const placemark = new ymaps.Placemark([55.75, 37.61], {
    balloonContent: 'Склад'
  })

  map.geoObjects.add(placemark)
})
```

---

## Развертывание

### Локальная разработка

```bash
# 1. Клонирование
git clone <repo>
cd beri_kladovky_SP_1

# 2. Установка зависимостей
npm install

# 3. Настройка .env.local
cp .env.example .env.local
# Заполнить: SUPABASE_URL, SUPABASE_ANON_KEY, YANDEX_MAPS_API_KEY

# 4. Настройка БД
# Выполнить supabase_schema.sql в Supabase SQL Editor

# 5. Запуск
npm run dev
# → http://localhost:3000
```

### Production на Vercel

```bash
# 1. Установка Vercel CLI
npm install -g vercel

# 2. Деплой
vercel

# 3. Настройка переменных окружения в Vercel Dashboard
# Project Settings → Environment Variables
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
YOOKASSA_SHOP_ID=123456
YOOKASSA_SECRET_KEY=live_xxx
NEXT_PUBLIC_YANDEX_MAPS_API_KEY=xxx
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# 4. Настройка webhook YooKassa
# URL: https://your-app.vercel.app/api/payment/webhook
# События: payment.succeeded, payment.canceled, payment.failed

# 5. Настройка доменов в Yandex Maps
# Добавить: your-app.vercel.app

# 6. Production deploy
vercel --prod
```

### Environment Variables

| Переменная | Где | Описание |
|-----------|-----|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Клиент | URL Supabase проекта |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Клиент | Публичный API ключ |
| `YOOKASSA_SHOP_ID` | Сервер | ID магазина YooKassa |
| `YOOKASSA_SECRET_KEY` | Сервер | Секретный ключ YooKassa |
| `NEXT_PUBLIC_YANDEX_MAPS_API_KEY` | Клиент | API ключ Яндекс.Карт |
| `NEXT_PUBLIC_APP_URL` | Клиент | URL приложения |

### CI/CD с Vercel

**Автоматический деплой:**
```yaml
# vercel.json (опционально)
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["arn1"],  # Europe (Frankfurt)
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase_url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase_anon_key"
  }
}
```

**GitHub Integration:**
- Push в `main` → Production deploy
- Pull Request → Preview deploy
- Rollback в один клик

---

## Метрики и мониторинг

### Supabase Dashboard

**Metrics:**
- Database size
- API requests/min
- Active connections
- Query performance

**Logs:**
- Auth events
- Database queries
- Function logs

### Vercel Analytics

**Metrics:**
- Page views
- Unique visitors
- Performance (Core Web Vitals)
- Geographic distribution

### YooKassa Dashboard

**Metrics:**
- Conversion rate
- Average check
- Failed payments
- Refunds

---

## Оптимизация и производительность

### 1. Database

**Индексы:**
```sql
CREATE INDEX idx_cells_status ON cells(status);
CREATE INDEX idx_rents_user_id ON rents(user_id);
```

**Connection Pooling:**
- Supabase автоматически управляет пулом соединений
- PgBouncer в режиме Transaction

### 2. Frontend

**Next.js оптимизации:**
- Automatic Code Splitting
- Image Optimization (next/image)
- Font Optimization
- Script Optimization

**Bundle Analysis:**
```bash
npm run build
# Анализ размера бандлов
```

### 3. Caching

**Supabase:**
```typescript
// Cache на 5 минут
const { data } = await supabase
  .from('cells')
  .select('*')
  // Supabase автоматически кеширует на CDN
```

**Vercel Edge Caching:**
```typescript
export const revalidate = 60 // ISR: revalidate каждые 60 сек
```

---

## Troubleshooting

### Проблема: Ячейки не загружаются

**Решение:**
```bash
# 1. Проверить RLS политики
ALTER TABLE cells DISABLE ROW LEVEL SECURITY;

# 2. Проверить наличие данных
SELECT * FROM cells;

# 3. Проверить API ключи в .env.local
```

### Проблема: Карта не отображается

**Решение:**
```typescript
// 1. Проверить API ключ
console.log(process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY)

// 2. Проверить домены в Yandex Developer Console

// 3. Проверить ошибки в Console
```

### Проблема: Платеж не проходит

**Решение:**
```bash
# 1. Проверить тестовый режим YooKassa
# 2. Проверить Shop ID и Secret Key
# 3. Проверить логи в Vercel
vercel logs

# 4. Тестовая карта:
# 5555 5555 5555 4477, 12/24, 123
```

---

## Roadmap (будущие улучшения)

### v1.1 - Автоматизация
- [ ] Cron job для автоплатежей
- [ ] Email уведомления
- [ ] SMS уведомления об окончании аренды

### v1.2 - Админка
- [ ] Custom админ-панель
- [ ] Управление ячейками
- [ ] Изменение кодов замков
- [ ] Аналитика и отчеты

### v1.3 - UX улучшения
- [ ] Фотографии ячеек
- [ ] 3D тур склада
- [ ] История аренд
- [ ] Продление на несколько месяцев со скидкой

### v2.0 - Масштабирование
- [ ] Несколько локаций
- [ ] Мобильное приложение
- [ ] IoT замки (открытие через приложение)
- [ ] Видеонаблюдение в ячейке

---

## Контакты и поддержка

**Документация:**
- Next.js: https://nextjs.org/docs
- Supabase: https://supabase.com/docs
- YooKassa: https://yookassa.ru/developers
- Yandex Maps: https://yandex.ru/dev/jsapi-v2-1/

**Техническая поддержка:**
- GitHub Issues: <repo_url>/issues
- Email: tech@berikладовку.ru

---

**Версия документа:** 1.0
**Дата обновления:** 2026-01-30
**Автор:** Claude (Anthropic)
