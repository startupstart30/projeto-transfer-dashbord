"use client"

import { useState, useEffect, useRef } from "react"
import { supabase } from "@/lib/supabaseClient"
import { useRouter } from "next/navigation"

const STATUS_OPTIONS = [
  { value: "active", label: "Ativo" },
  { value: "inactive", label: "Inativo" },
  { value: "suspended", label: "Suspenso" }
]

export default function EditDriverPage({ params }: { params: { id: string } }) {
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    email: "",
    license_number: "",
    status: "active",
    vehicle_id: "",
    avatar_url: ""
  })
  const [vehicles, setVehicles] = useState<any[]>([])
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [carregandoDados, setCarregandoDados] = useState(true)
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchVehicles()
    fetchDriver()
    // eslint-disable-next-line
  }, [])

  async function fetchVehicles() {
    const { data } = await supabase.from("vehicles").select("id, name")
    setVehicles(data || [])
  }

  async function fetchDriver() {
    setCarregandoDados(true)
    const { data, error } = await supabase.from("drivers").select("*").eq("id", params.id).single()
    if (error || !data) {
      setError("Motorista não encontrado.")
      setCarregandoDados(false)
      return
    }
    setForm({
      full_name: data.full_name || "",
      phone: data.phone || "",
      email: data.email || "",
      license_number: data.license_number || "",
      status: data.status || "active",
      vehicle_id: data.vehicle_id || "",
      avatar_url: data.avatar_url || ""
    })
    setCarregandoDados(false)
  }

  async function handleAvatarUpload(file: File) {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}.${fileExt}`
    const { data, error } = await supabase.storage.from("avatars").upload(fileName, file)
    if (error) throw error
    const { data: publicUrl } = supabase.storage.from("avatars").getPublicUrl(fileName)
    return publicUrl.publicUrl
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    if (!form.full_name || !form.phone || !form.email || !form.license_number || !form.status) {
      setError("Preencha todos os campos obrigatórios.")
      setLoading(false)
      return
    }
    // Validação de email e CNH únicos (exceto o próprio motorista)
    const { data: existingEmail } = await supabase.from("drivers").select("id").eq("email", form.email).neq("id", params.id)
    if (existingEmail && existingEmail.length > 0) {
      setError("Já existe um motorista cadastrado com este email.")
      setLoading(false)
      return
    }
    const { data: existingCNH } = await supabase.from("drivers").select("id").eq("license_number", form.license_number).neq("id", params.id)
    if (existingCNH && existingCNH.length > 0) {
      setError("Já existe um motorista cadastrado com esta CNH.")
      setLoading(false)
      return
    }
    let avatarUrl = form.avatar_url
    if (avatarFile) {
      try {
        avatarUrl = await handleAvatarUpload(avatarFile)
      } catch (err) {
        setError("Erro ao fazer upload do avatar.")
        setLoading(false)
        return
      }
    }
    const { error } = await supabase.from("drivers").update({
      full_name: form.full_name,
      phone: form.phone,
      email: form.email,
      license_number: form.license_number,
      status: form.status,
      vehicle_id: form.vehicle_id || null,
      avatar_url: avatarUrl
    }).eq("id", params.id)
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    router.push("/admin/drivers")
  }

  if (carregandoDados) {
    return <div className="p-8 text-center text-muted-foreground">Carregando dados do motorista...</div>
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Editar Motorista</h1>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white border rounded p-6">
        <div>
          <label className="block text-xs mb-1">Nome Completo *</label>
          <input type="text" className="border rounded px-2 py-1 w-full" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} required />
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-xs mb-1">Telefone *</label>
            <input type="tel" className="border rounded px-2 py-1 w-full" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} required />
          </div>
          <div className="flex-1">
            <label className="block text-xs mb-1">Email *</label>
            <input type="email" className="border rounded px-2 py-1 w-full" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-xs mb-1">CNH *</label>
            <input type="text" className="border rounded px-2 py-1 w-full" value={form.license_number} onChange={e => setForm(f => ({ ...f, license_number: e.target.value }))} required />
          </div>
          <div className="flex-1">
            <label className="block text-xs mb-1">Status *</label>
            <select className="border rounded px-2 py-1 w-full" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} required>
              {STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs mb-1">Veículo</label>
          <select className="border rounded px-2 py-1 w-full" value={form.vehicle_id} onChange={e => setForm(f => ({ ...f, vehicle_id: e.target.value }))}>
            <option value="">Nenhum</option>
            {vehicles.map(v => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs mb-1">Foto/Avatar</label>
          <input type="file" accept="image/*" ref={fileInputRef} onChange={e => setAvatarFile(e.target.files?.[0] || null)} />
        </div>
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <button type="submit" className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90" disabled={loading}>
          {loading ? "Salvando..." : "Salvar Alterações"}
        </button>
      </form>
    </div>
  )
} 