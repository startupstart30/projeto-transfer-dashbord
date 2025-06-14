"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Search, ChevronLeft, ChevronRight, Eye, MapPin, Calendar, Clock, Plus, User, Download, X, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import Papa from "papaparse"
import * as XLSX from "xlsx"

const STATUS_OPTIONS = [
  { label: "Todos", value: "all" },
  { label: "Pendente", value: "pending" },
  { label: "Agendado", value: "scheduled" },
  { label: "Em andamento", value: "in_progress" },
  { label: "Concluído", value: "completed" },
  { label: "Cancelado", value: "cancelled" },
]

export default function BookingsPage() {
  const [bookings, setBookings] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(8)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [showImport, setShowImport] = useState(false)
  const [importLoading, setImportLoading] = useState(false)
  const [importError, setImportError] = useState("")
  const [importSuccess, setImportSuccess] = useState("")
  const [csvPreview, setCsvPreview] = useState<any[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Busca reservas reais do Supabase
  useEffect(() => {
    async function fetchBookings() {
      setIsLoading(true)
      setError("")
      let query = supabase
        .from("vw_bookings_full")
        .select("id, user_id, pickup_location, dropoff_location, pickup_date, pickup_time, vehicle_name, driver_name, passengers, luggage, total_amount, status, payment_status, payment_method, created_at")
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter)
      }
      const { data, error } = await query.order("pickup_date", { ascending: false })
      if (error) {
        setError("Erro ao buscar reservas.")
        setIsLoading(false)
        return
      }
      setBookings(data || [])
      setIsLoading(false)
    }
    fetchBookings()
  }, [statusFilter])

  // Filtro de busca
  const filteredBookings = bookings.filter((booking) => {
    const search = searchTerm.toLowerCase()
    return (
      booking.id.toLowerCase().includes(search) ||
      (booking.driver_name || "").toLowerCase().includes(search) ||
      (booking.vehicle_name || "").toLowerCase().includes(search) ||
      (booking.pickup_location || "").toLowerCase().includes(search) ||
      (booking.dropoff_location || "").toLowerCase().includes(search)
    )
  })

  // Paginação
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentBookings = filteredBookings.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage)

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber)
  }

  // Exportação para CSV
  function exportToCSV() {
    const header = [
      "ID", "Data", "Hora", "Origem", "Destino", "Veículo", "Motorista", "Passageiros", "Bagagem", "Valor", "Status", "Pagamento"
    ]
    const rows = filteredBookings.map((b) => [
      b.id,
      b.pickup_date,
      b.pickup_time,
      b.pickup_location,
      b.dropoff_location,
      b.vehicle_name,
      b.driver_name,
      b.passengers,
      b.luggage,
      b.total_amount,
      b.status,
      b.payment_status
    ])
    const csvContent = [header, ...rows].map((e) => e.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", `reservas_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Exportação para Excel
  function exportToExcel() {
    const header = [
      "ID", "Data", "Hora", "Origem", "Destino", "Veículo", "Motorista", "Passageiros", "Bagagem", "Valor", "Status", "Pagamento"
    ];
    const rows = filteredBookings.map((b) => [
      b.id,
      b.pickup_date,
      b.pickup_time,
      b.pickup_location,
      b.dropoff_location,
      b.vehicle_name,
      b.driver_name,
      b.passengers,
      b.luggage,
      b.total_amount,
      b.status,
      b.payment_status
    ]);
    const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reservas");
    XLSX.writeFile(wb, `reservas_${Date.now()}.xlsx`);
  }

  // Função para processar CSV
  function handleCSVFile(e: any) {
    setImportError("")
    setImportSuccess("")
    const file = e.target.files[0]
    if (!file) return
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (!results.data || results.errors.length > 0) {
          setImportError("Erro ao processar o arquivo CSV.")
          setCsvPreview([])
          return
        }
        setCsvPreview(results.data as any[])
      },
      error: () => {
        setImportError("Erro ao ler o arquivo CSV.")
        setCsvPreview([])
      },
    })
  }

  // Função para importar reservas em lote
  async function handleImportSubmit() {
    setImportLoading(true)
    setImportError("")
    setImportSuccess("")
    // Validação básica dos dados
    const validRows = csvPreview.filter(row => row.pickup_location && row.dropoff_location && row.pickup_date && row.pickup_time && row.vehicle_id)
    if (validRows.length === 0) {
      setImportError("Nenhuma linha válida encontrada no CSV.")
      setImportLoading(false)
      return
    }
    // Inserção em lote
    const { error } = await supabase.from("bookings").insert(validRows)
    if (error) {
      setImportError("Erro ao importar reservas: " + error.message)
      setImportLoading(false)
      return
    }
    setImportSuccess("Reservas importadas com sucesso!")
    setImportLoading(false)
    setCsvPreview([])
    setShowImport(false)
    // Recarregar reservas
    setTimeout(() => window.location.reload(), 1200)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-[#E95440] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Carregando reservas...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return <div className="text-center text-red-600 font-semibold p-6">{error}</div>
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Reservas</h1>
        <div className="flex gap-2">
          <Link href="/admin/bookings/new">
            <button className="btn-primary bg-[#E95440] text-white flex items-center text-sm px-4 py-2 rounded-lg hover:bg-[#d64a36]">
              <Plus className="h-5 w-5 mr-2" />Nova Reserva
            </button>
          </Link>
          <button
            className="flex items-center px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors text-sm"
            onClick={exportToCSV}
            title="Exportar CSV"
          >
            <Download className="h-5 w-5 mr-2 text-gray-500" /> Exportar CSV
          </button>
          <button
            className="flex items-center px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors text-sm"
            onClick={exportToExcel}
            title="Exportar Excel"
          >
            <Download className="h-5 w-5 mr-2 text-green-600" /> Exportar Excel
          </button>
          <button
            className="flex items-center px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors text-sm"
            onClick={() => setShowImport(true)}
            title="Importar CSV"
          >
            <Plus className="h-5 w-5 mr-2 text-gray-500" /> Importar CSV
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-4">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
              statusFilter === opt.value
                ? "bg-[#E95440] text-white border-[#E95440]"
                : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"
            }`}
            onClick={() => { setStatusFilter(opt.value); setCurrentPage(1); }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Busca */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
        <div className="relative w-full max-w-md">
          <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por cliente, origem, destino, veículo, motorista..."
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E95440] focus:border-transparent"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          />
        </div>
      </div>

      {/* Listagem */}
      <div className="grid gap-4">
        {currentBookings.length === 0 ? (
          <div className="text-gray-500 text-center py-12">Nenhuma reserva encontrada.</div>
        ) : (
          currentBookings.map((booking) => (
            <div key={booking.id} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex-1 flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex items-center gap-3">
                  <User className="h-8 w-8 text-gray-400 bg-gray-100 rounded-full p-1" />
                  <div>
                    <div className="font-semibold text-lg">{booking.driver_name || "-"}</div>
                    <div className="text-xs text-gray-500">Motorista</div>
                  </div>
                </div>
                <div className="hidden md:block w-px h-10 bg-gray-200 mx-2" />
                <div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    {booking.pickup_date} <Clock className="h-4 w-4 text-gray-400 ml-2" /> {booking.pickup_time}
                  </div>
                  <div className="flex items-center gap-2 text-sm mt-1">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    {booking.pickup_location} → {booking.dropoff_location}
                  </div>
                </div>
                <div className="hidden md:block w-px h-10 bg-gray-200 mx-2" />
                <div>
                  <div className="text-sm font-medium">{booking.vehicle_name || "-"}</div>
                  <div className="text-xs text-gray-500">Veículo</div>
                </div>
                <div className="hidden md:block w-px h-10 bg-gray-200 mx-2" />
                <div>
                  <div className="text-sm font-medium">{booking.total_amount ? `R$ ${Number(booking.total_amount).toFixed(2)}` : "-"}</div>
                  <div className="text-xs text-gray-500">Valor</div>
                </div>
              </div>
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                <span
                  className={`px-3 py-1 text-xs rounded-full font-semibold text-center ${
                    booking.status === "completed"
                      ? "bg-green-100 text-green-800"
                      : booking.status === "in_progress"
                      ? "bg-blue-100 text-blue-800"
                      : booking.status === "pending"
                      ? "bg-yellow-100 text-yellow-800"
                      : booking.status === "scheduled"
                      ? "bg-purple-100 text-purple-800"
                      : booking.status === "cancelled"
                      ? "bg-red-100 text-red-800"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {STATUS_OPTIONS.find((s) => s.value === booking.status)?.label || booking.status}
                </span>
                <Link href={`/admin/bookings/${booking.id}`}>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Ver detalhes">
                    <Eye className="h-5 w-5 text-gray-500" />
                  </button>
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <button
            className="p-2 rounded hover:bg-gray-100"
            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            title="Página anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="font-medium text-sm">
            Página {currentPage} de {totalPages}
          </span>
          <button
            className="p-2 rounded hover:bg-gray-100"
            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            title="Próxima página"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Modal de Importação CSV */}
      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-lg relative">
            <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-600" onClick={() => setShowImport(false)}>
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold mb-4">Importar Reservas via CSV</h2>
            <input
              type="file"
              accept=".csv"
              ref={fileInputRef}
              onChange={handleCSVFile}
              className="mb-4"
            />
            {importError && <div className="text-red-600 text-sm mb-2">{importError}</div>}
            {importSuccess && <div className="text-green-600 text-sm mb-2">{importSuccess}</div>}
            {csvPreview.length > 0 && (
              <div className="mb-4 max-h-40 overflow-auto border rounded">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr>
                      {Object.keys(csvPreview[0]).map((col) => (
                        <th key={col} className="p-1 border-b bg-gray-50">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {csvPreview.slice(0, 10).map((row, idx) => (
                      <tr key={idx} className="odd:bg-gray-50">
                        {Object.values(row).map((val, i) => (
                          <td key={i} className="p-1 border-b">{String(val)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {csvPreview.length > 10 && <div className="text-xs text-gray-500 p-2">Exibindo as 10 primeiras linhas de {csvPreview.length}</div>}
              </div>
            )}
            <div className="flex gap-2 justify-end mt-2">
              <button
                className="px-4 py-2 rounded-lg border bg-gray-100 hover:bg-gray-200"
                onClick={() => setShowImport(false)}
                disabled={importLoading}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-[#E95440] text-white font-semibold hover:bg-[#d64a36] flex items-center gap-2"
                onClick={handleImportSubmit}
                disabled={importLoading || csvPreview.length === 0}
              >
                {importLoading && <Loader2 className="animate-spin w-4 h-4" />} Importar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
