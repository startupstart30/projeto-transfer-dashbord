"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bell, Car, Users, DollarSign, Calendar as CalendarIcon, Wrench, Star } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from "recharts"
import { format, isSameDay, isSameWeek, isSameMonth } from "date-fns"
import { ptBR } from "date-fns/locale"

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [kpis, setKpis] = useState({
    totalReservas: 0,
    receitaTotal: 0,
    taxaOcupacao: 0,
    avaliacaoMedia: 0
  })
  const [reservas, setReservas] = useState<any[]>([])
  const [veiculos, setVeiculos] = useState<any[]>([])
  const [motoristas, setMotoristas] = useState<any[]>([])
  const [alertas, setAlertas] = useState<any[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("month")
  const [filtros, setFiltros] = useState({
    motorista: "",
    veiculo: ""
  })

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"]
  const STATUS_COLORS: Record<string, string> = {
    pendente: "bg-yellow-100",
    confirmada: "bg-green-100",
    concluida: "bg-blue-100",
    cancelada: "bg-red-100"
  }

  useEffect(() => {
    fetchDashboardData()
  }, [selectedDate, viewMode, filtros])

  async function fetchDashboardData() {
    setLoading(true)
    setError(null)
    try {
      // Buscar dados
      const { data: reservasData, error: errReservas } = await supabase
        .from("reservas")
        .select("*")
      if (errReservas) throw errReservas

      const { data: veiculosData, error: errVeiculos } = await supabase
        .from("veiculos")
        .select("*")
      if (errVeiculos) throw errVeiculos

      const { data: motoristasData, error: errMotoristas } = await supabase
        .from("motoristas")
        .select("*")
      if (errMotoristas) throw errMotoristas

      // Calcular KPIs
      const totalReservas = reservasData.length
      const receitaTotal = reservasData.reduce((acc, r) => acc + (r.valor_total || 0), 0)
      const taxaOcupacao = (reservasData.filter(r => r.status === "concluida").length / totalReservas) * 100
      const avaliacaoMedia = reservasData.reduce((acc, r) => acc + (r.avaliacao || 0), 0) / totalReservas

      setKpis({
        totalReservas,
        receitaTotal,
        taxaOcupacao,
        avaliacaoMedia
      })

      // Buscar alertas
      const alertasTemp = []
      
      // Alertas de reservas pendentes
      const reservasPendentes = reservasData.filter(r => r.status === "pendente")
      if (reservasPendentes.length > 0) {
        alertasTemp.push({
          tipo: "reserva",
          mensagem: `${reservasPendentes.length} reservas pendentes`,
          prioridade: "alta",
          icone: <CalendarIcon className="h-4 w-4 mr-2" />
        })
      }

      // Alertas de documentos próximos do vencimento
      const documentosVencendo = veiculosData.filter(v => {
        const vencimento = new Date(v.documento_vencimento)
        const hoje = new Date()
        const diffTime = vencimento.getTime() - hoje.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return diffDays <= 30 && diffDays > 0
      })

      if (documentosVencendo.length > 0) {
        alertasTemp.push({
          tipo: "documento",
          mensagem: `${documentosVencendo.length} documentos próximos do vencimento`,
          prioridade: "media",
          icone: <Car className="h-4 w-4 mr-2" />
        })
      }

      // Alertas de manutenção
      const manutencoesPendentes = veiculosData.filter(v => {
        const ultimaManutencao = new Date(v.ultima_manutencao)
        const hoje = new Date()
        const diffDays = Math.ceil((hoje.getTime() - ultimaManutencao.getTime()) / (1000 * 60 * 60 * 24))
        return diffDays >= 30
      })

      if (manutencoesPendentes.length > 0) {
        alertasTemp.push({
          tipo: "manutencao",
          mensagem: `${manutencoesPendentes.length} veículos necessitam de manutenção`,
          prioridade: "media",
          icone: <Wrench className="h-4 w-4 mr-2" />
        })
      }

      // Alertas de avaliações baixas
      const motoristasBaixaAvaliacao = motoristasData.filter(m => m.avaliacao_media < 4)
      if (motoristasBaixaAvaliacao.length > 0) {
        alertasTemp.push({
          tipo: "avaliacao",
          mensagem: `${motoristasBaixaAvaliacao.length} motoristas com avaliação baixa`,
          prioridade: "baixa",
          icone: <Star className="h-4 w-4 mr-2" />
        })
      }

      setAlertas(alertasTemp)
      setReservas(reservasData)
      setVeiculos(veiculosData)
      setMotoristas(motoristasData)

    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar dados")
    } finally {
      setLoading(false)
    }
  }

  const reservasFiltradas = reservas.filter(r => {
    const reservaDate = new Date(r.data_inicio)
    const matchesDate = viewMode === "day" ? isSameDay(reservaDate, selectedDate!) :
                       viewMode === "week" ? isSameWeek(reservaDate, selectedDate!) :
                       isSameMonth(reservaDate, selectedDate!)
    const matchesMotorista = !filtros.motorista || r.motorista_id === filtros.motorista
    const matchesVeiculo = !filtros.veiculo || r.veiculo_id === filtros.veiculo
    return matchesDate && matchesMotorista && matchesVeiculo
  })

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Reservas</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.totalReservas}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {kpis.receitaTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Ocupação</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.taxaOcupacao.toFixed(1)}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avaliação Média</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.avaliacaoMedia.toFixed(1)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Calendário e Alertas */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Calendário</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="month" className="space-y-4">
              <TabsList>
                <TabsTrigger value="day" onClick={() => setViewMode("day")}>Dia</TabsTrigger>
                <TabsTrigger value="week" onClick={() => setViewMode("week")}>Semana</TabsTrigger>
                <TabsTrigger value="month" onClick={() => setViewMode("month")}>Mês</TabsTrigger>
              </TabsList>
              <TabsContent value={viewMode} className="space-y-4">
                <div className="flex gap-4 mb-4">
                  <select
                    className="border rounded px-2 py-1"
                    value={filtros.motorista}
                    onChange={e => setFiltros(prev => ({ ...prev, motorista: e.target.value }))}
                  >
                    <option value="">Todos os Motoristas</option>
                    {motoristas.map(m => (
                      <option key={m.id} value={m.id}>{m.nome}</option>
                    ))}
                  </select>
                  <select
                    className="border rounded px-2 py-1"
                    value={filtros.veiculo}
                    onChange={e => setFiltros(prev => ({ ...prev, veiculo: e.target.value }))}
                  >
                    <option value="">Todos os Veículos</option>
                    {veiculos.map(v => (
                      <option key={v.id} value={v.id}>{v.placa}</option>
                    ))}
                  </select>
                </div>
                <Calendar
                  mode={viewMode}
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border"
                  locale={ptBR}
                />
                <div className="space-y-2">
                  <h3 className="font-medium">Reservas do Período</h3>
                  {reservasFiltradas.map(reserva => (
                    <div
                      key={reserva.id}
                      className={`flex items-center justify-between p-2 rounded-md ${STATUS_COLORS[reserva.status]}`}
                    >
                      <div className="flex flex-col">
                        <span>{format(new Date(reserva.data_inicio), "HH:mm")}</span>
                        <span className="text-sm text-gray-500">
                          {motoristas.find(m => m.id === reserva.motorista_id)?.nome}
                        </span>
                      </div>
                      <span className="capitalize">{reserva.status}</span>
                    </div>
                  ))}
                  {reservasFiltradas.length === 0 && (
                    <div className="text-center text-gray-500 py-4">
                      Nenhuma reserva encontrada para o período.
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alertas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {alertas.map((alerta, index) => (
                <div
                  key={index}
                  className={`flex items-center p-4 rounded-md ${
                    alerta.prioridade === "alta" ? "bg-red-100" :
                    alerta.prioridade === "media" ? "bg-yellow-100" :
                    "bg-blue-100"
                  }`}
                >
                  {alerta.icone}
                  <span>{alerta.mensagem}</span>
                </div>
              ))}
              {alertas.length === 0 && (
                <div className="text-center text-muted-foreground">
                  Nenhum alerta no momento
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Receita por Período</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={reservas.map(r => ({
                  data: format(new Date(r.data_inicio), "dd/MM"),
                  receita: r.valor_total
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="data" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="receita" stroke="#8884d8" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status das Reservas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={Object.entries(
                      reservas.reduce((acc, r) => {
                        acc[r.status] = (acc[r.status] || 0) + 1
                        return acc
                      }, {})
                    ).map(([status, count]) => ({
                      name: status,
                      value: count
                    }))}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label
                  >
                    {Object.entries(
                      reservas.reduce((acc, r) => {
                        acc[r.status] = (acc[r.status] || 0) + 1
                        return acc
                      }, {})
                    ).map((entry, index) => (
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

        <Card>
          <CardHeader>
            <CardTitle>Ocupação por Veículo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={veiculos.map(v => ({
                  veiculo: v.placa,
                  ocupacao: (v.reservas_concluidas / v.total_reservas) * 100
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="veiculo" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="ocupacao" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Desempenho dos Motoristas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={motoristas.map(m => ({
                  motorista: m.nome,
                  avaliacao: m.avaliacao_media,
                  corridas: m.total_corridas
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="motorista" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="avaliacao" fill="#82ca9d" />
                  <Bar yAxisId="right" dataKey="corridas" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {loading && <div>Carregando...</div>}
      {error && <div className="text-red-500">Erro: {error}</div>}
    </div>
  )
} 