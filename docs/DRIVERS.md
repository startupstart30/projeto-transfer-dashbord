# Módulo de Motoristas

## Estrutura do Banco

### Tabela `drivers`
- `id`: UUID (PK)
- `full_name`: TEXT (NOT NULL)
- `email`: TEXT (UNIQUE, NOT NULL)
- `phone`: TEXT
- `license_number`: TEXT (UNIQUE, NOT NULL)
- `status`: TEXT (NOT NULL, CHECK IN ('active', 'inactive', 'suspended'))
- `avatar_url`: TEXT
- `vehicle_id`: UUID (FK -> vehicles.id)
- `created_at`: TIMESTAMP WITH TIME ZONE (DEFAULT NOW())
- `updated_at`: TIMESTAMP WITH TIME ZONE (DEFAULT NOW())

### Relacionamentos
- `drivers.vehicle_id` -> `vehicles.id`
- `bookings.driver_id` -> `drivers.id`

## Funcionalidades

### 1. Listagem de Motoristas
- **Rota**: `/admin/drivers`
- **Funcionalidades**:
  - Lista todos os motoristas com paginação
  - Filtros por status, nome, email e CNH
  - Busca por texto em nome, email e CNH
  - Ordenação por nome, status e data de criação
  - Ações rápidas: editar, excluir, ver perfil
  - Exportação para CSV
  - Feedback visual para todas as ações

### 2. Cadastro de Motorista
- **Rota**: `/admin/drivers/new`
- **Funcionalidades**:
  - Formulário com validação
  - Upload de avatar
  - Seleção de veículo
  - Validação de email e CNH únicos
  - Feedback visual de sucesso/erro
  - Redirecionamento após cadastro

### 3. Edição de Motorista
- **Rota**: `/admin/drivers/[id]/edit`
- **Funcionalidades**:
  - Carrega dados existentes
  - Atualização de todos os campos
  - Validação de email e CNH únicos
  - Upload de novo avatar
  - Feedback visual
  - Redirecionamento após edição

### 4. Perfil do Motorista
- **Rota**: `/admin/drivers/[id]`
- **Funcionalidades**:
  - Exibição de dados completos
  - Avatar com fallback para iniciais
  - Rating médio com estrelas
  - Histórico de viagens
  - Status visual
  - Informações de contato
  - Dados do veículo

### 5. Exclusão de Motorista
- **Rota**: `/admin/drivers/[id]/delete`
- **Funcionalidades**:
  - Confirmação antes de excluir
  - Validação de viagens existentes
  - Feedback visual
  - Redirecionamento após exclusão

## Fluxos de Dados

### Cadastro
1. Usuário acessa `/admin/drivers/new`
2. Preenche formulário com dados
3. Sistema valida:
   - Campos obrigatórios
   - Email único
   - CNH única
4. Se válido:
   - Salva dados
   - Upload de avatar (se houver)
   - Redireciona para listagem
5. Se inválido:
   - Exibe erros
   - Mantém dados preenchidos

### Edição
1. Usuário acessa `/admin/drivers/[id]/edit`
2. Sistema carrega dados existentes
3. Usuário atualiza campos
4. Sistema valida:
   - Campos obrigatórios
   - Email único (exceto próprio)
   - CNH única (exceto própria)
5. Se válido:
   - Atualiza dados
   - Atualiza avatar (se houver)
   - Redireciona para listagem
6. Se inválido:
   - Exibe erros
   - Mantém dados preenchidos

### Exclusão
1. Usuário clica em excluir
2. Sistema verifica viagens existentes
3. Se houver viagens:
   - Exibe erro
   - Impede exclusão
4. Se não houver viagens:
   - Confirma exclusão
   - Remove registro
   - Redireciona para listagem

## Exemplos de Uso

### Cadastro de Novo Motorista
```typescript
// Exemplo de dados para cadastro
const newDriver = {
  full_name: "João Silva",
  email: "joao@email.com",
  phone: "(11) 99999-9999",
  license_number: "12345678900",
  status: "active",
  vehicle_id: "uuid-do-veiculo"
}
```

### Atualização de Status
```typescript
// Exemplo de atualização de status
const updateStatus = {
  status: "suspended",
  updated_at: new Date().toISOString()
}
```

### Busca de Motoristas
```typescript
// Exemplo de query de busca
const searchDrivers = {
  query: "joao",
  status: "active",
  page: 1,
  limit: 10
}
```

## Validações

### Campos Obrigatórios
- Nome completo
- Email
- CNH
- Status

### Regras de Negócio
1. Email deve ser único
2. CNH deve ser única
3. Status deve ser um dos valores permitidos
4. Não pode excluir motorista com viagens
5. Rating é calculado a partir das viagens

## Feedback Visual

### Estados
- Carregando: Spinner
- Sucesso: Toast verde
- Erro: Toast vermelho
- Confirmação: Modal

### Cores
- Status Ativo: Verde
- Status Inativo: Cinza
- Status Suspenso: Vermelho
- Rating: Amarelo (estrelas)

## Responsividade

### Breakpoints
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

### Adaptações
- Layout em coluna para mobile
- Tabela com scroll horizontal
- Avatar centralizado em mobile
- Botões empilhados em mobile

## Segurança

### Validações
- Autenticação requerida
- Validação de dados no servidor
- Sanitização de inputs
- Proteção contra SQL Injection

### Permissões
- Apenas administradores
- Validação de propriedade dos dados
- Proteção de rotas

## Performance

### Otimizações
- Paginação de dados
- Lazy loading de imagens
- Cache de queries
- Índices no banco

### Monitoramento
- Logs de ações
- Métricas de performance
- Alertas de erro

## Manutenção

### Backup
- Backup diário do banco
- Backup de arquivos
- Logs de alterações

### Atualizações
- Versionamento semântico
- Changelog
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