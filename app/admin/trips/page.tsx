"use client"

import { useEffect, useState, useRef } from "react"
import { supabase } from "@/lib/supabaseClient"
import Link from "next/link"
import { format } from "date-fns"
import Papa from "papaparse"
import type { ParseResult, ParseError } from "papaparse"

export default function TripsPage() {
  const [reservas, setReservas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState("")
  const [motorista, setMotorista] = useState("")
  const [veiculo, setVeiculo] = useState("")
  const [dataInicio, setDataInicio] = useState("")
  const [dataFim, setDataFim] = useState("")
  const [motoristas, setMotoristas] = useState<any[]>([])
  const [veiculos, setVeiculos] = useState<any[]>([])
  const [valorMin, setValorMin] = useState("")
  const [valorMax, setValorMax] = useState("")
  const [busca, setBusca] = useState("")
  const [showImport, setShowImport] = useState(false)
  const [csvRows, setCsvRows] = useState<any[]>([])
  const [importLoading, setImportLoading] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [importSuccess, setImportSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const importButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    fetchMotoristasVeiculos()
  }, [])

  useEffect(() => {
    fetchReservas()
  }, [status, motorista, veiculo, dataInicio, dataFim, valorMin, valorMax, busca])

  useEffect(() => {
    if (showImport) {
      setTimeout(() => fileInputRef.current?.focus(), 100)
    }
  }, [showImport])

  async function fetchMotoristasVeiculos() {
    const { data: m } = await supabase.from("motoristas").select("id, nome")
    setMotoristas(m || [])
    const { data: v } = await supabase.from("veiculos").select("id, placa")
    setVeiculos(v || [])
  }

  async function fetchReservas() {
    setLoading(true)
    setError(null)
    let query = supabase.from("reservas").select("*, motorista:motorista_id(nome), veiculo:veiculo_id(placa)")
    if (status) query = query.eq("status", status)
    if (motorista) query = query.eq("motorista_id", motorista)
    if (veiculo) query = query.eq("veiculo_id", veiculo)
    if (dataInicio) query = query.gte("data_inicio", dataInicio)
    if (dataFim) query = query.lte("data_fim", dataFim)
    if (valorMin) query = query.gte("valor_total", valorMin)
    if (valorMax) query = query.lte("valor_total", valorMax)
    if (busca) query = query.ilike("observacoes", `%${busca}%`)
    const { data, error } = await query.order("data_inicio", { ascending: false })
    if (error) setError(error.message)
    setReservas(data || [])
    setLoading(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir esta reserva?')) return;
    setLoading(true);
    const { error } = await supabase.from("reservas").delete().eq("id", id);
    if (error) {
      setError(error.message);
    } else {
      setReservas(reservas => reservas.filter(r => r.id !== id));
    }
    setLoading(false);
  }

  function handleCsvFile(e: React.ChangeEvent<HTMLInputElement>) {
    setImportError(null)
    const file = e.target.files?.[0]
    if (!file) return
    Papa.parse<any>(file as any, {
      header: true,
      skipEmptyLines: true,
      complete: (results: ParseResult<any>) => {
        if (!Array.isArray(results.data) || results.data.length === 0) {
          setImportError("Arquivo CSV vazio ou inválido.")
          return
        }
        setCsvRows(results.data as Record<string, string | number>[])
      },
      error: (err: ParseError | Error) => setImportError(err.message)
    })
  }

  async function handleImportCsv() {
    setImportLoading(true)
    setImportError(null)
    setImportSuccess(false)
    // Validação básica dos campos obrigatórios
    const validRows = csvRows.filter(row => row.motorista_id && row.veiculo_id && row.data_inicio && row.data_fim && row.status && row.valor_total)
    if (validRows.length === 0) {
      setImportError("Nenhuma linha válida encontrada no CSV.")
      setImportLoading(false)
      return
    }
    const { error } = await supabase.from("reservas").insert(validRows)
    if (error) {
      setImportError(error.message)
      setImportLoading(false)
      return
    }
    setImportSuccess(true)
    setTimeout(() => {
      setShowImport(false)
      setCsvRows([])
      setImportSuccess(false)
    }, 1200)
    fetchReservas()
    setImportLoading(false)
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Reservas (Trips)</h1>
      <div className="mb-4 flex flex-wrap gap-2 items-end">
        <div>
          <label className="block text-xs">Status</label>
          <select className="border rounded px-2 py-1" value={status} onChange={e => setStatus(e.target.value)}>
            <option value="">Todos</option>
            <option value="pendente">Pendente</option>
            <option value="confirmada">Confirmada</option>
            <option value="concluida">Concluída</option>
            <option value="cancelada">Cancelada</option>
          </select>
        </div>
        <div>
          <label className="block text-xs">Motorista</label>
          <select className="border rounded px-2 py-1" value={motorista} onChange={e => setMotorista(e.target.value)}>
            <option value="">Todos</option>
            {motoristas.map(m => (
              <option key={m.id} value={m.id}>{m.nome}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs">Veículo</label>
          <select className="border rounded px-2 py-1" value={veiculo} onChange={e => setVeiculo(e.target.value)}>
            <option value="">Todos</option>
            {veiculos.map(v => (
              <option key={v.id} value={v.id}>{v.placa}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs">Data Início</label>
          <input type="date" className="border rounded px-2 py-1" value={dataInicio} onChange={e => setDataInicio(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs">Data Fim</label>
          <input type="date" className="border rounded px-2 py-1" value={dataFim} onChange={e => setDataFim(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs">Valor Mínimo</label>
          <input type="number" className="border rounded px-2 py-1" value={valorMin} onChange={e => setValorMin(e.target.value)} min="0" />
        </div>
        <div>
          <label className="block text-xs">Valor Máximo</label>
          <input type="number" className="border rounded px-2 py-1" value={valorMax} onChange={e => setValorMax(e.target.value)} min="0" />
        </div>
        <div>
          <label className="block text-xs">Buscar Observação</label>
          <input type="text" className="border rounded px-2 py-1" value={busca} onChange={e => setBusca(e.target.value)} placeholder="Digite para buscar..." />
        </div>
        <button type="button" className="bg-secondary text-black px-4 py-2 rounded hover:bg-secondary/80" onClick={() => setShowImport(true)}>
          Importar CSV
        </button>
        <Link href="/admin/trips/new" className="ml-auto bg-primary text-white px-4 py-2 rounded hover:bg-primary/90">Nova Reserva</Link>
      </div>
      <div className="border rounded">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Carregando...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">Erro: {error}</div>
        ) : reservas.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">Nenhuma reserva encontrada.</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-muted">
                <th className="p-2 text-left">Data</th>
                <th className="p-2 text-left">Motorista</th>
                <th className="p-2 text-left">Veículo</th>
                <th className="p-2 text-left">Status</th>
                <th className="p-2 text-left">Valor</th>
                <th className="p-2 text-left">Ações</th>
              </tr>
            </thead>
            <tbody>
              {reservas.map(reserva => (
                <tr key={reserva.id} className="border-t">
                  <td className="p-2">{format(new Date(reserva.data_inicio), "dd/MM/yyyy HH:mm")}</td>
                  <td className="p-2">{reserva.motorista?.nome || "-"}</td>
                  <td className="p-2">{reserva.veiculo?.placa || "-"}</td>
                  <td className="p-2 capitalize">{reserva.status}</td>
                  <td className="p-2">R$ {Number(reserva.valor_total).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                  <td className="p-2 flex gap-2">
                    <Link href={`/admin/trips/${reserva.id}/edit`} className="text-blue-600 hover:underline">Editar</Link>
                    <button className="text-red-600 hover:underline" onClick={() => handleDelete(reserva.id)}>Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {showImport && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" role="dialog" aria-modal="true">
          <div className="bg-white rounded shadow-lg p-6 w-full max-w-lg relative">
            <button className="absolute top-2 right-2 text-xl" onClick={() => setShowImport(false)} aria-label="Fechar modal">&times;</button>
            <h2 className="text-lg font-bold mb-2">Importar Reservas via CSV</h2>
            <input type="file" accept=".csv" ref={fileInputRef} onChange={handleCsvFile} className="mb-2" aria-label="Selecionar arquivo CSV" />
            {importError && <div className="text-red-500 text-sm mb-2">{importError}</div>}
            {importSuccess && <div className="text-green-600 text-sm mb-2">Importação realizada com sucesso!</div>}
            {csvRows.length > 0 && (
              <div className="mb-2 max-h-40 overflow-auto border rounded">
                <table className="text-xs min-w-full">
                  <thead>
                    <tr>
                      {Object.keys(csvRows[0] as Record<string, string | number>).map(key => (
                        <th key={key} className="p-1 border-b bg-muted">{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {csvRows.map((row, i) => (
                      <tr key={i}>
                        {Object.values(row as Record<string, string | number>).map((val, j) => (
                          <td key={j} className="p-1 border-b">{val as string}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-2 mt-2">
              <button
                type="button"
                className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90 disabled:opacity-60"
                onClick={handleImportCsv}
                disabled={importLoading || csvRows.length === 0}
                ref={importButtonRef}
                aria-busy={importLoading}
              >
                {importLoading ? <span className="inline-block animate-spin mr-2">⏳</span> : null}
                {importLoading ? "Importando..." : "Importar"}
              </button>
              <button
                type="button"
                className="bg-secondary text-black px-4 py-2 rounded hover:bg-secondary/80"
                onClick={() => setShowImport(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 