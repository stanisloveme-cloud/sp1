import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Бери Кладовку - Аренда складских ячеек у дома',
  description: 'Ультра-локальное хранение вещей. Склад у дома с доступом 24/7',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body className="bg-gray-50">{children}</body>
    </html>
  )
}
