"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, FileSpreadsheet, FileText } from "lucide-react"
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

export default function DriversReportsPage() {
  const [drivers, setDrivers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  useEffect(() => {
    fetchDrivers()
  }, [startDate, endDate])

  async function fetchDrivers() {
    setLoading(true)
    setError(null)
    try {
      // Buscar todos os motoristas
      const { data: motoristas, error: errDrivers } = await supabase
        .from("motoristas")
        .select("id, nome")
      if (errDrivers) throw errDrivers

      // Buscar reservas agrupadas por motorista
      let query = supabase
        .from("reservas")
        .select("id, motorista_id, valor_total, status, data_inicio")
      if (startDate) query = query.gte("data_inicio", startDate)
      if (endDate) query = query.lte("data_inicio", endDate)
      const { data: reservas, error: errReservas } = await query
      if (errReservas) throw errReservas

      // Agrupar por motorista
      const stats = motoristas.map((m) => {
        const reservasMotorista = reservas.filter((r) => r.motorista_id === m.id)
        const receita = reservasMotorista.reduce((acc, r) => acc + (r.valor_total || 0), 0)
        const pendentes = reservasMotorista.filter((r) => r.status === "pendente").length
        return {
          ...m,
          totalReservas: reservasMotorista.length,
          receita,
          pendentes,
        }
      })
      setDrivers(stats)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar dados")
    } finally {
      setLoading(false)
    }
  }

  function exportToCSV() {
    const headers = ["Motorista", "Total de Corridas", "Receita", "Reservas Pendentes"]
    const csvContent = [
      headers.join(","),
      ...drivers.map(row => [
        row.nome,
        row.totalReservas,
        row.receita,
        row.pendentes
      ].join(","))
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = "relatorio-motoristas.csv"
    link.click()
  }

  function exportToExcel() {
    const worksheet = XLSX.utils.json_to_sheet(
      drivers.map(row => ({
        'Motorista': row.nome,
        'Total de Corridas': row.totalReservas,
        'Receita': row.receita,
        'Reservas Pendentes': row.pendentes
      }))
    )
    
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Relatório de Motoristas')
    XLSX.writeFile(workbook, 'relatorio-motoristas.xlsx')
  }

  function exportToPDF() {
    const doc = new jsPDF()
    
    // Título
    doc.setFontSize(16)
    doc.text('Relatório de Motoristas', 14, 15)
    
    // Período
    if (startDate || endDate) {
      doc.setFontSize(10)
      doc.text(`Período: ${startDate || 'Início'} até ${endDate || 'Fim'}`, 14, 25)
    }
    
    // Tabela
    const tableData = drivers.map(row => [
      row.nome,
      row.totalReservas.toString(),
      `R$ ${row.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      row.pendentes.toString()
    ])
    
    doc.autoTable({
      head: [['Motorista', 'Total de Corridas', 'Receita', 'Reservas Pendentes']],
      body: tableData,
      startY: startDate || endDate ? 35 : 25,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [136, 132, 216] }
    })
    
    doc.save('relatorio-motoristas.pdf')
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Relatório por Motorista</h1>
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
          <CardTitle>Motoristas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left p-2">Nome</th>
                  <th className="text-right p-2">Total de Corridas</th>
                  <th className="text-right p-2">Receita</th>
                  <th className="text-right p-2">Pendentes</th>
                </tr>
              </thead>
              <tbody>
                {drivers.map((row) => (
                  <tr key={row.id} className="border-t">
                    <td className="p-2">{row.nome}</td>
                    <td className="text-right p-2">{row.totalReservas}</td>
                    <td className="text-right p-2">R$ {row.receita.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                    <td className="text-right p-2">{row.pendentes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {drivers.length === 0 && <div className="text-center text-gray-500 py-4">Nenhum motorista encontrado para o período.</div>}
          </div>
        </CardContent>
      </Card>
      {loading && <div>Carregando...</div>}
      {error && <div className="text-red-500">Erro: {error}</div>}
    </div>
  )
} 