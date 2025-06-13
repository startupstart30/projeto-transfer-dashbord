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

  useEffect(() => {
    async function fetchStats() {
      setIsLoading(true)
      // Total de reservas
      const { count: totalBookings } = await supabase
        .from("reservas")
        .select("eu ia", { count: "exact", head: true })
      // Total de motoristas
      const { count: totalDrivers } = await supabase
        .from("motoristas")
        .select("eu ia", { count: "exact", head: true })
      // Total de veículos
      const { count: totalVehicles } = await supabase
        .from("veículos")
        .select("eu ia", { count: "exact", head: true })
      // Receita total (somente reservas pagas)
      const { data: reservasPagas } = await supabase
        .from("reservas")
        .select("montante_total, status_de_pagamento")
      const totalRevenue = (reservasPagas || [])
        .filter(r => r.status_de_pagamento === "pago")
        .reduce((acc, r) => acc + Number(r.montante_total || 0), 0)
      // Reservas por status
      const { data: allBookings } = await supabase
        .from("reservas")
        .select("status")
      const bookingsByStatus: Record<string, number> = {}
      if (allBookings) {
        allBookings.forEach(b => {
          bookingsByStatus[b.status] = (bookingsByStatus[b.status] || 0) + 1
        })
      }
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-background-white rounded border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-text-gray text-sm font-medium">Total Bookings</h3>
            <div className="bg-blue-100 p-2 rounded">
              <Calendar className="h-5 w-5 text-info" />
            </div>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-2xl font-bold">{stats.totalBookings}</p>
              <p className="text-sm text-success flex items-center">
                <TrendingUp className="h-4 w-4 mr-1" />
                <span>+12% from last month</span>
              </p>
            </div>
          </div>
        </div>

        <div className="bg-background-white rounded border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-text-gray text-sm font-medium">Active Vehicles</h3>
            <div className="bg-green-100 p-2 rounded">
              <Car className="h-5 w-5 text-success" />
            </div>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-2xl font-bold">{stats.totalVehicles}</p>
              <p className="text-sm text-success flex items-center">
                <TrendingUp className="h-4 w-4 mr-1" />
                <span>+2 new vehicles</span>
              </p>
            </div>
          </div>
        </div>

        <div className="bg-background-white rounded border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-text-gray text-sm font-medium">Active Drivers</h3>
            <div className="bg-purple-100 p-2 rounded">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-2xl font-bold">{stats.totalDrivers}</p>
              <p className="text-sm text-danger flex items-center">
                <TrendingDown className="h-4 w-4 mr-1" />
                <span>-1 from last month</span>
              </p>
            </div>
          </div>
        </div>

        <div className="bg-background-white rounded border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-text-gray text-sm font-medium">Total Revenue</h3>
            <div className="bg-yellow-100 p-2 rounded">
              <DollarSign className="h-5 w-5 text-warning" />
            </div>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</p>
              <p className="text-sm text-success flex items-center">
                <TrendingUp className="h-4 w-4 mr-1" />
                <span>+8.2% from last month</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Section */}
      <div className="bg-background-white rounded border border-border p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium font-dm-sans">Calendar</h2>
          <div className="flex space-x-2">
            <button className="px-3 py-1 text-sm bg-secondary text-white rounded">Day</button>
            <button className="px-3 py-1 text-sm bg-background-light text-text-gray rounded">Week</button>
            <button className="px-3 py-1 text-sm bg-background-light text-text-gray rounded">Month</button>
          </div>
        </div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-dm-sans">Friday, January 18, 2025</h3>
          <div className="flex items-center space-x-2">
            <button className="p-1 rounded hover:bg-background-light">
              <ChevronLeft className="h-5 w-5 text-text-gray" />
            </button>
            <button className="p-1 rounded hover:bg-background-light">
              <ChevronRight className="h-5 w-5 text-text-gray" />
            </button>
          </div>
        </div>
        <div className="border border-border rounded p-4 bg-white">
          {renderCalendar()}
        </div>
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

      {/* Alerts */}
      <div className="bg-background-white rounded border border-border p-6 mb-8">
        <h2 className="text-lg font-medium font-dm-sans mb-4">Alertas & Notificações</h2>
        {alerts.length === 0 ? (
          <div className="text-sm text-gray-500">Nenhum alerta no momento.</div>
        ) : (
          <ul className="space-y-2">
            {alerts.map((alert, idx) => (
              <li key={idx} className="flex items-center text-sm text-danger">
                <AlertCircle className="h-4 w-4 mr-2 text-danger" />
                {alert}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
