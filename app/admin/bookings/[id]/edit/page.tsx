"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Loader2, Plus, X } from "lucide-react";

export default function EditBookingPage() {
  const router = useRouter();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Dados para selects/autocomplete
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  // Formulário
  const [form, setForm] = useState({
    user_id: "",
    pickup_location: "",
    dropoff_location: "",
    pickup_date: "",
    pickup_time: "",
    vehicle_id: "",
    driver_id: "",
    passengers: 1,
    luggage: 0,
    flight_number: "",
    notes: "",
    extras: [] as { id: string; name: string; quantity: number; price: number }[],
  });

  // Carregar dados da reserva
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      // Busca dados para selects
      const [v, d, u] = await Promise.all([
        supabase.from("vehicles").select("id, name, type, license_plate, status"),
        supabase.from("drivers").select("id, full_name, status"),
        supabase.from("users").select("id, full_name, email"),
      ]);
      setVehicles(v.data || []);
      setDrivers(d.data || []);
      setUsers(u.data || []);
      // Busca dados da reserva
      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .select("*, booking_extras:booking_extras(id, extra_id, quantity, price)")
        .eq("id", id)
        .single();
      if (bookingError || !booking) {
        setError("Reserva não encontrada.");
        setLoading(false);
        return;
      }
      setForm({
        user_id: booking.user_id || "",
        pickup_location: booking.pickup_location || "",
        dropoff_location: booking.dropoff_location || "",
        pickup_date: booking.pickup_date || "",
        pickup_time: booking.pickup_time || "",
        vehicle_id: booking.vehicle_id || "",
        driver_id: booking.driver_id || "",
        passengers: booking.passengers || 1,
        luggage: booking.luggage || 0,
        flight_number: booking.flight_number || "",
        notes: booking.notes || "",
        extras: (booking.booking_extras || []).map((ex: any) => ({
          id: ex.extra_id,
          name: ex.name || "",
          quantity: ex.quantity,
          price: ex.price,
        })),
      });
      setLoading(false);
    }
    if (id) fetchData();
  }, [id]);

  // Manipulação de campos
  function handleChange(e: any) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  // Adicionar/remover extras
  function handleAddExtra() {
    setForm((prev) => ({
      ...prev,
      extras: [...prev.extras, { id: "", name: "", quantity: 1, price: 0 }],
    }));
  }
  function handleRemoveExtra(idx: number) {
    setForm((prev) => ({
      ...prev,
      extras: prev.extras.filter((_, i) => i !== idx),
    }));
  }
  function handleExtraChange(idx: number, field: string, value: any) {
    setForm((prev) => ({
      ...prev,
      extras: prev.extras.map((ex, i) =>
        i === idx ? { ...ex, [field]: value } : ex
      ),
    }));
  }

  // Validação básica
  function validate() {
    if (!form.user_id || !form.pickup_location || !form.dropoff_location || !form.pickup_date || !form.pickup_time || !form.vehicle_id) {
      setError("Preencha todos os campos obrigatórios.");
      return false;
    }
    if (form.passengers < 1) {
      setError("Número de passageiros inválido.");
      return false;
    }
    return true;
  }

  // Submissão
  async function handleSubmit(e: any) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    if (!validate()) return;
    setSaving(true);
    // Atualiza reserva
    const { error: bookingError } = await supabase
      .from("bookings")
      .update({
        user_id: form.user_id,
        pickup_location: form.pickup_location,
        dropoff_location: form.dropoff_location,
        pickup_date: form.pickup_date,
        pickup_time: form.pickup_time,
        vehicle_id: form.vehicle_id,
        passengers: form.passengers,
        luggage: form.luggage,
        flight_number: form.flight_number,
        notes: form.notes,
      })
      .eq("id", id);
    if (bookingError) {
      setError("Erro ao atualizar reserva.");
      setSaving(false);
      return;
    }
    // Atualiza extras: remove todos e insere novamente
    await supabase.from("booking_extras").delete().eq("booking_id", id);
    if (form.extras.length > 0) {
      const extrasData = form.extras
        .filter((ex) => ex.name && ex.quantity > 0)
        .map((ex) => ({
          booking_id: id,
          extra_id: ex.id,
          quantity: ex.quantity,
          price: ex.price,
        }));
      if (extrasData.length > 0) {
        const { error: extrasError } = await supabase
          .from("booking_extras")
          .insert(extrasData);
        if (extrasError) {
          setError("Reserva atualizada, mas erro ao salvar extras.");
          setSaving(false);
          return;
        }
      }
    }
    setSuccess(true);
    setSaving(false);
    setTimeout(() => {
      router.push("/admin/bookings");
    }, 1200);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin w-8 h-8 text-gray-500" />
        <span className="ml-2">Carregando reserva...</span>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Editar Reserva</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6 flex flex-col gap-6">
        {/* Cliente */}
        <div>
          <label className="block text-sm font-medium mb-1">Cliente *</label>
          <select
            name="user_id"
            value={form.user_id}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2"
            required
          >
            <option value="">Selecione o cliente</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>
            ))}
          </select>
        </div>
        {/* Origem/Destino */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Origem *</label>
            <input
              name="pickup_location"
              value={form.pickup_location}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2"
              required
              placeholder="Endereço de origem"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Destino *</label>
            <input
              name="dropoff_location"
              value={form.dropoff_location}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2"
              required
              placeholder="Endereço de destino"
            />
          </div>
        </div>
        {/* Data/Hora */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Data *</label>
            <input
              type="date"
              name="pickup_date"
              value={form.pickup_date}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Hora *</label>
            <input
              type="time"
              name="pickup_time"
              value={form.pickup_time}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2"
              required
            />
          </div>
        </div>
        {/* Veículo */}
        <div>
          <label className="block text-sm font-medium mb-1">Veículo *</label>
          <select
            name="vehicle_id"
            value={form.vehicle_id}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2"
            required
          >
            <option value="">Selecione o veículo</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>{v.name} ({v.license_plate})</option>
            ))}
          </select>
        </div>
        {/* Motorista */}
        <div>
          <label className="block text-sm font-medium mb-1">Motorista</label>
          <select
            name="driver_id"
            value={form.driver_id}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2"
          >
            <option value="">Selecione o motorista</option>
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>{d.full_name}</option>
            ))}
          </select>
        </div>
        {/* Passageiros/Bagagem */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Passageiros *</label>
            <input
              type="number"
              name="passengers"
              min={1}
              value={form.passengers}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Bagagem</label>
            <input
              type="number"
              name="luggage"
              min={0}
              value={form.luggage}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
        </div>
        {/* Voo */}
        <div>
          <label className="block text-sm font-medium mb-1">Nº do Voo</label>
          <input
            name="flight_number"
            value={form.flight_number}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="Opcional"
          />
        </div>
        {/* Extras */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium">Extras</label>
            <button type="button" className="flex items-center text-xs text-blue-600 hover:underline" onClick={handleAddExtra}>
              <Plus className="w-4 h-4 mr-1" /> Adicionar extra
            </button>
          </div>
          {form.extras.length > 0 && (
            <div className="flex flex-col gap-2">
              {form.extras.map((ex, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input
                    className="border rounded px-2 py-1 w-32"
                    placeholder="Nome"
                    value={ex.name}
                    onChange={e => handleExtraChange(idx, "name", e.target.value)}
                  />
                  <input
                    className="border rounded px-2 py-1 w-20"
                    type="number"
                    min={1}
                    placeholder="Qtd"
                    value={ex.quantity}
                    onChange={e => handleExtraChange(idx, "quantity", Number(e.target.value))}
                  />
                  <input
                    className="border rounded px-2 py-1 w-24"
                    type="number"
                    min={0}
                    step={0.01}
                    placeholder="Preço"
                    value={ex.price}
                    onChange={e => handleExtraChange(idx, "price", Number(e.target.value))}
                  />
                  <button type="button" className="text-red-500 hover:text-red-700" onClick={() => handleRemoveExtra(idx)}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Observações */}
        <div>
          <label className="block text-sm font-medium mb-1">Observações</label>
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2"
            rows={3}
            placeholder="Observações para o motorista, detalhes do cliente, etc."
          />
        </div>
        {/* Feedback visual */}
        {error && <div className="text-red-600 text-sm font-semibold">{error}</div>}
        {success && <div className="text-green-600 text-sm font-semibold">Reserva atualizada com sucesso!</div>}
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            className="px-4 py-2 rounded-lg border bg-gray-100 hover:bg-gray-200"
            onClick={() => router.push("/admin/bookings")}
            disabled={saving}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-[#E95440] text-white font-semibold hover:bg-[#d64a36] flex items-center gap-2"
            disabled={saving}
          >
            {saving && <Loader2 className="animate-spin w-4 h-4" />} Salvar Alterações
          </button>
        </div>
      </form>
    </div>
  );
} 