'use client'

import { useEffect, useRef, useState } from 'react'

export default function MapView() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    // Проверяем наличие API ключа
    if (!process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY || process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY === 'your_yandex_maps_api_key') {
      setError(true)
      return
    }

    // Загрузка Яндекс.Карт API
    if (typeof window !== 'undefined' && !window.ymaps) {
      const script = document.createElement('script')
      script.src = `https://api-maps.yandex.ru/2.1/?apikey=${process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY}&lang=ru_RU`
      script.async = true
      script.onload = initMap
      script.onerror = () => setError(true)
      document.head.appendChild(script)
    } else if (window.ymaps) {
      initMap()
    }

    // Cleanup при размонтировании
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy()
        mapInstanceRef.current = null
      }
    }
  }, [])

  function initMap() {
    if (!mapRef.current || mapInstanceRef.current) return

    try {
      window.ymaps.ready(() => {
        // Проверяем еще раз, не создана ли уже карта
        if (mapInstanceRef.current) return

        const map = new window.ymaps.Map(mapRef.current, {
          center: [55.751244, 37.618423], // Москва (замените на ваши координаты)
          zoom: 15,
          controls: ['zoomControl']
        })

        mapInstanceRef.current = map

        // Добавляем метку склада
        const placemark = new window.ymaps.Placemark(
          [55.751244, 37.618423],
          {
            balloonContent: '<strong>Склад "Бери Кладовку"</strong><br/>Круглосуточный доступ'
          },
          {
            preset: 'islands#blueDotIcon'
          }
        )

        map.geoObjects.add(placemark)
      })
    } catch (err) {
      setError(true)
    }
  }

  return (
    <div className="card h-[500px]">
      <h2 className="text-2xl font-bold mb-4">Наше расположение</h2>
      {error ? (
        <div className="w-full h-[400px] rounded-lg bg-gray-100 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <p className="mb-2">📍 Москва, ул. Примерная, д. 1</p>
            <p className="text-sm">Круглосуточный доступ</p>
          </div>
        </div>
      ) : (
        <div ref={mapRef} className="w-full h-[400px] rounded-lg bg-gray-100" />
      )}
    </div>
  )
}

declare global {
  interface Window {
    ymaps: any
  }
}
