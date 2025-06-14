"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import Link from "next/link"

export default function DriverProfilePage({ params }: { params: { id: string } }) {
  const [driver, setDriver] = useState<any>(null)
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchProfile()
  }, [])

  async function fetchProfile() {
    setLoading(true)
    setError(null)
    try {
      const { data: d, error: errDriver } = await supabase
        .from("drivers")
        .select("*, vehicle:vehicle_id(name)")
        .eq("id", params.id)
        .single()
      if (errDriver || !d) throw errDriver || new Error("Motorista não encontrado")
      setDriver(d)
      const { data: b, error: errBookings } = await supabase
        .from("bookings")
        .select("id, pickup_location, dropoff_location, pickup_date, status, rating, total_amount")
        .eq("driver_id", params.id)
        .order("pickup_date", { ascending: false })
      if (errBookings) throw errBookings
      setBookings(b || [])
    } catch (err: any) {
      setError(err.message || "Erro ao carregar dados")
    } finally {
      setLoading(false)
    }
  }

  function renderStars(rating: number) {
    return (
      <span className="ml-1 flex">
        {[...Array(5)].map((_, i) => (
          <svg
            key={i}
            className={`w-4 h-4 ${i < Math.round(rating) ? "text-yellow-400" : "text-gray-300"}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </span>
    )
  }

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Carregando perfil...</div>
  }
  if (error || !driver) {
    return <div className="p-8 text-center text-red-500">{error || "Motorista não encontrado."}</div>
  }

  // Calcular rating médio
  const ratings = bookings.map(b => b.rating).filter((r: any) => typeof r === "number")
  const avgRating = ratings.length > 0 ? (ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length) : null

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Perfil do Motorista</h1>
      <div className="flex flex-col md:flex-row gap-6 mb-6">
        <div className="flex flex-col items-center md:items-start">
          {driver.avatar_url ? (
            <img src={driver.avatar_url} alt={driver.full_name} className="w-32 h-32 rounded-full object-cover border mb-2" />
          ) : (
            <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium text-4xl mb-2">
              {driver.full_name.split(" ").map((n: string) => n[0]).join("")}
            </div>
          )}
          <div className="text-lg font-semibold">{driver.full_name}</div>
          <div className="text-sm text-gray-500 mb-1">{driver.status === "active" ? "Ativo" : driver.status === "suspended" ? "Suspenso" : "Inativo"}</div>
          <div className="text-sm text-gray-600">{driver.phone}</div>
          <div className="text-sm text-gray-600">{driver.email}</div>
          <div className="text-sm text-gray-600">CNH: {driver.license_number}</div>
          <div className="text-sm text-gray-600">Veículo: {driver.vehicle?.name || "-"}</div>
          <div className="flex items-center mt-2">
            <span className="text-sm font-medium">Rating:</span>
            {avgRating !== null ? (
              <span className="ml-1 text-lg font-semibold">{avgRating.toFixed(1)}</span>
            ) : (
              <span className="ml-1 text-gray-400">-</span>
            )}
            {avgRating !== null && renderStars(avgRating)}
          </div>
          <div className="text-sm text-gray-600 mt-2">Total de viagens: {bookings.length}</div>
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-bold mb-2">Histórico de Viagens</h2>
          <div className="overflow-x-auto border rounded">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="bg-muted">
                  <th className="p-2 text-left">Data</th>
                  <th className="p-2 text-left">Origem</th>
                  <th className="p-2 text-left">Destino</th>
                  <th className="p-2 text-left">Status</th>
                  <th className="p-2 text-left">Rating</th>
                  <th className="p-2 text-left">Valor</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(b => (
                  <tr key={b.id} className="border-t">
                    <td className="p-2">{b.pickup_date}</td>
                    <td className="p-2">{b.pickup_location}</td>
                    <td className="p-2">{b.dropoff_location}</td>
                    <td className="p-2 capitalize">{b.status}</td>
                    <td className="p-2">{typeof b.rating === "number" ? b.rating.toFixed(1) : "-"}</td>
                    <td className="p-2">{b.total_amount !== undefined ? `R$ ${Number(b.total_amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "-"}</td>
                  </tr>
                ))}
                {bookings.length === 0 && (
                  <tr><td colSpan={6} className="p-4 text-center text-gray-500">Nenhuma viagem encontrada.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <Link href="/admin/drivers" className="text-blue-600 hover:underline">Voltar para lista de motoristas</Link>
    </div>
  )
} 