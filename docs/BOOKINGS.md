# Módulo de Reservas (Trips/Bookings)

## Estrutura do Banco

### Tabela `bookings`
- `id`: UUID (PK)
- `user_id`: UUID (FK para users)
- `pickup_location`: TEXT (NOT NULL)
- `dropoff_location`: TEXT (NOT NULL)
- `pickup_date`: DATE (NOT NULL)
- `pickup_time`: TIME (NOT NULL)
- `distance_km`: NUMERIC
- `duration_min`: INT
- `vehicle_id`: UUID (FK para vehicles)
- `flight_number`: TEXT
- `passengers`: INT (NOT NULL, DEFAULT 1)
- `luggage`: INT (NOT NULL, DEFAULT 0)
- `notes`: TEXT
- `total_amount`: NUMERIC (NOT NULL)
- `status`: TEXT (NOT NULL, DEFAULT 'pending', CHECK)
- `payment_status`: TEXT (DEFAULT 'unpaid', CHECK)
- `payment_method`: TEXT
- `created_at`: TIMESTAMPTZ (DEFAULT NOW())
- `updated_at`: TIMESTAMPTZ (DEFAULT NOW())

### Tabela `booking_extras`
- `booking_id`: UUID (FK para bookings)
- `extra_id`: UUID (FK para extras)
- `quantity`: INT (NOT NULL, DEFAULT 1)
- `price`: NUMERIC (NOT NULL)

### View `vw_bookings_full`
- Junta bookings, vehicles, drivers para facilitar listagem e filtros.

## Funcionalidades

### 1. Listagem de Reservas
- **Rota**: `/admin/bookings`
- Busca, filtros avançados (status, data, cliente, origem, destino, veículo, motorista, pagamento)
- Paginação
- Exportação para CSV
- Feedback visual de carregamento/erro
- Layout responsivo

### 2. Cadastro de Reserva
- **Rota**: `/admin/bookings/new`
- Seleção de cliente, veículo, motorista (autocomplete)
- Campos de origem, destino, data, hora, passageiros, bagagem, extras, observações
- Validação de campos obrigatórios
- Feedback visual de sucesso/erro
- Integração com Supabase

### 3. Edição de Reserva
- **Rota**: `/admin/bookings/[id]/edit`
- Carrega dados atuais da reserva e extras
- Permite editar todos os campos
- Validação e feedback visual
- Atualização no Supabase

### 4. Visualização Detalhada
- **Rota**: `/admin/bookings/[id]`
- Exibe todos os dados da reserva, extras, histórico, status, pagamento
- Ações rápidas: editar, duplicar, cancelar

### 5. Exclusão de Reserva
- Confirmação antes de excluir
- Validação de dependências
- Feedback visual

## Fluxos de Dados

### Cadastro
1. Usuário acessa `/admin/bookings/new`
2. Preenche formulário
3. Sistema valida campos obrigatórios
4. Salva reserva e extras
5. Feedback visual e redirecionamento

### Edição
1. Usuário acessa `/admin/bookings/[id]/edit`
2. Sistema carrega dados
3. Usuário edita campos
4. Sistema valida e atualiza dados
5. Feedback visual e redirecionamento

### Exclusão
1. Usuário solicita exclusão
2. Sistema valida dependências
3. Remove reserva e extras
4. Feedback visual

## Exemplos de Uso

### Cadastro de Nova Reserva
```typescript
const newBooking = {
  user_id: "uuid",
  pickup_location: "Aeroporto",
  dropoff_location: "Hotel",
  pickup_date: "2024-06-01",
  pickup_time: "14:00",
  vehicle_id: "uuid",
  passengers: 2,
  luggage: 2,
  notes: "Cliente VIP",
}
```

### Atualização de Status
```typescript
const updateStatus = {
  status: "completed",
  payment_status: "paid",
  updated_at: new Date().toISOString()
}
```

### Busca de Reservas
```typescript
const search = {
  status: "completed",
  pickup_location: "aeroporto",
  page: 1,
  limit: 10
}
```

## Validações
- Campos obrigatórios: cliente, origem, destino, data, hora, veículo, passageiros
- Passageiros >= 1
- Status e pagamento válidos
- Não excluir reservas vinculadas a pagamentos

## Feedback Visual
- Carregando: Spinner
- Sucesso: Toast verde
- Erro: Toast vermelho
- Confirmação: Modal

## Responsividade
- Layout adaptado para mobile, tablet e desktop
- Tabelas com scroll horizontal
- Formulários em coluna no mobile

## Segurança
- Autenticação obrigatória
- Validação de dados no backend
- Proteção de rotas administrativas
- RLS no banco (usuário só vê suas reservas)

## Performance
- Paginação e busca otimizadas
- Índices em campos de filtro
- Cache de queries

## Manutenção
- Backup diário do banco
- Logs de alterações
- Documentação atualizada

## Checklist de Commit
- [ ] Testes passando
- [ ] Lint sem erros
- [ ] Documentação atualizada
- [ ] Código revisado
- [ ] Performance verificada
- [ ] Responsividade testada
- [ ] Segurança validada
- [ ] Feedback visual implementado
- [ ] Logs adicionados
- [ ] Backup realizado 