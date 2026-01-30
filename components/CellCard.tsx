'use client'

import { useRouter } from 'next/navigation'

type CellCardProps = {
  cell: {
    id: string
    number: string
    size: 'S' | 'M' | 'L'
    price_1m: number
    status: string
  }
}

const sizeDescriptions = {
  S: '1м² - для сезонных вещей',
  M: '2м² - для мебели и коробок',
  L: '4м² - для товарных остатков'
}

export default function CellCard({ cell }: CellCardProps) {
  const router = useRouter()

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:border-primary transition-colors">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-xl font-bold">Ячейка #{cell.number}</h3>
          <p className="text-gray-600 text-sm">{sizeDescriptions[cell.size]}</p>
        </div>
        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
          {cell.size}
        </span>
      </div>

      <div className="flex justify-between items-center">
        <div>
          <p className="text-2xl font-bold text-primary">{cell.price_1m} ₽</p>
          <p className="text-gray-500 text-sm">в месяц</p>
        </div>
        <button
          onClick={() => router.push(`/rent/${cell.id}`)}
          className="btn-primary"
        >
          Арендовать
        </button>
      </div>
    </div>
  )
}
