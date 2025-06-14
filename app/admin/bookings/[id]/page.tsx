"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Car, User, Calendar, Clock, MapPin, Briefcase, Edit, Copy, X, Loader2, CheckCircle, CreditCard, Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"

export default function BookingDetailsPage() {
  const { id } = useParams()
  const router = useRouter()
  const [booking, setBooking] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [cancelSuccess, setCancelSuccess] = useState(false)
  const [cancelError, setCancelError] = useState("")
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    async function fetchBooking() {
      setLoading(true)
      setError("")
      const { data, error } = await supabase
        .from("bookings")
        .select(`*, user:users(full_name, email), vehicle:vehicles(name, license_plate), driver:drivers(full_name), booking_extras(extra_id, quantity, price), extras:extras(name)`)
        .eq("id", id)
        .single()
      if (error || !data) {
        setError("Reserva não encontrada.")
        setLoading(false)
        return
      }
      setBooking(data)
      setLoading(false)
    }
    if (id) fetchBooking()
  }, [id])

  // Cancelar reserva
  async function handleCancel() {
    setCancelling(true)
    setCancelError("")
    setCancelSuccess(false)
    const { error } = await supabase
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", id)
    if (error) {
      setCancelError("Erro ao cancelar reserva.")
      setCancelling(false)
      return
    }
    setCancelSuccess(true)
    setCancelling(false)
    setTimeout(() => router.push("/admin/bookings"), 1200)
  }

  // Duplicar reserva
  async function handleDuplicate() {
    if (!booking) return
    const { id: _id, created_at, updated_at, ...copy } = booking
    const { error } = await supabase.from("bookings").insert([{ ...copy }])
    if (!error) router.push("/admin/bookings")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin w-8 h-8 text-gray-500" />
        <span className="ml-2">Carregando reserva...</span>
      </div>
    )
  }

  if (error || !booking) {
    return <div className="p-6 text-center text-red-600 font-semibold">{error || "Reserva não encontrada."}</div>
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="flex items-center mb-6 gap-4">
        <button
          className="p-2 rounded hover:bg-gray-100"
          onClick={() => router.push("/admin/bookings")}
          title="Voltar para listagem"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold flex-1">Detalhes da Reserva</h1>
        <Link href={`/admin/bookings/${id}/edit`} className="p-2 rounded hover:bg-gray-100" title="Editar reserva">
          <Edit className="w-5 h-5" />
        </Link>
        <button className="p-2 rounded hover:bg-gray-100" title="Duplicar reserva" onClick={handleDuplicate}>
          <Copy className="w-5 h-5" />
        </button>
        <button className="p-2 rounded hover:bg-gray-100" title="Cancelar reserva" onClick={handleCancel} disabled={cancelling || booking.status === "cancelled"}>
          <Trash2 className="w-5 h-5 text-red-500" />
        </button>
      </div>
      {/* Feedback de cancelamento */}
      {cancelSuccess && <div className="text-green-600 text-sm mb-2 flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Reserva cancelada com sucesso!</div>}
      {cancelError && <div className="text-red-600 text-sm mb-2">{cancelError}</div>}
      {/* Dados principais */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8 flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-gray-500 mb-1">Passageiro</div>
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-gray-400" />
              <span className="font-semibold">{booking.user?.full_name}</span>
              <span className="text-xs text-gray-500">{booking.user?.email}</span>
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Motorista</div>
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-gray-400" />
              <span className="font-semibold">{booking.driver?.full_name || "-"}</span>
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Veículo</div>
            <div className="flex items-center gap-2">
              <Car className="w-5 h-5 text-gray-400" />
              <span className="font-semibold">{booking.vehicle?.name || "-"}</span>
              <span className="text-xs text-gray-500">{booking.vehicle?.license_plate}</span>
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Status</div>
            <span className={`px-3 py-1 text-xs rounded-full font-semibold ${
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
            }`}>
              {booking.status}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-gray-500 mb-1">Origem</div>
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-gray-400" />
              <span>{booking.pickup_location}</span>
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Destino</div>
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-gray-400" />
              <span>{booking.dropoff_location}</span>
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Data/Hora</div>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-400" />
              <span>{booking.pickup_date}</span>
              <Clock className="w-5 h-5 text-gray-400 ml-2" />
              <span>{booking.pickup_time}</span>
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Passageiros / Bagagem</div>
            <span>{booking.passengers} passageiros, {booking.luggage} malas</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-gray-500 mb-1">Nº do Voo</div>
            <span>{booking.flight_number || "-"}</span>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Valor</div>
            <span className="font-semibold">{booking.total_amount ? `R$ ${Number(booking.total_amount).toFixed(2)}` : "-"}</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-gray-500 mb-1">Pagamento</div>
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-gray-400" />
              <span>{booking.payment_status || "-"} {booking.payment_method ? `• ${booking.payment_method}` : ""}</span>
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Observações</div>
            <span>{booking.notes || "-"}</span>
          </div>
        </div>
        {/* Extras */}
        {booking.booking_extras && booking.booking_extras.length > 0 && (
          <div>
            <div className="text-xs text-gray-500 mb-1">Extras</div>
            <ul className="list-disc ml-6">
              {booking.booking_extras.map((ex: any, idx: number) => (
                <li key={idx}>{ex.name || ex.extra_id} x{ex.quantity} {ex.price ? `• R$ ${Number(ex.price).toFixed(2)}` : ""}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      {/* Histórico (placeholder, pode ser integrado com logs) */}
      {/* <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-gray-700" /> Histórico da Reserva
        </h2>
        <div className="text-gray-500">(Em breve: histórico de ações da reserva)</div>
      </div> */}
    </div>
  )
}
