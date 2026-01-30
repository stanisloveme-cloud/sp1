import CellCatalog from '@/components/CellCatalog'
import MapView from '@/components/MapView'

export default function Home() {
  return (
    <main className="min-h-screen">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-primary">Бери Кладовку</h1>
          <p className="text-gray-600 mt-2">Склад у дома. Аренда от 1 месяца</p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <MapView />
          <CellCatalog />
        </div>
      </div>
    </main>
  )
}
