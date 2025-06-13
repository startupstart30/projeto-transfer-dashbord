"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, FileSpreadsheet, FileText } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import * as XLSX from "xlsx"
import { jsPDF } from "jspdf"
import "jspdf-autotable"

export default function VehiclesReportsPage() {
  const [vehicles, setVehicles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#0088FE", "#FFBB28"]

  useEffect(() => {
    fetchVehicles()
  }, [startDate, endDate])

  async function fetchVehicles() {
    setLoading(true)
    setError(null)
    try {
      // Buscar todos os veículos
      const { data: veiculos, error: errVehicles } = await supabase
        .from("veiculos")
        .select("id, modelo, placa")
      if (errVehicles) throw errVehicles

      // Buscar reservas agrupadas por veículo
      let query = supabase
        .from("reservas")
        .select("id, veiculo_id, valor_total, status, data_inicio")
      if (startDate) query = query.gte("data_inicio", startDate)
      if (endDate) query = query.lte("data_inicio", endDate)
      const { data: reservas, error: errReservas } = await query
      if (errReservas) throw errReservas

      // Agrupar por veículo
      const stats = veiculos.map((v) => {
        const reservasVeiculo = reservas.filter((r) => r.veiculo_id === v.id)
        const receita = reservasVeiculo.reduce((acc, r) => acc + (r.valor_total || 0), 0)
        const pendentes = reservasVeiculo.filter((r) => r.status === "pendente").length
        return {
          ...v,
          totalReservas: reservasVeiculo.length,
          receita,
          pendentes,
        }
      })
      setVehicles(stats)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar dados")
    } finally {
      setLoading(false)
    }
  }

  function exportToCSV() {
    const headers = ["Veículo", "Placa", "Total de Corridas", "Receita", "Reservas Pendentes"]
    const csvContent = [
      headers.join(","),
      ...vehicles.map(row => [
        `${row.modelo}`,
        row.placa,
        row.totalReservas,
        row.receita,
        row.pendentes
      ].join(","))
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = "relatorio-veiculos.csv"
    link.click()
  }

  function exportToExcel() {
    const worksheet = XLSX.utils.json_to_sheet(
      vehicles.map(v => ({
        "Veículo": v.modelo,
        "Placa": v.placa,
        "Total de Corridas": v.totalReservas,
        "Receita": v.receita,
        "Reservas Pendentes": v.pendentes
      }))
    )
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Veículos")
    XLSX.writeFile(workbook, "relatorio-veiculos.xlsx")
  }

  function exportToPDF() {
    const doc = new jsPDF()
    
    // Título
    doc.setFontSize(16)
    doc.text("Relatório de Veículos", 14, 15)
    
    // Período
    doc.setFontSize(10)
    const periodo = startDate && endDate 
      ? `Período: ${new Date(startDate).toLocaleDateString()} a ${new Date(endDate).toLocaleDateString()}`
      : "Período: Todos"
    doc.text(periodo, 14, 25)

    // Tabela
    const tableData = vehicles.map(v => [
      v.modelo,
      v.placa,
      v.totalReservas.toString(),
      `R$ ${v.receita.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      v.pendentes.toString()
    ])

    doc.autoTable({
      head: [["Veículo", "Placa", "Total de Corridas", "Receita", "Pendentes"]],
      body: tableData,
      startY: 35,
      theme: "grid",
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 66, 66] }
    })

    doc.save("relatorio-veiculos.pdf")
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Relatório por Veículo</h1>
        <div className="flex gap-2">
          <Button onClick={exportToCSV} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            CSV
          </Button>
          <Button onClick={exportToExcel} variant="outline">
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Excel
          </Button>
          <Button onClick={exportToPDF} variant="outline">
            <FileText className="w-4 h-4 mr-2" />
            PDF
          </Button>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Receita por Veículo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vehicles} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="modelo" type="category" width={120} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="receita" name="Receita" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Proporção de Reservas Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={vehicles.map(v => ({ modelo: v.modelo, value: v.pendentes }))}
                    dataKey="value"
                    nameKey="modelo"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label
                  >
                    {vehicles.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="flex gap-4 mb-4">
        <div>
          <label className="block text-sm mb-1">Data inicial</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="border rounded px-2 py-1" />
        </div>
        <div>
          <label className="block text-sm mb-1">Data final</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="border rounded px-2 py-1" />
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Veículos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left p-2">Modelo</th>
                  <th className="text-left p-2">Placa</th>
                  <th className="text-right p-2">Total de Corridas</th>
                  <th className="text-right p-2">Receita</th>
                  <th className="text-right p-2">Pendentes</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((row) => (
                  <tr key={row.id} className="border-t">
                    <td className="p-2">{row.modelo}</td>
                    <td className="p-2">{row.placa}</td>
                    <td className="text-right p-2">{row.totalReservas}</td>
                    <td className="text-right p-2">R$ {row.receita.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                    <td className="text-right p-2">{row.pendentes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {vehicles.length === 0 && <div className="text-center text-gray-500 py-4">Nenhum veículo encontrado para o período.</div>}
          </div>
        </CardContent>
      </Card>
      {loading && <div>Carregando...</div>}
      {error && <div className="text-red-500">Erro: {error}</div>}
    </div>
  )
} 