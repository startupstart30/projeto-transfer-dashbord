"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import Link from "next/link"
import Image from "next/image"
import { Plus, Search, Edit, Trash2, ChevronLeft, ChevronRight, Filter, Download } from "lucide-react"
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

  useEffect(() => {
    fetchVehicles()
  }, [status, type, year, search])

  async function fetchVehicles() {
    setLoading(true)
    setError(null)
    let query = supabase.from("vehicles").select("*")
    if (status) query = query.eq("status", status)
    if (type) query = query.eq("type", type)
    if (year) query = query.eq("year", year)
    if (search) query = query.or(`name.ilike.%${search}%,license_plate.ilike.%${search}%,type.ilike.%${search}%`)
    const { data, error } = await query.order("name", { ascending: true })
    if (error) setError(error.message)
    setVehicles(data || [])
    setLoading(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir este veículo? Esta ação não poderá ser desfeita.')) return;
    setLoading(true);
    const { error } = await supabase.from("vehicles").delete().eq("id", id);
    if (error) {
      setError(error.message);
    } else {
      setVehicles(vehicles => vehicles.filter(v => v.id !== id));
    }
    setLoading(false);
  }

  // Paginação
  const totalPages = Math.ceil(vehicles.length / itemsPerPage)
  const paginatedVehicles = vehicles.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  function exportToCSV() {
    setExportLoading(true)
    setExportSuccess("")
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
    setExportLoading(false)
    setExportSuccess("Exportação CSV realizada com sucesso!")
    setTimeout(() => setExportSuccess(""), 2000)
  }

  function exportToExcel() {
    setExportLoading(true)
    setExportSuccess("")
    const worksheet = XLSX.utils.json_to_sheet(
      vehicles.map(v => ({
        "Nome/Modelo": v.name,
        "Tipo": v.type,
        "Ano": v.year,
        "Placa": v.license_plate,
        "Passageiros": v.passengers,
        "Bagagem": v.luggage,
        "Status": STATUS_OPTIONS.find(opt => opt.value === v.status)?.label || v.status
      }))
    )
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Veículos")
    XLSX.writeFile(workbook, "veiculos.xlsx")
    setExportLoading(false)
    setExportSuccess("Exportação Excel realizada com sucesso!")
    setTimeout(() => setExportSuccess(""), 2000)
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Veículos</h1>
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
          <label className="block text-xs">Tipo</label>
          <select className="border rounded px-2 py-1" value={type} onChange={e => setType(e.target.value)}>
            <option value="">Todos</option>
            {VEHICLE_TYPES.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs">Ano</label>
          <input type="number" className="border rounded px-2 py-1" value={year} onChange={e => setYear(e.target.value)} placeholder="Todos" />
        </div>
        <div>
          <label className="block text-xs">Buscar</label>
          <input type="text" className="border rounded px-2 py-1" value={search} onChange={e => setSearch(e.target.value)} placeholder="Nome, placa, tipo..." />
        </div>
        <Link href="/admin/vehicles/new" className="ml-auto bg-primary text-white px-4 py-2 rounded hover:bg-primary/90">Novo Veículo</Link>
        <div className="flex flex-col sm:flex-row gap-2">
          <button type="button" className="bg-secondary text-black px-4 py-2 rounded hover:bg-secondary/80 disabled:opacity-60" onClick={exportToCSV} disabled={exportLoading}>
            {exportLoading ? "Exportando..." : "Exportar CSV"}
          </button>
          <button type="button" className="bg-secondary text-black px-4 py-2 rounded hover:bg-secondary/80 disabled:opacity-60" onClick={exportToExcel} disabled={exportLoading}>
            {exportLoading ? "Exportando..." : "Exportar Excel"}
          </button>
        </div>
        {exportSuccess && <div className="text-green-600 text-xs ml-2">{exportSuccess}</div>}
      </div>
      <div className="border rounded overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Carregando...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">Erro: {error}</div>
        ) : paginatedVehicles.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">Nenhum veículo encontrado.</div>
        ) : (
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
                  <td className="p-2 capitalize">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      vehicle.status === "active" ? "bg-green-100 text-green-800" :
                      vehicle.status === "maintenance" ? "bg-yellow-100 text-yellow-800" :
                      "bg-red-100 text-red-800"}`}>{
                        STATUS_OPTIONS.find(opt => opt.value === vehicle.status)?.label || vehicle.status
                    }</span>
                  </td>
                  <td className="p-2 flex gap-2">
                    <Link href={`/admin/vehicles/${vehicle.id}/edit`} className="text-blue-600 hover:underline">Editar</Link>
                    <button className="text-red-600 hover:underline" onClick={() => handleDelete(vehicle.id)}>Excluir</button>
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
