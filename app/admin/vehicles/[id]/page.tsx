"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import Link from "next/link";
import { Loader2, Pencil, Trash2, ArrowLeft, Users, Briefcase, Calendar, Car, Package } from "lucide-react";

type Vehicle = {
  id: string;
  name: string;
  type: string;
  year: number;
  license_plate: string;
  status: "active" | "maintenance" | "inactive";
  passengers: number;
  luggage: number;
  image_url?: string;
};

type Booking = {
  id: string;
  date: string;
  origin: string;
  destination: string;
  status: string;
  amount: number;
  driver?: { full_name: string } | null;
};

export default function VehicleProfile() {
  const { id } = useParams();
  const router = useRouter();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError("");
      // Busca dados do veículo
      const { data: vehicleData, error: vehicleError } = await supabase
        .from("vehicles")
        .select("*")
        .eq("id", id)
        .single();
      if (vehicleError || !vehicleData) {
        setError("Veículo não encontrado.");
        setLoading(false);
        return;
      }
      setVehicle(vehicleData as Vehicle);
      // Busca histórico de viagens
      const { data: bookingsData } = await supabase
        .from("bookings")
        .select("id, date, origin, destination, status, amount, driver:drivers(full_name)")
        .eq("vehicle_id", id)
        .order("date", { ascending: false });
      // Ajusta tipagem do driver
      const bookingsTyped: Booking[] = (bookingsData || []).map((b: any) => ({
        ...b,
        driver: Array.isArray(b.driver) ? b.driver[0] : b.driver || null,
      }));
      setBookings(bookingsTyped);
      setLoading(false);
    }
    if (id) fetchData();
  }, [id]);

  function getStatusColor(status: Vehicle["status"] | string) {
    switch (status) {
      case "active":
        return "bg-green-500 text-white";
      case "maintenance":
        return "bg-yellow-400 text-black";
      case "inactive":
        return "bg-red-500 text-white";
      default:
        return "bg-gray-300 text-black";
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin w-8 h-8 text-gray-500" />
        <span className="ml-2">Carregando...</span>
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="p-6 text-center text-red-600 font-semibold">{error || "Veículo não encontrado."}</div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Header e ações */}
      <div className="flex items-center mb-6 gap-4">
        <button
          className="p-2 rounded hover:bg-gray-100"
          onClick={() => router.push("/admin/vehicles")}
          title="Voltar para listagem"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold flex-1">Perfil do Veículo</h1>
        <Link
          href={`/admin/vehicles/${id}/edit`}
          className="p-2 rounded hover:bg-gray-100"
          title="Editar veículo"
        >
          <Pencil className="w-5 h-5" />
        </Link>
        <Link
          href={`/admin/vehicles/${id}/delete`}
          className="p-2 rounded hover:bg-gray-100"
          title="Excluir veículo"
        >
          <Trash2 className="w-5 h-5 text-red-500" />
        </Link>
      </div>

      {/* Card principal do veículo */}
      <div className="flex flex-col md:flex-row gap-8 bg-white rounded-xl shadow-lg p-6 mb-10 items-center md:items-start">
        <div className="flex flex-col items-center w-full md:w-56">
          <div className="relative w-44 h-32 rounded-xl overflow-hidden border-2 border-gray-200 bg-gray-50 flex items-center justify-center">
            {vehicle.image_url ? (
              <Image
                src={vehicle.image_url}
                alt={vehicle.name}
                width={176}
                height={128}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="text-gray-400">Sem imagem</div>
            )}
            <span className={`absolute top-2 left-2 px-3 py-1 rounded-full text-xs font-semibold shadow ${getStatusColor(vehicle.status)}`}>
              {vehicle.status === "active" && "Ativo"}
              {vehicle.status === "maintenance" && "Manutenção"}
              {vehicle.status === "inactive" && "Inativo"}
            </span>
          </div>
          <div className="mt-4 text-center">
            <div className="text-lg font-bold">{vehicle.name}</div>
            <div className="text-gray-500 text-sm">{vehicle.type}</div>
          </div>
        </div>
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
          <div className="bg-gray-50 rounded-lg p-4 flex items-center gap-3 shadow-sm">
            <Calendar className="w-5 h-5 text-blue-500" />
            <div>
              <div className="text-xs text-gray-500">Ano</div>
              <div className="font-semibold">{vehicle.year}</div>
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 flex items-center gap-3 shadow-sm">
            <Car className="w-5 h-5 text-indigo-500" />
            <div>
              <div className="text-xs text-gray-500">Placa</div>
              <div className="font-semibold">{vehicle.license_plate}</div>
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 flex items-center gap-3 shadow-sm">
            <Users className="w-5 h-5 text-green-600" />
            <div>
              <div className="text-xs text-gray-500">Capacidade</div>
              <div className="font-semibold">{vehicle.passengers} passageiros</div>
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 flex items-center gap-3 shadow-sm">
            <Package className="w-5 h-5 text-yellow-600" />
            <div>
              <div className="text-xs text-gray-500">Bagagem</div>
              <div className="font-semibold">{vehicle.luggage} malas</div>
            </div>
          </div>
        </div>
      </div>

      {/* Histórico de Viagens */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-gray-700" /> Histórico de Viagens
        </h2>
        {bookings.length === 0 ? (
          <div className="text-gray-500">Nenhuma viagem registrada para este veículo.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border text-sm rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 border">Data</th>
                  <th className="p-2 border">Origem</th>
                  <th className="p-2 border">Destino</th>
                  <th className="p-2 border">Motorista</th>
                  <th className="p-2 border">Status</th>
                  <th className="p-2 border">Valor</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-blue-50 transition-colors">
                    <td className="p-2 border">{b.date ? new Date(b.date).toLocaleDateString() : "-"}</td>
                    <td className="p-2 border">{b.origin}</td>
                    <td className="p-2 border">{b.destination}</td>
                    <td className="p-2 border">{b.driver?.full_name || "-"}</td>
                    <td className="p-2 border">{b.status}</td>
                    <td className="p-2 border">{typeof b.amount === "number" ? `R$ ${b.amount.toFixed(2)}` : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 