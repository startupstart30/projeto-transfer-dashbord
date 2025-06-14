"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import Link from "next/link"
import {
  Plus,
  Search,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Download,
  Phone,
  Mail,
  Calendar,
} from "lucide-react"

const STATUS_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "active", label: "Ativo" },
  { value: "inactive", label: "Inativo" },
  { value: "suspended", label: "Suspenso" }
]

export default function DriversPage() {
  const [drivers, setDrivers] = useState<any[]>([])
  const [vehicles, setVehicles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState("")
  const [vehicle, setVehicle] = useState("")
  const [ratingMin, setRatingMin] = useState("")
  const [search, setSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  useEffect(() => {
    fetchVehicles()
  }, [])

  useEffect(() => {
    fetchDrivers()
  }, [status, vehicle, ratingMin, search])

  async function fetchVehicles() {
    const { data } = await supabase.from("vehicles").select("id, name")
    setVehicles(data || [])
  }

  async function fetchDrivers() {
    setLoading(true)
    setError(null)
    let query = supabase.from("drivers").select("*, vehicle:vehicle_id(name)")
    if (status) query = query.eq("status", status)
    if (vehicle) query = query.eq("vehicle_id", vehicle)
    if (search) query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,license_number.ilike.%${search}%`)
    const { data, error } = await query.order("full_name", { ascending: true })
    if (error) {
      setError(error.message)
      setDrivers([])
      setLoading(false)
      return
    }
    // Buscar ratings e viagens
    const ids = data.map((d: any) => d.id)
    const { data: bookings } = await supabase.from("bookings").select("id, driver_id, rating").in("driver_id", ids)
    // Calcular rating médio e total de viagens
    const driversWithStats = data.map((d: any) => {
      const bookingsDriver = (bookings || []).filter((b: any) => b.driver_id === d.id)
      const ratings = bookingsDriver.map((b: any) => b.rating).filter((r: any) => typeof r === "number")
      const avgRating = ratings.length > 0 ? (ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length) : null
      return {
        ...d,
        avgRating,
        totalTrips: bookingsDriver.length
      }
    })
    // Filtro de rating mínimo
    const filtered = ratingMin ? driversWithStats.filter((d: any) => d.avgRating === null || d.avgRating >= Number(ratingMin)) : driversWithStats
    setDrivers(filtered)
    setLoading(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir este motorista? Esta ação não poderá ser desfeita.')) return;
    setLoading(true);
    const { error } = await supabase.from("drivers").delete().eq("id", id);
    if (error) {
      setError(error.message);
    } else {
      setDrivers(drivers => drivers.filter(d => d.id !== id));
    }
    setLoading(false);
  }

  // Paginação
  const totalPages = Math.ceil(drivers.length / itemsPerPage)
  const paginatedDrivers = drivers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Motoristas</h1>
      <div className="mb-4 flex flex-wrap gap-2 items-end">
        <div>
          <label className="block text-xs">Status</label>
          <select className="border rounded px-2 py-1" value={status} onChange={e => setStatus(e.target.value)}>
            {STATUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs">Veículo</label>
          <select className="border rounded px-2 py-1" value={vehicle} onChange={e => setVehicle(e.target.value)}>
            <option value="">Todos</option>
            {vehicles.map(v => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs">Rating Mínimo</label>
          <input type="number" min="0" max="5" step="0.1" className="border rounded px-2 py-1" value={ratingMin} onChange={e => setRatingMin(e.target.value)} placeholder="0" />
        </div>
        <div>
          <label className="block text-xs">Buscar</label>
          <input type="text" className="border rounded px-2 py-1" value={search} onChange={e => setSearch(e.target.value)} placeholder="Nome, email, CNH..." />
        </div>
        <Link href="/admin/drivers/new" className="ml-auto bg-primary text-white px-4 py-2 rounded hover:bg-primary/90">Novo Motorista</Link>
      </div>
      <div className="border rounded overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Carregando...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">Erro: {error}</div>
        ) : paginatedDrivers.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">Nenhum motorista encontrado.</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-muted">
                <th className="p-2 text-left">Nome</th>
                <th className="p-2 text-left">Telefone</th>
                <th className="p-2 text-left">Email</th>
                <th className="p-2 text-left">CNH</th>
                <th className="p-2 text-left">Status</th>
                <th className="p-2 text-left">Veículo</th>
                <th className="p-2 text-left">Rating</th>
                <th className="p-2 text-left">Viagens</th>
                <th className="p-2 text-left">Ações</th>
              </tr>
            </thead>
            <tbody>
              {paginatedDrivers.map(driver => (
                <tr key={driver.id} className="border-t">
                  <td className="p-2">
                    <Link href={`/admin/drivers/${driver.id}`} className="text-blue-600 hover:underline">{driver.full_name}</Link>
                  </td>
                  <td className="p-2">{driver.phone}</td>
                  <td className="p-2">{driver.email}</td>
                  <td className="p-2">{driver.license_number}</td>
                  <td className="p-2 capitalize">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      driver.status === "active" ? "bg-green-100 text-green-800" :
                      driver.status === "suspended" ? "bg-yellow-100 text-yellow-800" :
                      "bg-red-100 text-red-800"}`}>{
                        STATUS_OPTIONS.find(opt => opt.value === driver.status)?.label || driver.status
                    }</span>
                  </td>
                  <td className="p-2">{driver.vehicle?.name || "-"}</td>
                  <td className="p-2">{driver.avgRating !== null && driver.avgRating !== undefined ? driver.avgRating.toFixed(1) : "-"}</td>
                  <td className="p-2">{driver.totalTrips}</td>
                  <td className="p-2 flex gap-2">
                    <Link href={`/admin/drivers/${driver.id}/edit`} className="text-blue-600 hover:underline">Editar</Link>
                    <button className="text-red-600 hover:underline" onClick={() => handleDelete(driver.id)}>Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <nav className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className={`p-2 rounded-md ${currentPage === 1 ? "text-gray-400 cursor-not-allowed" : "text-gray-700 hover:bg-gray-100"}`}
            >
              &lt;
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1 rounded-md ${currentPage === page ? "bg-primary text-white" : "text-gray-700 hover:bg-gray-100"}`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`p-2 rounded-md ${currentPage === totalPages ? "text-gray-400 cursor-not-allowed" : "text-gray-700 hover:bg-gray-100"}`}
            >
              &gt;
            </button>
          </nav>
        </div>
      )}
    </div>
  )
}
