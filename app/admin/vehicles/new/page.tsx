"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { useRouter } from "next/navigation"

const VEHICLE_TYPES = ["Business Class", "First Class", "Business Van/SUV"]
const STATUS_OPTIONS = [
  { value: "active", label: "Ativo" },
  { value: "maintenance", label: "Manutenção" },
  { value: "inactive", label: "Inativo" }
]

export default function NewVehiclePage() {
  const [form, setForm] = useState({
    name: "",
    type: VEHICLE_TYPES[0],
    year: "",
    license_plate: "",
    status: "active",
    passengers: "",
    luggage: ""
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    // Validação básica
    if (!form.name || !form.type || !form.year || !form.license_plate || !form.status || !form.passengers || !form.luggage) {
      setError("Preencha todos os campos obrigatórios.")
      setLoading(false)
      return
    }
    // Validação de placa única
    const { data: existing } = await supabase.from("vehicles").select("id").eq("license_plate", form.license_plate)
    if (existing && existing.length > 0) {
      setError("Já existe um veículo cadastrado com esta placa.")
      setLoading(false)
      return
    }
    const { error } = await supabase.from("vehicles").insert([
      {
        name: form.name,
        type: form.type,
        year: Number(form.year),
        license_plate: form.license_plate,
        status: form.status,
        passengers: Number(form.passengers),
        luggage: Number(form.luggage)
      }
    ])
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    router.push("/admin/vehicles")
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Novo Veículo</h1>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white border rounded p-6">
        <div>
          <label className="block text-xs mb-1">Nome/Modelo *</label>
          <input type="text" className="border rounded px-2 py-1 w-full" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
        </div>
        <div>
          <label className="block text-xs mb-1">Tipo *</label>
          <select className="border rounded px-2 py-1 w-full" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} required>
            {VEHICLE_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-xs mb-1">Ano *</label>
            <input type="number" className="border rounded px-2 py-1 w-full" value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} required />
          </div>
          <div className="flex-1">
            <label className="block text-xs mb-1">Placa *</label>
            <input type="text" className="border rounded px-2 py-1 w-full" value={form.license_plate} onChange={e => setForm(f => ({ ...f, license_plate: e.target.value }))} required />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-xs mb-1">Passageiros *</label>
            <input type="number" className="border rounded px-2 py-1 w-full" value={form.passengers} onChange={e => setForm(f => ({ ...f, passengers: e.target.value }))} required />
          </div>
          <div className="flex-1">
            <label className="block text-xs mb-1">Bagagem *</label>
            <input type="number" className="border rounded px-2 py-1 w-full" value={form.luggage} onChange={e => setForm(f => ({ ...f, luggage: e.target.value }))} required />
          </div>
        </div>
        <div>
          <label className="block text-xs mb-1">Status *</label>
          <select className="border rounded px-2 py-1 w-full" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} required>
            {STATUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <button type="submit" className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90" disabled={loading}>
          {loading ? "Salvando..." : "Salvar Veículo"}
        </button>
      </form>
    </div>
  )
} 