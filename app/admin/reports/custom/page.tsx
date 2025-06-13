"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

export default function CustomReportsPage() {
  const [motoristas, setMotoristas] = useState<any[]>([])
  const [veiculos, setVeiculos] = useState<any[]>([])
  const [reservas, setReservas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    motorista: "",
    veiculo: "",
    status: "",
    startDate: "",
    endDate: "",
  })

  useEffect(() => {
    fetchMotoristas()
    fetchVeiculos()
  }, [])

  useEffect(() => {
    fetchReservas()
  }, [filters])

  async function fetchMotoristas() {
    const { data } = await supabase.from("motoristas").select("id, nome")
    setMotoristas(data || [])
  }
  async function fetchVeiculos() {
    const { data } = await supabase.from("veiculos").select("id, modelo, placa")
    setVeiculos(data || [])
  }
  async function fetchReservas() {
    setLoading(true)
    setError(null)
    try {
      let query = supabase.from("reservas").select("id, motorista_id, veiculo_id, valor_total, status, data_inicio")
      if (filters.motorista) query = query.eq("motorista_id", filters.motorista)
      if (filters.veiculo) query = query.eq("veiculo_id", filters.veiculo)
      if (filters.status) query = query.eq("status", filters.status)
      if (filters.startDate) query = query.gte("data_inicio", filters.startDate)
      if (filters.endDate) query = query.lte("data_inicio", filters.endDate)
      const { data, error } = await query
      if (error) throw error
      setReservas(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar dados")
    } finally {
      setLoading(false)
    }
  }

  function exportToCSV() {
    const headers = ["ID", "Motorista", "Veículo", "Status", "Data", "Valor"]
    const csvContent = [
      headers.join(","),
      ...reservas.map(row => [
        row.id,
        motoristas.find(m => m.id === row.motorista_id)?.nome || "",
        veiculos.find(v => v.id === row.veiculo_id)?.modelo || "",
        row.status,
        row.data_inicio,
        row.valor_total
      ].join(","))
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = "relatorio-customizado.csv"
    link.click()
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Relatório Customizado</h1>
        <Button onClick={exportToCSV}>
          <Download className="w-4 h-4 mr-2" />
          Exportar CSV
        </Button>
      </div>
      <div className="flex flex-wrap gap-4 mb-4">
        <div>
          <label className="block text-sm mb-1">Motorista</label>
          <select value={filters.motorista} onChange={e => setFilters(f => ({ ...f, motorista: e.target.value }))} className="border rounded px-2 py-1">
            <option value="">Todos</option>
            {motoristas.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">Veículo</label>
          <select value={filters.veiculo} onChange={e => setFilters(f => ({ ...f, veiculo: e.target.value }))} className="border rounded px-2 py-1">
            <option value="">Todos</option>
            {veiculos.map(v => <option key={v.id} value={v.id}>{v.modelo} ({v.placa})</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">Status</label>
          <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))} className="border rounded px-2 py-1">
            <option value="">Todos</option>
            <option value="pendente">Pendente</option>
            <option value="concluido">Concluído</option>
            <option value="em andamento">Em Andamento</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">Data inicial</label>
          <input type="date" value={filters.startDate} onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))} className="border rounded px-2 py-1" />
        </div>
        <div>
          <label className="block text-sm mb-1">Data final</label>
          <input type="date" value={filters.endDate} onChange={e => setFilters(f => ({ ...f, endDate: e.target.value }))} className="border rounded px-2 py-1" />
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Reservas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left p-2">ID</th>
                  <th className="text-left p-2">Motorista</th>
                  <th className="text-left p-2">Veículo</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Data</th>
                  <th className="text-right p-2">Valor</th>
                </tr>
              </thead>
              <tbody>
                {reservas.map((row) => (
                  <tr key={row.id} className="border-t">
                    <td className="p-2">{row.id}</td>
                    <td className="p-2">{motoristas.find(m => m.id === row.motorista_id)?.nome || "-"}</td>
                    <td className="p-2">{veiculos.find(v => v.id === row.veiculo_id)?.modelo || "-"}</td>
                    <td className="p-2">{row.status}</td>
                    <td className="p-2">{row.data_inicio}</td>
                    <td className="text-right p-2">R$ {row.valor_total?.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {reservas.length === 0 && <div className="text-center text-gray-500 py-4">Nenhuma reserva encontrada para os filtros selecionados.</div>}
          </div>
        </CardContent>
      </Card>
      {loading && <div>Carregando...</div>}
      {error && <div className="text-red-500">Erro: {error}</div>}
    </div>
  )
} 