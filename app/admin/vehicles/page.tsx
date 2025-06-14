"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import Link from "next/link"
import Image from "next/image"
import { Plus, Search, Edit, Trash2, ChevronLeft, ChevronRight, Filter, Download, AlertCircle } from "lucide-react"
import * as XLSX from "xlsx"

const STATUS_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "active", label: "Ativo" },
  { value: "maintenance", label: "Manutenção" },
  { value: "inactive", label: "Inativo" }
]
const VEHICLE_TYPES = ["Business Class", "First Class", "Business Van/SUV"]

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState("")
  const [type, setType] = useState("")
  const [year, setYear] = useState("")
  const [search, setSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8
  const [exportLoading, setExportLoading] = useState(false)
  const [exportSuccess, setExportSuccess] = useState("")
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)

  useEffect(() => {
    fetchVehicles()
  }, [status, type, year, search])

  async function fetchVehicles() {
    setLoading(true)
    setError(null)
    try {
      let query = supabase.from("vehicles").select("*")
      if (status) query = query.eq("status", status)
      if (type) query = query.eq("type", type)
      if (year) query = query.eq("year", year)
      if (search) query = query.or(`name.ilike.%${search}%,license_plate.ilike.%${search}%,type.ilike.%${search}%`)
      const { data, error } = await query.order("name", { ascending: true })
      if (error) throw error
      setVehicles(data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir este veículo? Esta ação não poderá ser desfeita.')) return
    setDeleteLoading(id)
    try {
      const { error } = await supabase.from("vehicles").delete().eq("id", id)
      if (error) throw error
      setVehicles(vehicles => vehicles.filter(v => v.id !== id))
    } catch (err: any) {
      setError(err.message)
    } finally {
      setDeleteLoading(null)
    }
  }

  // Paginação
  const totalPages = Math.ceil(vehicles.length / itemsPerPage)
  const paginatedVehicles = vehicles.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  function exportToCSV() {
    setExportLoading(true)
    setExportSuccess("")
    try {
      const headers = ["Nome/Modelo", "Tipo", "Ano", "Placa", "Passageiros", "Bagagem", "Status"]
      const csvContent = [
        headers.join(","),
        ...vehicles.map(row => [
          row.name,
          row.type,
          row.year,
          row.license_plate,
          row.passengers,
          row.luggage,
          STATUS_OPTIONS.find(opt => opt.value === row.status)?.label || row.status
        ].join(","))
      ].join("\n")

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      link.href = URL.createObjectURL(blob)
      link.download = "veiculos.csv"
      link.click()
      setExportSuccess("Exportação CSV realizada com sucesso!")
    } catch (err) {
      setError("Erro ao exportar dados")
    } finally {
      setExportLoading(false)
      setTimeout(() => setExportSuccess(""), 2000)
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Veículos</h1>
        <div className="flex gap-2">
          <button
            onClick={exportToCSV}
            disabled={exportLoading || vehicles.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {exportLoading ? "Exportando..." : "Exportar CSV"}
          </button>
          <Link
            href="/admin/vehicles/new"
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" />
            Novo Veículo
          </Link>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2 items-end">
        <div>
          <label className="block text-xs">Status</label>
          <select
            className="border rounded px-2 py-1"
            value={status}
            onChange={e => setStatus(e.target.value)}
          >
            {STATUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs">Tipo</label>
          <select
            className="border rounded px-2 py-1"
            value={type}
            onChange={e => setType(e.target.value)}
          >
            <option value="">Todos</option>
            {VEHICLE_TYPES.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs">Ano</label>
          <input
            type="number"
            className="border rounded px-2 py-1"
            value={year}
            onChange={e => setYear(e.target.value)}
            placeholder="Todos"
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs">Buscar</label>
          <div className="relative">
            <input
              type="text"
              className="border rounded px-2 py-1 w-full pl-8"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Nome, placa, tipo..."
            />
            <Search className="w-4 h-4 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>
      </div>

      {exportSuccess && (
        <div className="mb-4 p-2 bg-green-100 text-green-800 rounded text-sm">
          {exportSuccess}
        </div>
      )}

      <div className="bg-white border rounded">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Carregando veículos...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-500 flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Erro: {error}
          </div>
        ) : paginatedVehicles.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">Nenhum veículo encontrado.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-muted">
                  <th className="p-2 text-left">Nome/Modelo</th>
                  <th className="p-2 text-left">Tipo</th>
                  <th className="p-2 text-left">Ano</th>
                  <th className="p-2 text-left">Placa</th>
                  <th className="p-2 text-left">Passageiros</th>
                  <th className="p-2 text-left">Bagagem</th>
                  <th className="p-2 text-left">Status</th>
                  <th className="p-2 text-left">Ações</th>
                </tr>
              </thead>
              <tbody>
                {paginatedVehicles.map(vehicle => (
                  <tr key={vehicle.id} className="border-t">
                    <td className="p-2">{vehicle.name}</td>
                    <td className="p-2">{vehicle.type}</td>
                    <td className="p-2">{vehicle.year}</td>
                    <td className="p-2">{vehicle.license_plate}</td>
                    <td className="p-2">{vehicle.passengers}</td>
                    <td className="p-2">{vehicle.luggage}</td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        vehicle.status === "active" ? "bg-green-100 text-green-800" :
                        vehicle.status === "maintenance" ? "bg-yellow-100 text-yellow-800" :
                        "bg-red-100 text-red-800"
                      }`}>
                        {STATUS_OPTIONS.find(opt => opt.value === vehicle.status)?.label || vehicle.status}
                      </span>
                    </td>
                    <td className="p-2">
                      <div className="flex gap-2">
                        <Link
                          href={`/admin/vehicles/${vehicle.id}/edit`}
                          className="text-blue-600 hover:underline"
                        >
                          Editar
                        </Link>
                        <button
                          className={`text-red-600 hover:underline ${deleteLoading === vehicle.id ? "opacity-50 cursor-not-allowed" : ""}`}
                          onClick={() => handleDelete(vehicle.id)}
                          disabled={deleteLoading === vehicle.id}
                        >
                          {deleteLoading === vehicle.id ? "Excluindo..." : "Excluir"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-between items-center p-4 border-t">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
              Anterior
            </button>
            <span className="text-sm text-gray-600">
              Página {currentPage} de {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
            >
              Próxima
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
