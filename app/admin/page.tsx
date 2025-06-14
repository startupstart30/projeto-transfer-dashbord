"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Car,
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertCircle,
  Plus,
  MapPin,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import { format, parseISO, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay } from "date-fns"
import { Bar } from "react-chartjs-2"
import { Chart, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from "chart.js"
import type { ChartData, ChartOptions } from 'chart.js'

Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend)

// Definir tipos para bookings
interface RecentBooking {
  id: string
  customer: string
  date: string
  pickup: string
  dropoff: string
  status: string
  amount: number
}
interface UpcomingBooking {
  id: string
  customer: string
  date: string
  time: string
  pickup: string
  dropoff: string
  vehicle?: string
  status: string
}

interface Stats {
  totalBookings: number
  totalDrivers: number
  totalVehicles: number
  totalRevenue: number
  bookingsByStatus: Record<string, number>
}

interface RevenueData {
  month: string
  value: number
}

interface OccupancyData {
  date: string
  value: number
}

interface Booking {
  id: string;
  status: string;
  total_amount: number;
  payment_status: string;
  pickup_date: string;
}

interface Vehicle {
  id: string;
  status: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalBookings: 0,
    totalDrivers: 0,
    totalVehicles: 0,
    totalRevenue: 0,
    bookingsByStatus: {},
  })
  const [isLoading, setIsLoading] = useState(true)
  const [calendarView, setCalendarView] = useState<'day' | 'week' | 'month'>('month')
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'))
  const [calendarBookings, setCalendarBookings] = useState<Record<string, any[]>>({})
  const [alerts, setAlerts] = useState<string[]>([])
  const [occupancyData, setOccupancyData] = useState<OccupancyData[]>([])
  const [revenueData, setRevenueData] = useState<RevenueData[]>([])
  const [maintenanceCount, setMaintenanceCount] = useState(0)

  useEffect(() => {
    async function fetchStats() {
      setIsLoading(true)
      // Total de reservas
      const { count: totalBookings } = await supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
      // Total de motoristas
      const { count: totalDrivers } = await supabase
        .from("drivers")
        .select("id", { count: "exact", head: true })
      // Total de veículos
      const { count: totalVehicles } = await supabase
        .from("vehicles")
        .select("id", { count: "exact", head: true })
      // Veículos em manutenção
      const { count: maintenance } = await supabase
        .from("vehicles")
        .select("id", { count: "exact", head: true })
        .eq("status", "maintenance")
      setMaintenanceCount(maintenance || 0)
      // Receita total (somente reservas pagas)
      const { data: paidBookings } = await supabase
        .from("bookings")
        .select("total_amount, payment_status, pickup_date")
      const totalRevenue = (paidBookings as Booking[] || [])
        .filter((r: Booking) => r.payment_status === "paid")
        .reduce((acc: number, r: Booking) => acc + Number(r.total_amount || 0), 0)
      // Receita por mês (últimos 6 meses)
      const revenueByMonth: Record<string, number> = {}
      (paidBookings as Booking[] || []).forEach((r: Booking) => {
        if (r.payment_status === "paid" && r.pickup_date) {
          const month = r.pickup_date.slice(0, 7) // yyyy-MM
          revenueByMonth[month] = (revenueByMonth[month] || 0) + Number(r.total_amount || 0)
        }
      })
      setRevenueData(Object.entries(revenueByMonth).map(([month, value]) => ({ month, value })))
      // Reservas por status
      const { data: allBookings } = await supabase
        .from("bookings")
        .select("status")
      const bookingsByStatus: Record<string, number> = {}
      if (allBookings) {
        (allBookings as Booking[]).forEach((b: Booking) => {
          bookingsByStatus[b.status] = (bookingsByStatus[b.status] || 0) + 1
        })
      }
      // Ocupação por dia (últimos 30 dias)
      const occupancy: Record<string, number> = {}
      (paidBookings as Booking[] || []).forEach((r: Booking) => {
        if (r.pickup_date) {
          occupancy[r.pickup_date] = (occupancy[r.pickup_date] || 0) + 1
        }
      })
      setOccupancyData(Object.entries(occupancy).map(([date, value]) => ({ date, value })))
      setStats({
        totalBookings: totalBookings || 0,
        totalDrivers: totalDrivers || 0,
        totalVehicles: totalVehicles || 0,
        totalRevenue,
        bookingsByStatus,
      })
      setIsLoading(false)
    }
    fetchStats()
  }, [])

  useEffect(() => {
    async function fetchCalendarBookings() {
      const { data: reservas } = await supabase
        .from("reservas")
        .select("eu ia, data de retirada, hora de retirada, status, montante_total, notas, local de retirada, local de entrega")
      // Agrupar reservas por data
      const bookingsByDate: Record<string, any[]> = {}
      if (reservas) {
        reservas.forEach(r => {
          const date = r["data de retirada"]
          if (!bookingsByDate[date]) bookingsByDate[date] = []
          bookingsByDate[date].push(r)
        })
      }
      setCalendarBookings(bookingsByDate)
    }
    fetchCalendarBookings()
  }, [])

  useEffect(() => {
    async function fetchAlerts() {
      const newAlerts: string[] = []
      // Reservas pendentes
      const { count: pending } = await supabase
        .from("reservas")
        .select("eu ia", { count: "exact", head: true })
        .eq("status", "pendente")
      if ((pending || 0) > 0) newAlerts.push(`Existem ${pending} reservas pendentes!`)
      // Motoristas insuficientes
      const { count: drivers } = await supabase
        .from("motoristas")
        .select("eu ia", { count: "exact", head: true })
      if ((drivers || 0) < 3) newAlerts.push("Número de motoristas abaixo do ideal!")
      // Pagamentos não remunerados
      const { count: unpaid } = await supabase
        .from("reservas")
        .select("eu ia", { count: "exact", head: true })
        .eq("status_de_pagamento", "não remunerado")
      if ((unpaid || 0) > 0) newAlerts.push(`Existem ${unpaid} reservas não remuneradas!`)
      setAlerts(newAlerts)
    }
    fetchAlerts()
  }, [])

  function renderCalendar() {
    const today = new Date()
    const monthStart = startOfMonth(today)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart)
    const endDate = endOfWeek(monthEnd)
    const dateFormat = "d"
    const rows = []
    let days = []
    let day = startDate
    let formattedDate = ""
    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, "yyyy-MM-dd")
        const isCurrentMonth = isSameMonth(day, monthStart)
        const hasBooking = calendarBookings[formattedDate] && calendarBookings[formattedDate].length > 0
        days.push(
          <div
            key={day.toString()}
            className={`text-center p-2 rounded-md cursor-pointer ${isCurrentMonth ? "hover:bg-gray-100" : "text-gray-300"} ${isSameDay(day, parseISO(selectedDate)) ? "bg-secondary text-white font-medium" : ""}`}
            onClick={() => setSelectedDate(formattedDate)}
          >
            {format(day, dateFormat)}
            {hasBooking && <span className="block w-2 h-2 mx-auto mt-1 rounded-full bg-blue-500"></span>}
          </div>
        )
        day = addDays(day, 1)
      }
      rows.push(
        <div className="grid grid-cols-7 gap-1" key={day.toString()}>
          {days}
        </div>
      )
      days = []
    }
    return (
      <>
        {/* Days of the week */}
        <div className="grid grid-cols-7 gap-1">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}
        </div>
        {rows}
        {/* Reservas do dia selecionado */}
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium">Reservas para {selectedDate}</h4>
          {(calendarBookings[selectedDate] || []).length === 0 && (
            <div className="text-xs text-gray-500">Nenhuma reserva para este dia.</div>
          )}
          {(calendarBookings[selectedDate] || []).map((reserva, idx) => (
            <div key={idx} className="bg-blue-50 p-3 rounded-md border-l-4 border-blue-500">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-sm">{reserva["notas"] || "Reserva"}</p>
                  <p className="text-xs text-gray-500">{reserva["local de retirada"]} → {reserva["local de entrega"]}</p>
                </div>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">{reserva["hora de retirada"]}</span>
              </div>
            </div>
          ))}
        </div>
      </>
    )
  }

  // Gráfico de receita por mês
  const revenueChartData: ChartData<'bar'> = {
    labels: revenueData.map(d => d.month),
    datasets: [
      {
        label: "Receita (R$)",
        data: revenueData.map(d => d.value),
        backgroundColor: "#E95440",
      },
    ],
  }
  // Gráfico de ocupação
  const occupancyChartData: ChartData<'bar'> = {
    labels: occupancyData.map(d => d.date),
    datasets: [
      {
        label: "Reservas por dia",
        data: occupancyData.map(d => d.value),
        backgroundColor: "#3B82F6",
      },
    ],
  }

  const chartOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: {
        display: false
      }
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-secondary border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-text-gray">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div></div> {/* Empty div to maintain the flex layout */}
        <button className="btn-primary bg-secondary flex items-center text-sm">
          <Plus className="h-5 w-5 mr-2" />
          New Reservation
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
          <Car className="w-8 h-8 text-blue-500 mb-2" />
          <div className="text-2xl font-bold">{stats.totalVehicles}</div>
          <div className="text-gray-500">Veículos</div>
          <div className="text-xs text-yellow-600 mt-2">{maintenanceCount} em manutenção</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
          <Users className="w-8 h-8 text-green-500 mb-2" />
          <div className="text-2xl font-bold">{stats.totalDrivers}</div>
          <div className="text-gray-500">Motoristas</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
          <Calendar className="w-8 h-8 text-indigo-500 mb-2" />
          <div className="text-2xl font-bold">{stats.totalBookings}</div>
          <div className="text-gray-500">Reservas</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
          <DollarSign className="w-8 h-8 text-orange-500 mb-2" />
          <div className="text-2xl font-bold">R$ {stats.totalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
          <div className="text-gray-500">Receita total</div>
        </div>
      </div>

      {/* Alertas */}
      {alerts.length > 0 && (
        <div className="mb-6">
          {alerts.map((alert, idx) => (
            <div key={idx} className="flex items-center gap-2 bg-yellow-100 text-yellow-800 rounded p-3 mb-2">
              <AlertCircle className="w-5 h-5" /> {alert}
            </div>
          ))}
        </div>
      )}

      {/* Gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold mb-4">Receita por mês</h2>
          <Bar data={revenueChartData} options={chartOptions} height={220} />
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold mb-4">Ocupação diária</h2>
          <Bar data={occupancyChartData} options={chartOptions} height={220} />
        </div>
      </div>

      {/* Calendário */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-lg font-bold mb-4">Calendário de Reservas</h2>
        {renderCalendar()}
      </div>

      {/* Recent Bookings & Upcoming Bookings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 flex-1 overflow-auto">
        {/* Recent Bookings */}
        <div className="bg-background-white rounded border border-border">
          <div className="p-6 border-b border-border">
            <h2 className="text-lg font-medium font-dm-sans">Recent Bookings</h2>
          </div>
          <div className="overflow-auto max-h-[400px]">
            <div className="space-y-4 p-4">
              {Object.entries(stats.bookingsByStatus).map(([status, count], index) => (
                <div key={index} className="p-4 hover:bg-background-light rounded transition-colors border border-border">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-background-light rounded-full flex items-center justify-center mr-3">
                        <span className="text-text-dark font-medium text-sm">{status.charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <h3 className="font-medium">{status}</h3>
                        <p className="text-sm text-text-gray">{count} reservas</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="p-4 border-t border-border">
            <Link href="/admin/bookings" className="text-secondary hover:text-secondary/80 text-sm font-medium">
              View all bookings
            </Link>
          </div>
        </div>

        {/* Upcoming Bookings */}
        <div className="bg-background-white rounded border border-border">
          <div className="p-6 border-b border-border">
            <h2 className="text-lg font-medium font-dm-sans">Upcoming Bookings</h2>
          </div>
          <div className="overflow-auto max-h-[400px]">
            <div className="space-y-4 p-4">
              {Object.entries(stats.bookingsByStatus).map(([status, count], index) => (
                <div key={index} className="p-4 hover:bg-background-light rounded transition-colors border border-border">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-background-light rounded-full flex items-center justify-center mr-3">
                        <span className="text-text-dark font-medium text-sm">{status.charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <h3 className="font-medium">{status}</h3>
                        <p className="text-sm text-text-gray">{count} reservas</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="p-4 border-t border-border">
            <Link href="/admin/bookings" className="text-secondary hover:text-secondary/80 text-sm font-medium">
              View all upcoming bookings
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
