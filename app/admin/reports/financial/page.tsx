"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, FileSpreadsheet, FileText } from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

export default function FinancialReportsPage() {
  const [monthlyData, setMonthlyData] = useState<any[]>([])
  const [statusData, setStatusData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchFinancialData()
  }, [])

  async function fetchFinancialData() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("reservas")
        .select("data_inicio, valor_total, status")
        .order("data_inicio", { ascending: true })

      if (error) throw error

      // Processar dados para formato mensal
      const monthly = data.reduce((acc: any, reserva) => {
        const date = new Date(reserva.data_inicio)
        const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`
        
        if (!acc[monthYear]) {
          acc[monthYear] = {
            mes: monthYear,
            receita: 0,
            reservas: 0,
            pendentes: 0,
          }
        }

        acc[monthYear].receita += reserva.valor_total || 0
        acc[monthYear].reservas += 1
        if (reserva.status === "pendente") {
          acc[monthYear].pendentes += 1
        }

        return acc
      }, {})

      setMonthlyData(Object.values(monthly))
      // Proporção de status
      const statusMap: Record<string, number> = {}
      data.forEach((r: any) => {
        statusMap[r.status] = (statusMap[r.status] || 0) + 1
      })
      setStatusData(Object.entries(statusMap).map(([status, value]) => ({ status, value })))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar dados")
    } finally {
      setLoading(false)
    }
  }

  function exportToCSV() {
    const headers = ["Mês", "Receita Total", "Total de Reservas", "Reservas Pendentes"]
    const csvContent = [
      headers.join(","),
      ...monthlyData.map(row => [
        row.mes,
        row.receita,
        row.reservas,
        row.pendentes
      ].join(","))
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = "relatorio-financeiro.csv"
    link.click()
  }

  function exportToExcel() {
    const worksheet = XLSX.utils.json_to_sheet(
      monthlyData.map(row => ({
        'Mês': row.mes,
        'Receita Total': row.receita,
        'Total de Reservas': row.reservas,
        'Reservas Pendentes': row.pendentes
      }))
    )
    
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Relatório Financeiro')
    XLSX.writeFile(workbook, 'relatorio-financeiro.xlsx')
  }

  function exportToPDF() {
    const doc = new jsPDF()
    
    // Título
    doc.setFontSize(16)
    doc.text('Relatório Financeiro', 14, 15)
    
    // Tabela
    const tableData = monthlyData.map(row => [
      row.mes,
      `R$ ${row.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      row.reservas.toString(),
      row.pendentes.toString()
    ])
    
    doc.autoTable({
      head: [['Mês', 'Receita Total', 'Total de Reservas', 'Reservas Pendentes']],
      body: tableData,
      startY: 25,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [136, 132, 216] }
    })
    
    doc.save('relatorio-financeiro.pdf')
  }

  const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#0088FE", "#FFBB28"]

  if (loading) return <div>Carregando...</div>
  if (error) return <div>Erro: {error}</div>

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Relatório Financeiro</h1>
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

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Receita Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
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
            <CardTitle>Proporção de Reservas por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label
                  >
                    {statusData.map((entry, index) => (
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

      <Card>
        <CardHeader>
          <CardTitle>Evolução de Reservas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="reservas" name="Total" stroke="#8884d8" />
                <Line type="monotone" dataKey="pendentes" name="Pendentes" stroke="#82ca9d" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resumo Mensal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left p-2">Mês</th>
                  <th className="text-right p-2">Receita Total</th>
                  <th className="text-right p-2">Total de Reservas</th>
                  <th className="text-right p-2">Reservas Pendentes</th>
                </tr>
              </thead>
              <tbody>
                {monthlyData.map((row) => (
                  <tr key={row.mes} className="border-t">
                    <td className="p-2">{row.mes}</td>
                    <td className="text-right p-2">
                      R$ {row.receita.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="text-right p-2">{row.reservas}</td>
                    <td className="text-right p-2">{row.pendentes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 