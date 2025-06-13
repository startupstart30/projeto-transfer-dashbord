# Trips – CRUD de Reservas (Detalhamento Técnico)

Este documento descreve, de forma detalhada, como implementar o módulo **Trips** (CRUD de reservas) com filtros avançados e importação de dados via CSV, utilizando Next.js e Supabase.

---

## 1. Estrutura do Banco de Dados (Supabase)

### Tabela: `reservas`
- `id` (UUID, PK)
- `data_inicio` (timestamp)
- `data_fim` (timestamp)
- `motorista_id` (UUID, FK)
- `veiculo_id` (UUID, FK)
- `status` (string: pendente, confirmada, concluida, cancelada)
- `valor_total` (decimal)
- `avaliacao` (decimal, opcional)
- Outros campos relevantes (ex: observações)

---

## 2. Rotas e Páginas

- `/admin/trips` – Listagem, filtros e ações
- `/admin/trips/new` – Cadastro de nova reserva
- `/admin/trips/[id]/edit` – Edição de reserva existente

---

## 3. Funcionalidades CRUD

### a) **Listagem de Reservas**
- Tabela paginada com colunas principais (data, motorista, veículo, status, valor)
- Ações rápidas: editar, excluir, visualizar detalhes
- Botão para importar CSV

### b) **Criação de Reserva**
- Formulário com seleção de motorista, veículo, datas, status, valor
- Validação de conflitos de horário
- Persistência no Supabase

### c) **Edição de Reserva**
- Carregamento dos dados existentes
- Permitir alteração de qualquer campo (exceto ID)
- Validação igual à criação

### d) **Exclusão de Reserva**
- Confirmação antes de excluir
- Remoção via Supabase

---

## 4. Filtros Avançados

- Por período (data início/fim)
- Por motorista
- Por veículo
- Por status
- Por valor mínimo/máximo
- Busca textual (ex: observações)

**Implementação:**
- Inputs/selects acima da tabela
- Atualização automática dos resultados ao alterar filtros
- Query dinâmica no Supabase (usando `.or`, `.ilike`, `.gte`, `.lte` etc.)

---

## 5. Importação CSV

### a) **Layout do CSV esperado**
| data_inicio | data_fim | motorista_id | veiculo_id | status | valor_total | avaliacao |
|-------------|----------|--------------|------------|--------|-------------|-----------|

### b) **Fluxo de Importação**
1. Usuário seleciona arquivo CSV
2. Validação do layout e dados obrigatórios
3. Exibição de preview dos dados
4. Importação em lote para Supabase (inserção múltipla)
5. Exibição de erros/sucessos por linha

### c) **Bibliotecas Sugeridas**
- [papaparse](https://www.npmjs.com/package/papaparse) para parsing do CSV
- Validação customizada em JS/TS

---

## 6. Componentes Sugeridos

- **TripsTable**: tabela de reservas com filtros e ações
- **TripForm**: formulário de criação/edição
- **CSVImportModal**: modal para upload, preview e importação
- **TripFilters**: componente de filtros avançados

---

## 7. Permissões e Segurança
- Restringir acesso às rotas a usuários autenticados/admin
- Validar permissões antes de criar/editar/excluir

---

## 8. UX/UI
- Feedback visual para loading, sucesso e erro
- Confirmações para ações destrutivas
- Mensagens claras em caso de erro de importação
- Layout responsivo

---

## 9. Exemplos de Código

### a) **Query com Filtros Dinâmicos (Supabase JS)**
```ts
let query = supabase.from('reservas').select('*')
if (status) query = query.eq('status', status)
if (motoristaId) query = query.eq('motorista_id', motoristaId)
if (veiculoId) query = query.eq('veiculo_id', veiculoId)
if (dataInicio) query = query.gte('data_inicio', dataInicio)
if (dataFim) query = query.lte('data_fim', dataFim)
// ... outros filtros
```

### b) **Importação CSV com PapaParse**
```ts
import Papa from 'papaparse'

Papa.parse(file, {
  header: true,
  complete: (results) => {
    // Validar e importar para Supabase
  },
})
```

---

## 10. Referências
- [Supabase JS Docs](https://supabase.com/docs/reference/javascript/select)
- [PapaParse Docs](https://www.papaparse.com/docs)
- [Next.js Routing](https://nextjs.org/docs/app/building-your-application/routing)

---

## Resumo de Implementação – Módulo Trips (Reservas)

- **CRUD Completo de Reservas**
  - Listagem paginada com filtros avançados (status, motorista, veículo, período, valor, busca textual)
  - Criação de reserva com formulário validado (motorista, veículo, datas, status, valor, observações)
  - Edição de reserva com carregamento e atualização dos dados
  - Exclusão de reserva com confirmação e atualização dinâmica da lista

- **Importação CSV**
  - Botão para importar reservas em lote via arquivo CSV
  - Modal de upload com preview dos dados
  - Validação de campos obrigatórios
  - Feedback visual de loading, sucesso e erro
  - Importação em lote para Supabase

- **UX/UI e Acessibilidade**
  - Mensagens de loading, sucesso e erro em todas as ações
  - Modal acessível (aria, foco automático, responsividade)
  - Botões com estados de loading/desabilitado
  - Layout responsivo para desktop e mobile

- **Código limpo e tipado**
  - Tipagem correta para integração com Supabase e papaparse
  - Sem linter errors

**O módulo Trips está pronto para uso, com todas as funcionalidades e experiência de usuário de alto nível!**

---

**Este documento serve como guia para implementação e manutenção do módulo Trips (CRUD de reservas) no projeto.** 