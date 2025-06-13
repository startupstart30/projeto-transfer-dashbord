"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"
import { useRouter } from "next/navigation"

export default function EditTripPage({ params }: { params: { id: string } }) {
  const [motoristas, setMotoristas] = useState<any[]>([])
  const [veiculos, setVeiculos] = useState<any[]>([])
  const [form, setForm] = useState({
    motorista_id: "",
    veiculo_id: "",
    data_inicio: "",
    data_fim: "",
    status: "pendente",
    valor_total: "",
    observacoes: ""
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [carregandoDados, setCarregandoDados] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchMotoristasVeiculos()
    fetchReserva()
    // eslint-disable-next-line
  }, [])

  async function fetchMotoristasVeiculos() {
    const { data: m } = await supabase.from("motoristas").select("id, nome")
    setMotoristas(m || [])
    const { data: v } = await supabase.from("veiculos").select("id, placa")
    setVeiculos(v || [])
  }

  async function fetchReserva() {
    setCarregandoDados(true)
    const { data, error } = await supabase.from("reservas").select("*").eq("id", params.id).single()
    if (error || !data) {
      setError("Reserva não encontrada.")
      setCarregandoDados(false)
      return
    }
    setForm({
      motorista_id: data.motorista_id || "",
      veiculo_id: data.veiculo_id || "",
      data_inicio: data.data_inicio ? data.data_inicio.slice(0, 16) : "",
      data_fim: data.data_fim ? data.data_fim.slice(0, 16) : "",
      status: data.status || "pendente",
      valor_total: data.valor_total?.toString() || "",
      observacoes: data.observacoes || ""
    })
    setCarregandoDados(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    if (!form.motorista_id || !form.veiculo_id || !form.data_inicio || !form.data_fim || !form.valor_total) {
      setError("Preencha todos os campos obrigatórios.")
      setLoading(false)
      return
    }
    if (form.data_fim < form.data_inicio) {
      setError("Data de fim não pode ser anterior à data de início.")
      setLoading(false)
      return
    }
    // TODO: Validação de conflito de horário
    const { error } = await supabase.from("reservas").update({
      motorista_id: form.motorista_id,
      veiculo_id: form.veiculo_id,
      data_inicio: form.data_inicio,
      data_fim: form.data_fim,
      status: form.status,
      valor_total: Number(form.valor_total),
      observacoes: form.observacoes
    }).eq("id", params.id)
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    router.push("/admin/trips")
  }

  if (carregandoDados) {
    return <div className="p-8 text-center text-muted-foreground">Carregando dados da reserva...</div>
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Editar Reserva</h1>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white border rounded p-6">
        <div>
          <label className="block text-xs mb-1">Motorista *</label>
          <select className="border rounded px-2 py-1 w-full" value={form.motorista_id} onChange={e => setForm(f => ({ ...f, motorista_id: e.target.value }))} required>
            <option value="">Selecione</option>
            {motoristas.map(m => (
              <option key={m.id} value={m.id}>{m.nome}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs mb-1">Veículo *</label>
          <select className="border rounded px-2 py-1 w-full" value={form.veiculo_id} onChange={e => setForm(f => ({ ...f, veiculo_id: e.target.value }))} required>
            <option value="">Selecione</option>
            {veiculos.map(v => (
              <option key={v.id} value={v.id}>{v.placa}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-xs mb-1">Data Início *</label>
            <input type="datetime-local" className="border rounded px-2 py-1 w-full" value={form.data_inicio} onChange={e => setForm(f => ({ ...f, data_inicio: e.target.value }))} required />
          </div>
          <div className="flex-1">
            <label className="block text-xs mb-1">Data Fim *</label>
            <input type="datetime-local" className="border rounded px-2 py-1 w-full" value={form.data_fim} onChange={e => setForm(f => ({ ...f, data_fim: e.target.value }))} required />
          </div>
        </div>
        <div>
          <label className="block text-xs mb-1">Status *</label>
          <select className="border rounded px-2 py-1 w-full" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} required>
            <option value="pendente">Pendente</option>
            <option value="confirmada">Confirmada</option>
            <option value="concluida">Concluída</option>
            <option value="cancelada">Cancelada</option>
          </select>
        </div>
        <div>
          <label className="block text-xs mb-1">Valor Total (R$) *</label>
          <input type="number" min="0" step="0.01" className="border rounded px-2 py-1 w-full" value={form.valor_total} onChange={e => setForm(f => ({ ...f, valor_total: e.target.value }))} required />
        </div>
        <div>
          <label className="block text-xs mb-1">Observações</label>
          <textarea className="border rounded px-2 py-1 w-full" value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} rows={2} />
        </div>
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <button type="submit" className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90" disabled={loading}>
          {loading ? "Salvando..." : "Salvar Alterações"}
        </button>
      </form>
    </div>
  )
} 