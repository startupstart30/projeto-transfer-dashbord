"use client"

import { useState, useRef } from "react"
import { supabase } from "@/lib/supabaseClient"
import { useRouter } from "next/navigation"
import { Plus, Upload, AlertCircle } from "lucide-react"
import Image from "next/image"

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
    luggage: "",
    image_url: ""
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleImageUpload(file: File) {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}.${fileExt}`
    const { data, error } = await supabase.storage.from("vehicles").upload(fileName, file)
    if (error) throw error
    const { data: publicUrl } = supabase.storage.from("vehicles").getPublicUrl(fileName)
    return publicUrl.publicUrl
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setLoading(true)

    try {
      // Validação básica
      if (!form.name || !form.type || !form.year || !form.license_plate || !form.status || !form.passengers || !form.luggage) {
        throw new Error("Preencha todos os campos obrigatórios.")
      }

      // Validação de placa única
      const { data: existing } = await supabase
        .from("vehicles")
        .select("id")
        .eq("license_plate", form.license_plate)
      if (existing && existing.length > 0) {
        throw new Error("Já existe um veículo cadastrado com esta placa.")
      }

      // Upload da imagem se houver
      let imageUrl = form.image_url
      if (imageFile) {
        imageUrl = await handleImageUpload(imageFile)
      }

      // Inserir veículo
      const { error: insertError } = await supabase.from("vehicles").insert([
        {
          name: form.name,
          type: form.type,
          year: Number(form.year),
          license_plate: form.license_plate,
          status: form.status,
          passengers: Number(form.passengers),
          luggage: Number(form.luggage),
          image_url: imageUrl
        }
      ])

      if (insertError) throw insertError

      setSuccess(true)
      setTimeout(() => {
        router.push("/admin/vehicles")
      }, 1500)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Novo Veículo</h1>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-800 rounded flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-100 text-green-800 rounded">
          Veículo cadastrado com sucesso! Redirecionando...
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 bg-white border rounded p-6">
        <div>
          <label className="block text-xs mb-1">Nome/Modelo *</label>
          <input
            type="text"
            className="border rounded px-2 py-1 w-full"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            required
          />
        </div>

        <div>
          <label className="block text-xs mb-1">Tipo *</label>
          <select
            className="border rounded px-2 py-1 w-full"
            value={form.type}
            onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
            required
          >
            {VEHICLE_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-xs mb-1">Ano *</label>
            <input
              type="number"
              className="border rounded px-2 py-1 w-full"
              value={form.year}
              onChange={e => setForm(f => ({ ...f, year: e.target.value }))}
              required
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs mb-1">Placa *</label>
            <input
              type="text"
              className="border rounded px-2 py-1 w-full"
              value={form.license_plate}
              onChange={e => setForm(f => ({ ...f, license_plate: e.target.value }))}
              required
            />
          </div>
        </div>

        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-xs mb-1">Passageiros *</label>
            <input
              type="number"
              className="border rounded px-2 py-1 w-full"
              value={form.passengers}
              onChange={e => setForm(f => ({ ...f, passengers: e.target.value }))}
              required
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs mb-1">Bagagem *</label>
            <input
              type="number"
              className="border rounded px-2 py-1 w-full"
              value={form.luggage}
              onChange={e => setForm(f => ({ ...f, luggage: e.target.value }))}
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs mb-1">Status *</label>
          <select
            className="border rounded px-2 py-1 w-full"
            value={form.status}
            onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
            required
          >
            {STATUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs mb-1">Imagem do Veículo</label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              {form.image_url ? (
                <div className="relative w-full h-48">
                  <Image
                    src={form.image_url}
                    alt="Preview"
                    fill
                    className="object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setForm(f => ({ ...f, image_url: "" }))
                      setImageFile(null)
                      if (fileInputRef.current) fileInputRef.current.value = ""
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary/90 focus-within:outline-none"
                    >
                      <span>Upload de imagem</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={e => {
                          const file = e.target.files?.[0]
                          if (file) {
                            setImageFile(file)
                            setForm(f => ({ ...f, image_url: URL.createObjectURL(file) }))
                          }
                        }}
                      />
                    </label>
                    <p className="pl-1">ou arraste e solte</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, GIF até 10MB
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </form>
    </div>
  )
} 