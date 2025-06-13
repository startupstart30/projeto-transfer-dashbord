"use client"

import { useState, useEffect } from "react"
import {
  LineChart,
  PieChart,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Car,
  Clock,
} from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { getTranslations } from "@/lib/i18n"
import { supabase } from "@/lib/supabaseClient"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Pie,
  Cell
} from "recharts"

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"]

export default function ReportsPage() {
  const { language } = useLanguage()
  const t = getTranslations(language)

  const [dateRange, setDateRange] = useState("last30")
  const [isLoading, setIsLoading] = useState(false)
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  const [status, setStatus] = useState<string>("")
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [reportType, setReportType] = useState<"reservas" | "financeiro" | "motoristas" | "veiculos">("reservas")
  const [chartData, setChartData] = useState<any[]>([])

  const refreshData = () => {
    setIsLoading(true)
    // Simulate data loading
    setTimeout(() => {
      setIsLoading(false)
    }, 1000)
  }

  useEffect(() => {
    fetchReports()
  }, [startDate, endDate, status, reportType])

  async function fetchReports() {
    try {
      setLoading(true)
      let query

      switch (reportType) {
        case "reservas":
          query = supabase
            .from("reservas")
            .select(`
              *,
              motoristas (nome),
              veiculos (modelo, placa)
            `)
          break
        case "financeiro":
          query = supabase
            .from("reservas")
            .select("montante_total, status, data de retirada")
          break
        case "motoristas":
          query = supabase
            .from("motoristas")
            .select("nome, status")
          break
        case "veiculos":
          query = supabase
            .from("veiculos")
            .select("modelo, placa, status")
          break
      }

      if (startDate) {
        query = query.gte("data de retirada", startDate)
      }
      if (endDate) {
        query = query.lte("data de retirada", endDate)
      }
      if (status) {
        query = query.eq("status", status)
      }

      const { data, error } = await query

      if (error) throw error
      setReports(data || [])

      // Preparar dados para os gráficos
      if (reportType === "financeiro") {
        const monthlyData = data?.reduce((acc: any, curr: any) => {
          const month = format(new Date(curr["data de retirada"]), "MMM/yyyy")
          if (!acc[month]) {
            acc[month] = 0
          }
          acc[month] += curr.montante_total
          return acc
        }, {})

        setChartData(Object.entries(monthlyData).map(([month, total]) => ({
          month,
          total
        })))
      } else if (reportType === "reservas") {
        const statusData = data?.reduce((acc: any, curr: any) => {
          if (!acc[curr.status]) {
            acc[curr.status] = 0
          }
          acc[curr.status]++
          return acc
        }, {})

        setChartData(Object.entries(statusData).map(([status, count]) => ({
          status,
          count
        })))
      }
    } catch (error) {
      console.error("Erro ao buscar relatórios:", error)
    } finally {
      setLoading(false)
    }
  }

  function exportToCSV() {
    const headers = {
      reservas: [
        "ID",
        "Cliente",
        "Data Retirada",
        "Hora Retirada",
        "Origem",
        "Destino",
        "Motorista",
        "Veículo",
        "Status",
        "Valor Total"
      ],
      financeiro: [
        "Data",
        "Status",
        "Valor Total"
      ],
      motoristas: [
        "Nome",
        "Status"
      ],
      veiculos: [
        "Modelo",
        "Placa",
        "Status"
      ]
    }

    const csvData = reports.map(report => {
      switch (reportType) {
        case "reservas":
          return [
            report.id,
            report.cliente,
            format(new Date(report["data de retirada"]), "dd/MM/yyyy"),
            report["hora de retirada"],
            report["local de retirada"],
            report["local de entrega"],
            report.motoristas?.nome || "N/A",
            `${report.veiculos?.modelo} (${report.veiculos?.placa})`,
            report.status,
            report.montante_total
          ]
        case "financeiro":
          return [
            format(new Date(report["data de retirada"]), "dd/MM/yyyy"),
            report.status,
            report.montante_total
          ]
        case "motoristas":
          return [
            report.nome,
            report.status
          ]
        case "veiculos":
          return [
            report.modelo,
            report.placa,
            report.status
          ]
      }
    })

    const csvContent = [
      headers[reportType].join(","),
      ...csvData.map(row => row.join(","))
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `relatorio_${reportType}_${format(new Date(), "yyyy-MM-dd")}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium text-gray-800">{t.reports.title}</h1>
          <p className="text-sm text-gray-600 mt-1">{t.reports.subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white rounded-md border border-gray-200">
            <select
              className="text-sm py-2 pl-3 pr-8 rounded-md border-0 focus:ring-0"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            >
              <option value="today">{t.reports.today}</option>
              <option value="yesterday">{t.reports.yesterday}</option>
              <option value="last7">{t.reports.last7Days}</option>
              <option value="last30">{t.reports.last30Days}</option>
              <option value="thisMonth">{t.reports.thisMonth}</option>
              <option value="lastMonth">{t.reports.lastMonth}</option>
              <option value="custom">{t.reports.custom}</option>
            </select>
            <div className="px-3 border-l border-gray-200">
              <Calendar className="h-4 w-4 text-gray-500" />
            </div>
          </div>
          <button
            className="flex items-center gap-1.5 text-sm py-2 px-3 bg-white border border-gray-200 rounded-md hover:bg-gray-50"
            onClick={refreshData}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            <span>{t.reports.refresh}</span>
          </button>
          <button className="flex items-center gap-1.5 text-sm py-2 px-3 bg-white border border-gray-200 rounded-md hover:bg-gray-50">
            <Download className="h-4 w-4" />
            <span>{t.reports.export}</span>
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-600">{t.reports.totalRevenue}</p>
              <h3 className="text-2xl font-medium mt-1">R$ 24.580</h3>
            </div>
            <div className="p-2 bg-green-100 rounded-md">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
          </div>
          <div className="flex items-center mt-4">
            <div className="flex items-center text-green-600 text-xs">
              <TrendingUp className="h-3 w-3 mr-1" />
              <span>12.5%</span>
            </div>
            <span className="text-xs text-gray-500 ml-2">{t.reports.vsPrevious}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-600">{t.reports.totalTrips}</p>
              <h3 className="text-2xl font-medium mt-1">187</h3>
            </div>
            <div className="p-2 bg-blue-100 rounded-md">
              <Car className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <div className="flex items-center mt-4">
            <div className="flex items-center text-green-600 text-xs">
              <TrendingUp className="h-3 w-3 mr-1" />
              <span>8.2%</span>
            </div>
            <span className="text-xs text-gray-500 ml-2">{t.reports.vsPrevious}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-600">{t.reports.newCustomers}</p>
              <h3 className="text-2xl font-medium mt-1">43</h3>
            </div>
            <div className="p-2 bg-purple-100 rounded-md">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
          </div>
          <div className="flex items-center mt-4">
            <div className="flex items-center text-red-600 text-xs">
              <TrendingDown className="h-3 w-3 mr-1" />
              <span>3.8%</span>
            </div>
            <span className="text-xs text-gray-500 ml-2">{t.reports.vsPrevious}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-600">{t.reports.avgTripTime}</p>
              <h3 className="text-2xl font-medium mt-1">42 min</h3>
            </div>
            <div className="p-2 bg-amber-100 rounded-md">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
          </div>
          <div className="flex items-center mt-4">
            <div className="flex items-center text-green-600 text-xs">
              <TrendingUp className="h-3 w-3 mr-1" />
              <span>1.2%</span>
            </div>
            <span className="text-xs text-gray-500 ml-2">{t.reports.vsPrevious}</span>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue chart */}
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium">{t.reports.revenueByPeriod}</h3>
            <div className="flex items-center gap-2">
              <button className="text-xs py-1 px-2 bg-primary/10 text-primary rounded">{t.reports.daily}</button>
              <button className="text-xs py-1 px-2 text-gray-600 hover:bg-gray-100 rounded">{t.reports.weekly}</button>
              <button className="text-xs py-1 px-2 text-gray-600 hover:bg-gray-100 rounded">{t.reports.monthly}</button>
            </div>
          </div>
          <div className="h-64 flex items-center justify-center">
            <LineChart className="h-8 w-8 text-gray-300" />
            <p className="text-sm text-gray-500 ml-2">{t.reports.revenueChartPlaceholder}</p>
          </div>
        </div>

        {/* Bookings chart */}
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium">{t.reports.tripsByCategory}</h3>
            <button className="flex items-center text-xs text-gray-600">
              <Filter className="h-3 w-3 mr-1" />
              <span>{t.reports.filter}</span>
            </button>
          </div>
          <div className="h-64 flex items-center justify-center">
            <PieChart className="h-8 w-8 text-gray-300" />
            <p className="text-sm text-gray-500 ml-2">{t.reports.categoryChartPlaceholder}</p>
          </div>
        </div>
      </div>

      {/* Vehicle and driver performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top vehicles */}
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium">{t.reports.mostUsedVehicles}</h3>
            <button className="text-xs text-primary">{t.reports.viewAll}</button>
          </div>
          <div className="space-y-4">
            {[
              { name: "Mercedes Benz Sprinter", trips: 42, utilization: 78 },
              { name: "Toyota Hiace Executive", trips: 38, utilization: 72 },
              { name: "Ford Transit Premium", trips: 31, utilization: 65 },
              { name: "Mercedes Benz V-Class", trips: 29, utilization: 61 },
              { name: "Volkswagen Crafter", trips: 24, utilization: 52 },
            ].map((vehicle, index) => (
              <div key={index} className="flex items-center">
                <div className="w-8 h-8 bg-gray-200 rounded-md flex items-center justify-center mr-3">
                  <Car className="h-4 w-4 text-gray-600" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-medium">{vehicle.name}</p>
                    <p className="text-xs text-gray-600">
                      {vehicle.trips} {t.reports.trips}
                    </p>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full mt-1.5">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${vehicle.utilization}%` }}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top drivers */}
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium">{t.reports.driverPerformance}</h3>
            <button className="text-xs text-primary">{t.reports.viewAll}</button>
          </div>
          <div className="space-y-4">
            {[
              { name: "Carlos Silva", trips: 36, rating: 4.9 },
              { name: "Ana Oliveira", trips: 32, rating: 4.8 },
              { name: "Roberto Santos", trips: 29, rating: 4.7 },
              { name: "Juliana Costa", trips: 27, rating: 4.9 },
              { name: "Marcos Pereira", trips: 24, rating: 4.6 },
            ].map((driver, index) => (
              <div key={index} className="flex items-center">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                  <span className="text-xs font-medium text-gray-600">
                    {driver.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-medium">{driver.name}</p>
                    <div className="flex items-center">
                      <p className="text-xs text-gray-600 mr-2">
                        {driver.trips} {t.reports.trips}
                      </p>
                      <div className="flex items-center bg-green-100 px-1.5 py-0.5 rounded">
                        <span className="text-xs font-medium text-green-700">{driver.rating}</span>
                        <span className="text-xs text-yellow-500 ml-0.5">★</span>
                      </div>
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full mt-1.5">
                    <div
                      className="h-full bg-green-500 rounded-full"
                      style={{ width: `${(driver.rating / 5) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent bookings */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h3 className="font-medium">{t.reports.recentTrips}</h3>
          <button className="text-xs text-primary">{t.reports.viewAll}</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.reports.client}
                </th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.reports.origin}
                </th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.reports.destination}
                </th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.reports.date}
                </th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.reports.amount}
                </th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.reports.status}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-4 text-center">
                    Carregando...
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-4 text-center">
                    Nenhum relatório encontrado
                  </td>
                </tr>
              ) : (
                reports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-primary">{report.id}</td>
                    <td className="px-4 py-3 text-sm text-gray-800">{report.cliente}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{report["local de retirada"]}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{report["local de entrega"]}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {format(new Date(report["data de retirada"]), "dd/MM/yyyy")}
                      <br />
                      <span className="text-sm text-gray-500">
                        {report["hora de retirada"]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800">R$ {report.montante_total}</td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          report.status === "confirmado" ? "bg-green-100 text-green-800" :
                          report.status === "pendente" ? "bg-yellow-100 text-yellow-800" :
                          report.status === "concluido" ? "bg-blue-100 text-blue-800" :
                          "bg-red-100 text-red-800"
                        }`}
                      >
                        {report.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1">Tipo de Relatório</label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value as any)}
            className="w-full p-2 border rounded"
          >
            <option value="reservas">Reservas</option>
            <option value="financeiro">Financeiro</option>
            <option value="motoristas">Motoristas</option>
            <option value="veiculos">Veículos</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Data Inicial</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Data Final</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="">Todos</option>
            <option value="pendente">Pendente</option>
            <option value="confirmado">Confirmado</option>
            <option value="concluido">Concluído</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>
        <div className="flex items-end">
          <button
            onClick={exportToCSV}
            className="btn-primary bg-secondary text-white px-4 py-2 rounded hover:bg-secondary/90"
          >
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Gráficos */}
      {!loading && chartData.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Visualização Gráfica</h2>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              {reportType === "financeiro" ? (
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="total" fill="#8884d8" name="Valor Total (R$)" />
                </BarChart>
              ) : (
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={150}
                    label
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tabela de Relatórios */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {reportType === "reservas" && (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data/Hora
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Origem/Destino
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Motorista
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Veículo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor
                    </th>
                  </>
                )}
                {reportType === "financeiro" && (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor
                    </th>
                  </>
                )}
                {reportType === "motoristas" && (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nome
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </>
                )}
                {reportType === "veiculos" && (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Modelo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Placa
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center">
                    Carregando...
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center">
                    Nenhum relatório encontrado
                  </td>
                </tr>
              ) : (
                reports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    {reportType === "reservas" && (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {report.cliente}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {format(new Date(report["data de retirada"]), "dd/MM/yyyy")}
                          <br />
                          <span className="text-sm text-gray-500">
                            {report["hora de retirada"]}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <div className="font-medium">{report["local de retirada"]}</div>
                            <div className="text-gray-500">{report["local de entrega"]}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {report.motoristas?.nome || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {report.veiculos ? (
                            <>
                              {report.veiculos.modelo}
                              <br />
                              <span className="text-sm text-gray-500">
                                {report.veiculos.placa}
                              </span>
                            </>
                          ) : (
                            "N/A"
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            report.status === "confirmado" ? "bg-green-100 text-green-800" :
                            report.status === "pendente" ? "bg-yellow-100 text-yellow-800" :
                            report.status === "concluido" ? "bg-blue-100 text-blue-800" :
                            "bg-red-100 text-red-800"
                          }`}>
                            {report.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          R$ {report.montante_total}
                        </td>
                      </>
                    )}
                    {reportType === "financeiro" && (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {format(new Date(report["data de retirada"]), "dd/MM/yyyy")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            report.status === "confirmado" ? "bg-green-100 text-green-800" :
                            report.status === "pendente" ? "bg-yellow-100 text-yellow-800" :
                            report.status === "concluido" ? "bg-blue-100 text-blue-800" :
                            "bg-red-100 text-red-800"
                          }`}>
                            {report.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          R$ {report.montante_total}
                        </td>
                      </>
                    )}
                    {reportType === "motoristas" && (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {report.nome}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            report.status === "ativo" ? "bg-green-100 text-green-800" :
                            "bg-red-100 text-red-800"
                          }`}>
                            {report.status}
                          </span>
                        </td>
                      </>
                    )}
                    {reportType === "veiculos" && (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {report.modelo}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {report.placa}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            report.status === "ativo" ? "bg-green-100 text-green-800" :
                            "bg-red-100 text-red-800"
                          }`}>
                            {report.status}
                          </span>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
