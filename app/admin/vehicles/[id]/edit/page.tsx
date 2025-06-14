export default function EditVehiclePage({ params }: { params: { id: string } }) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Editar Veículo</h1>
      <div className="border rounded p-8 text-center text-muted-foreground">
        Formulário de edição do veículo {params.id} será exibido aqui.
      </div>
    </div>
  )
} 