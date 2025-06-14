# Drivers – Perfil, Rating, Histórico de Viagens e Status (Detalhamento Técnico)

Este documento descreve, de forma detalhada e faseada, como implementar o módulo **Drivers** (perfil de motoristas, avaliação/rating, histórico de viagens e status), utilizando Next.js e Supabase.

---

## Fase 1: Estrutura do Banco de Dados (Supabase)

### Tabela: `drivers`
- `id` (UUID, PK)
- `full_name` (string)
- `phone` (string)
- `email` (string)
- `license_number` (string)
- `status` (string: active, inactive, suspended)
- `avatar_url` (string)
- `rating` (decimal, média das avaliações)
- `vehicle_id` (UUID, FK para vehicles)
- `created_at`, `updated_at` (timestamp)

### Tabela: `bookings` (relacionada)
- `id`, `driver_id`, `pickup_location`, `dropoff_location`, `pickup_date`, `status`, `rating`, etc.

---

## Fase 2: Rotas e Páginas

- `/admin/drivers` – Listagem, filtros e ações
- `/admin/drivers/new` – Cadastro de novo motorista
- `/admin/drivers/[id]/edit` – Edição de motorista
- `/admin/drivers/[id]` – Perfil detalhado do motorista (rating, histórico de viagens)

---

## Fase 3: Cadastro e Edição de Motoristas

- Formulário para cadastro/edição com campos obrigatórios (nome, telefone, email, CNH, status, veículo)
- Upload de foto/avatar
- Validação de email e CNH únicos
- Persistência no Supabase

---

## Fase 4: Listagem, Filtros e Busca

- Tabela paginada com colunas principais (nome, status, rating, veículo, telefone)
- Filtros por status, rating mínimo, veículo
- Busca textual (nome, email, CNH)
- Ações rápidas: editar, visualizar perfil, excluir

---

## Fase 5: Perfil do Motorista

- Página detalhada com:
  - Dados do motorista (foto, nome, status, contato, veículo)
  - Rating médio (estrelinhas)
  - Histórico de viagens (tabela de bookings)
  - Gráficos de desempenho (opcional)

---

## Fase 6: UX/UI e Segurança

- Feedback visual para loading, sucesso e erro
- Confirmações para ações destrutivas
- Layout responsivo
- Restringir acesso às rotas a usuários autenticados/admin

---

## Exemplos de Código

### a) Query com Filtros Dinâmicos (Supabase JS)
```ts
let query = supabase.from('drivers').select('*')
if (status) query = query.eq('status', status)
if (vehicleId) query = query.eq('vehicle_id', vehicleId)
if (ratingMin) query = query.gte('rating', ratingMin)
if (busca) query = query.or(`full_name.ilike.%${busca}%,email.ilike.%${busca}%,license_number.ilike.%${busca}%`)
// ... outros filtros
```

### b) Buscar histórico de viagens do motorista
```ts
const { data: bookings } = await supabase
  .from('bookings')
  .select('*')
  .eq('driver_id', driverId)
  .order('pickup_date', { ascending: false })
```

---

## Referências
- [Supabase JS Docs](https://supabase.com/docs/reference/javascript/select)
- [Next.js Routing](https://nextjs.org/docs/app/building-your-application/routing)

---

**Este documento serve como guia para implementação e manutenção do módulo Drivers no projeto.** 