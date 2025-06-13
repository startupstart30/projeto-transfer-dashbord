# Roadmap de Evolução do Dashboard Administrativo

Este documento detalha as fases de evolução para transformar o painel administrativo do projeto AZ Transfer em um sistema robusto, conectado a dados reais e pronto para produção.

---

## Fase 1: Integração de Dados Reais (Backend)

✅ **Concluída**

**Objetivo:** Substituir dados mockados por dados reais vindos do banco de dados (ex: Supabase).

### Ações:
- Configurar Supabase (ou outro backend) e conectar o projeto.
- Implementar autenticação real (usuário/senha, JWT, etc).
- Buscar e exibir KPIs reais no dashboard (reservas, motoristas, veículos, receita).
- Exibir reservas reais no calendário e listas.
- Exibir alertas reais (ex: falta de motoristas, manutenção, etc).

### Critérios de Aceite:
- Todos os dados do dashboard vêm do backend.
- Login seguro e persistente.
- Mock removido do código.

---

## Fase 2: Funcionalidades Avançadas do Calendário

✅ **Concluída**

**Objetivo:** Tornar o calendário interativo e útil para o gestor.

### Ações:
- Permitir visualização por dia, semana e mês.
- Exibir reservas e eventos no calendário.
- Permitir navegação entre datas.
- Adicionar filtros (por motorista, veículo, status).

### Critérios de Aceite:
- Calendário exibe eventos reais.
- Navegação e filtros funcionais.

---

## Fase 3: Alertas e Notificações Dinâmicas

**Em andamento**

- Implementação do painel de alertas dinâmicos no dashboard.
- Exemplo de alertas: reservas pendentes, motoristas insuficientes, pagamentos não remunerados.

### Ações:
- Gerar alertas automáticos com base em regras de negócio (ex: motorista insuficiente, manutenção próxima).
- Implementar notificações em tempo real (ex: Supabase Realtime, WebSocket).
- Permitir configuração de preferências de notificação (email, push, SMS).

### Critérios de Aceite:
- Alertas são dinâmicos e baseados em dados reais.
- Notificações chegam ao usuário conforme preferências.

---

## Fase 4: Relatórios e Exportação

**Objetivo:** Oferecer relatórios detalhados e exportação de dados.

### Ações:
- Gerar gráficos reais de receita, viagens, desempenho de motoristas, etc.
- Permitir exportação de relatórios em PDF/Excel.
- Adicionar filtros avançados por período, categoria, etc.

### Critérios de Aceite:
- Relatórios exportáveis e com dados reais.
- Gráficos dinâmicos e filtráveis.

---

## Fase 5: Segurança e Auditoria

**Objetivo:** Garantir segurança e rastreabilidade.

### Ações:
- Implementar logs de acesso e ações administrativas.
- Adicionar autenticação de dois fatores (2FA).
- Revisar permissões e roles de usuários.

### Critérios de Aceite:
- Logs acessíveis para auditoria.
- 2FA disponível para administradores.
- Permissões revisadas e seguras.

---

## Fase 6: UX/UI e Mobile

**Objetivo:** Melhorar a experiência do usuário.

### Ações:
- Ajustar responsividade e usabilidade em dispositivos móveis.
- Melhorar feedbacks visuais, loading, mensagens de erro.
- Testar acessibilidade.

### Critérios de Aceite:
- Painel 100% responsivo.
- Experiência fluida em mobile e desktop.
- Acessibilidade básica garantida.

---

## Observações Gerais
- Cada fase pode ser entregue e testada separadamente.
- Priorize conforme a necessidade do negócio.
- Recomenda-se versionar este roadmap e atualizar conforme evolução do projeto.

---

**Última atualização:** <!-- Atualize esta data conforme necessário --> 