# Módulo de Veículos

## Estrutura do Banco

### Tabela `vehicles`
- `id`: UUID (PK)
- `name`: TEXT (NOT NULL)
- `type`: TEXT (NOT NULL)
- `year`: INTEGER
- `license_plate`: TEXT (UNIQUE, NOT NULL)
- `status`: TEXT (NOT NULL, CHECK IN ('active', 'maintenance', 'inactive'))
- `passengers`: INTEGER (NOT NULL)
- `luggage`: INTEGER (NOT NULL)
- `image_url`: TEXT
- `created_at`: TIMESTAMP WITH TIME ZONE (DEFAULT NOW())
- `updated_at`: TIMESTAMP WITH TIME ZONE (DEFAULT NOW())

### Relacionamentos
- `drivers.vehicle_id` -> `vehicles.id`
- `bookings.vehicle_id` -> `vehicles.id`

## Funcionalidades

### 1. Listagem de Veículos
- **Rota**: `/admin/vehicles`
- **Funcionalidades**:
  - Lista todos os veículos com paginação
  - Filtros por status, tipo e ano
  - Busca por texto em nome, placa e tipo
  - Ordenação por nome
  - Ações rápidas: editar, excluir
  - Exportação para CSV
  - Feedback visual para todas as ações

### 2. Cadastro de Veículo
- **Rota**: `/admin/vehicles/new`
- **Funcionalidades**:
  - Formulário com validação
  - Upload de imagem
  - Validação de placa única
  - Feedback visual de sucesso/erro
  - Redirecionamento após cadastro

### 3. Edição de Veículo
- **Rota**: `/admin/vehicles/[id]/edit`
- **Funcionalidades**:
  - Carrega dados existentes
  - Atualização de todos os campos
  - Validação de placa única (exceto próprio)
  - Upload de nova imagem
  - Feedback visual
  - Redirecionamento após edição

### 4. Exclusão de Veículo
- **Rota**: `/admin/vehicles/[id]/delete`
- **Funcionalidades**:
  - Confirmação antes de excluir
  - Validação de motoristas/reservas existentes
  - Feedback visual
  - Redirecionamento após exclusão

## Fluxos de Dados

### Cadastro
1. Usuário acessa `/admin/vehicles/new`
2. Preenche formulário com dados
3. Sistema valida:
   - Campos obrigatórios
   - Placa única
4. Se válido:
   - Upload de imagem (se houver)
   - Salva dados
   - Redireciona para listagem
5. Se inválido:
   - Exibe erros
   - Mantém dados preenchidos

### Edição
1. Usuário acessa `/admin/vehicles/[id]/edit`
2. Sistema carrega dados existentes
3. Usuário atualiza campos
4. Sistema valida:
   - Campos obrigatórios
   - Placa única (exceto próprio)
5. Se válido:
   - Upload de nova imagem (se houver)
   - Atualiza dados
   - Redireciona para listagem
6. Se inválido:
   - Exibe erros
   - Mantém dados preenchidos

### Exclusão
1. Usuário clica em excluir
2. Sistema verifica motoristas/reservas existentes
3. Se houver motoristas/reservas:
   - Exibe erro
   - Impede exclusão
4. Se não houver motoristas/reservas:
   - Confirma exclusão
   - Remove registro
   - Redireciona para listagem

## Exemplos de Uso

### Cadastro de Novo Veículo
```typescript
// Exemplo de dados para cadastro
const newVehicle = {
  name: "Mercedes-Benz S-Class",
  type: "Business Class",
  year: 2023,
  license_plate: "ABC1234",
  status: "active",
  passengers: 4,
  luggage: 3,
  image_url: "https://..."
}
```

### Atualização de Status
```typescript
// Exemplo de atualização de status
const updateStatus = {
  status: "maintenance",
  updated_at: new Date().toISOString()
}
```

### Busca de Veículos
```typescript
// Exemplo de query de busca
const searchVehicles = {
  query: "mercedes",
  status: "active",
  type: "Business Class",
  page: 1,
  limit: 10
}
```

## Validações

### Campos Obrigatórios
- Nome/Modelo
- Tipo
- Ano
- Placa
- Status
- Passageiros
- Bagagem

### Regras de Negócio
1. Placa deve ser única
2. Status deve ser um dos valores permitidos
3. Não pode excluir veículo com motoristas/reservas
4. Ano deve ser válido
5. Passageiros e bagagem devem ser números positivos

## Feedback Visual

### Estados
- Carregando: Spinner
- Sucesso: Toast verde
- Erro: Toast vermelho
- Confirmação: Modal

### Cores
- Status Ativo: Verde
- Status Manutenção: Amarelo
- Status Inativo: Vermelho

## Responsividade

### Breakpoints
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

### Adaptações
- Layout em coluna para mobile
- Tabela com scroll horizontal
- Imagem centralizada em mobile
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
- Backup de imagens
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