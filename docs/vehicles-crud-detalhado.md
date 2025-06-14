# Vehicles – Cadastro, Status e Exportação (Detalhamento Técnico)

Este documento descreve, de forma detalhada e faseada, como implementar o módulo **Vehicles** (cadastro de veículos, controle de status ativo/manutenção e exportação de dados), utilizando Next.js e Supabase.

---

## Fase 1: Estrutura do Banco de Dados (Supabase)

### Tabela: `veiculos`
- `id` (UUID, PK)
- `placa` (string, única)
- `modelo` (string)
- `marca` (string)
- `ano` (integer)
- `status` (string: ativo, manutencao)
- `documento_vencimento` (date)
- `ultima_manutencao` (date)
- Outros campos relevantes (ex: cor, capacidade)

---

## Fase 2: Rotas e Páginas

- `/admin/vehicles` – Listagem, filtros e ações
- `/admin/vehicles/new` – Cadastro de novo veículo
- `/admin/vehicles/[id]/edit` – Edição de veículo existente

---

## Fase 3: Cadastro e Edição de Veículos

- Formulário para cadastro/edição com campos obrigatórios (placa, modelo, marca, ano, status, datas)
- Validação de unicidade da placa
- Permitir alteração do status (ativo/manutenção)
- Persistência no Supabase

---

## Fase 4: Listagem e Filtros

- Tabela paginada com colunas principais (placa, modelo, marca, ano, status, datas)
- Filtros por status, marca, ano, período de manutenção/documento
- Busca textual (placa, modelo, marca)
- Ações rápidas: editar, excluir

---

## Fase 5: Exportação de Dados

- Botão para exportar lista de veículos para CSV e Excel
- Exportação respeita filtros aplicados
- Utilizar bibliotecas como `xlsx` ou `papaparse` para exportação

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
let query = supabase.from('veiculos').select('*')
if (status) query = query.eq('status', status)
if (marca) query = query.ilike('marca', `%${marca}%`)
if (ano) query = query.eq('ano', ano)
if (busca) query = query.or(`placa.ilike.%${busca}%,modelo.ilike.%${busca}%,marca.ilike.%${busca}%`)
// ... outros filtros
```

### b) Exportação para CSV/Excel
```ts
import * as XLSX from 'xlsx'

const ws = XLSX.utils.json_to_sheet(veiculos)
const wb = XLSX.utils.book_new()
XLSX.utils.book_append_sheet(wb, ws, 'Veículos')
XLSX.writeFile(wb, 'veiculos.xlsx')
```

---

## Referências
- [Supabase JS Docs](https://supabase.com/docs/reference/javascript/select)
- [SheetJS/xlsx](https://www.npmjs.com/package/xlsx)
- [PapaParse](https://www.npmjs.com/package/papaparse)
- [Next.js Routing](https://nextjs.org/docs/app/building-your-application/routing)

---

## Resumo de Implementação – Módulo Vehicles

- CRUD completo de veículos: cadastro, edição, exclusão, validação de placa única
- Listagem com filtros (status, tipo, ano), busca textual e paginação
- Exportação de veículos para CSV e Excel, respeitando filtros
- Feedback visual, loading, mensagens de sucesso/erro, responsividade
- Código limpo, tipado e pronto para produção

**Módulo Vehicles pronto para uso!**

**Este documento serve como guia para implementação e manutenção do módulo Vehicles no projeto.** 