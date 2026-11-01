# Especificação de Design: Cards de Status e Filtro de Pedidos

## 1. Resumo de Entendimento (Understanding Summary)
* **Objetivo**: Criar uma esteira de cards interativos para cada status dos pedidos no Painel de Vendas (`Dashboard.tsx`), permitindo filtrar a listagem de pedidos com 1 clique e visualizar contadores em tempo real.
* **Público-alvo**: Administradores e operadores da Loja 3D.
* **Escopo de Status**:
  * `Todos` (reset do filtro)
  * `Aguardando PIX` (Pendente)
  * `Pago` (Em Produção 3D)
  * `Aguardando Retirada` (Balcão)
  * `Aguardando Envio` (Novo status formal)
  * `Concluídos / Enviados`
  * `Cancelados`
* **Não-Metas**:
  * Não substituir as métricas macro do topo (`Receita Total Paga` e `Total Geral de Pedidos`).
  * Não fazer refetch HTTP a cada clique de filtro (filtragem puramente em memória no React).

---

## 2. Premissas e Riscos (Assumptions & Risks)
* **Premissas**:
  * O estado `orders` já carrega a lista completa de pedidos ativos do painel.
  * O modelo `Order.java` utiliza `status VARCHAR(50)`, acomodando `'AGUARDANDO ENVIO'`.
  * A filtragem reativa no front-end opera com tempo de resposta de 0ms.
* **Riscos e Mitigações**:
  * *Risco*: Filtrar por status vazio deixar a tabela sem contexto.
    * *Mitigação*: Exibição de Empty State com mensagem clara e botão de "Limpar Filtro".
  * *Risco*: Dessincronização entre banco e código.
    * *Mitigação*: Aplicação da Regra de Sincronia de Banco de Dados (`db_dev` e `db_prd`) antes de alterações.

---

## 3. Registro de Decisões (Decision Log)

| Decisão | O que foi decidido | Alternativas consideradas | Motivo da escolha |
| :--- | :--- | :--- | :--- |
| **Abordagem de Design** | Abordagem 1 (Esteira de Cards em duas linhas) | Abas estilo Pills | Maior impacto visual e facilidade de operação |
| **Interatividade** | Cards como filtros clicáveis da tabela | Cards apenas estatísticos estáticos | Acelera o fluxo diário de atendimento e expedição |
| **Status `AGUARDANDO ENVIO`** | Criar formalmente no backend e no select de edição | Mapear temporariamente em status legado | Separação real entre produção na impressora 3D e postagem nos Correios |
| **Conteúdo dos Cards** | Ícone temático + Título + Quantidade | Exibir também valor financeiro em R$ | Evita saturação visual e foca em volume operacional |
| **Mecanismo de Filtro** | Estado `statusFilter` no React em memória | Query param / novas requisições HTTP | Fluidez e zero latência |

---

## 4. Design Final & Especificação Técnica

### 4.1 Estrutura Visual
* **Seção 1 (Topo - Métricas Macro)**:
  * Card 1: `Receita Total (Paga)` (Ícone `TrendingUp`, cor verde).
  * Card 2: `Total de Pedidos` (Ícone `CheckCircle`, cor ciano).
* **Seção 2 (Esteira de Status Interativa)**:
  * Grid responsivo com 7 cards:
    1. **Todos**: Ícone `Layers` | Total de pedidos.
    2. **Aguardando PIX**: Ícone `Clock` | Cor `var(--warning)` (Amarelo).
    3. **Pago (Produção)**: Ícone `Cpu` / `Box` | Cor `var(--primary)` (Ciano).
    4. **Aguardando Retirada**: Ícone `MapPin` | Cor Roxo / Lilás.
    5. **Aguardando Envio**: Ícone `Package` | Cor Laranja / Âmbar.
    6. **Concluídos**: Ícone `CheckCheck` / `Truck` | Cor `var(--success)` (Verde).
    7. **Cancelados**: Ícone `XCircle` | Cor Vermelho Coral (`#ff4757`).

### 4.2 Estados e Interação
* **Seleção**: Clicar no card ativa a borda luminosa correspondente e filtra a lista exibida. Clicar novamente ou no card "Todos" restaura a listagem completa.
* **Empty State**: Caso o filtro selecionado resulte em 0 itens, a tabela apresenta:
  > *"Nenhum pedido com o status selecionado."* [Botão: Limpar Filtro]

### 4.3 Ajustes no Backend & Modal
* **Modal de Gestão**: Atualizar `<select>` com a opção `AGUARDANDO ENVIO`.
* **Cálculo de Receita**: Incluir `AGUARDANDO ENVIO` entre os status de pagamento confirmado.
