-- Таблица пользователей (расширение встроенной auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица локаций складов
CREATE TABLE IF NOT EXISTS public.locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица ячеек
CREATE TABLE IF NOT EXISTS public.cells (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  number TEXT NOT NULL,
  size TEXT CHECK (size IN ('S', 'M', 'L')) NOT NULL,
  price_1m DECIMAL(10, 2) NOT NULL,
  status TEXT CHECK (status IN ('available', 'rented', 'maintenance')) DEFAULT 'available',
  current_lock_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(location_id, number)
);

-- Таблица аренд
CREATE TABLE IF NOT EXISTS public.rents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  cell_id UUID REFERENCES cells(id) ON DELETE CASCADE,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_until_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_auto_renew BOOLEAN DEFAULT TRUE,
  status TEXT CHECK (status IN ('active', 'cancelled', 'ended')) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица платежей
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rent_id UUID REFERENCES rents(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  cell_id UUID REFERENCES cells(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL,
  provider_id TEXT UNIQUE,
  status TEXT CHECK (status IN ('pending', 'completed', 'failed')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание индексов для производительности
CREATE INDEX idx_cells_status ON cells(status);
CREATE INDEX idx_rents_user_id ON rents(user_id);
CREATE INDEX idx_rents_status ON rents(status);
CREATE INDEX idx_payments_provider_id ON payments(provider_id);

-- Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE cells ENABLE ROW LEVEL SECURITY;
ALTER TABLE rents ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Политики доступа

-- Users: только свои данные
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

-- Cells: все могут читать доступные
CREATE POLICY "Anyone can view available cells" ON cells
  FOR SELECT USING (status = 'available');

-- Rents: только свои аренды
CREATE POLICY "Users can view own rents" ON rents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own rents" ON rents
  FOR UPDATE USING (auth.uid() = user_id);

-- Payments: только свои платежи
CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT USING (auth.uid() = user_id);

-- Пример данных для тестирования
INSERT INTO locations (id, name, address, lat, lng) VALUES
  (gen_random_uuid(), 'Склад Центр', 'Москва, ул. Примерная, д. 1', 55.751244, 37.618423);

-- Получаем ID локации для создания ячеек
DO $$
DECLARE
  location_id UUID;
BEGIN
  SELECT id INTO location_id FROM locations LIMIT 1;

  -- Создаем тестовые ячейки
  INSERT INTO cells (location_id, number, size, price_1m, current_lock_code) VALUES
    (location_id, '101', 'S', 1500, '1234'),
    (location_id, '102', 'S', 1500, '5678'),
    (location_id, '201', 'M', 2500, '9012'),
    (location_id, '202', 'M', 2500, '3456'),
    (location_id, '301', 'L', 4000, '7890'),
    (location_id, '302', 'L', 4000, '2468');
END $$;
