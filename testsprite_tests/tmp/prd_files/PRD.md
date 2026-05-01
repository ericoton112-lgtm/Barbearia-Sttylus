# PRD - STTYLUS

## 1. Resumo

STTYLUS e uma aplicacao web para barbearias que conecta clientes e profissionais em um fluxo simples de agendamento. O produto permite que clientes criem conta, visualizem servicos e barbeiros disponiveis, escolham data e horario e confirmem um agendamento. Para profissionais, oferece um painel operacional com agenda do dia, status de atendimento, notificacoes em tempo real e gerenciamento de servicos.

O foco do MVP e reduzir friccao no agendamento e dar ao barbeiro uma visao clara da fila diaria.

## 2. Objetivos

- Permitir que clientes agendem servicos de barbearia pelo celular com poucos passos.
- Permitir que profissionais gerenciem seus servicos, disponibilidade e agenda.
- Evitar conflitos basicos de horario mostrando horarios ja ocupados.
- Notificar o profissional quando um novo agendamento for criado.
- Separar experiencia de cliente e profissional por perfil de usuario.

## 3. Nao Objetivos do MVP

- Pagamento online.
- Reagendamento automatizado pelo cliente.
- Marketplace com multiplas barbearias independentes.
- Controle financeiro completo.
- Integracao com WhatsApp, Google Calendar ou sistemas externos.
- Controle avancado de expediente, feriados e intervalos por profissional.

## 4. Publico-Alvo

### Cliente

Pessoa que deseja encontrar rapidamente um profissional, escolher um servico, selecionar data e horario e confirmar um agendamento sem precisar ligar ou mandar mensagem.

### Profissional / Barbeiro

Barbeiro que precisa acompanhar agendamentos do dia, ver dados do cliente, alterar status de atendimento, ativar/desativar disponibilidade e cadastrar servicos oferecidos.

### Administrador futuro

Pessoa responsavel pela operacao da barbearia, com necessidade futura de gerenciar profissionais, servicos globais, relatorios e configuracoes.

## 5. Problema

Barbearias pequenas frequentemente dependem de mensagens manuais para marcar horarios. Isso gera demora na resposta, duplicidade de horarios, perda de informacao e baixa visibilidade sobre a agenda do dia.

O STTYLUS resolve esse problema criando um canal unico de agendamento e uma area profissional para acompanhar a operacao em tempo quase real.

## 6. Proposta de Valor

- Para clientes: agendar um servico em poucos passos, com visual moderno e direto.
- Para barbeiros: controlar a agenda diaria, receber notificacoes de novos agendamentos e gerenciar servicos sem depender do painel do banco.
- Para a barbearia: reduzir atendimento manual e melhorar organizacao da fila.

## 7. Escopo Atual

### Autenticacao

- Login por email e senha.
- Cadastro com nome completo, telefone e senha.
- Codigo de convite para criar conta profissional: `STTYLUS-PRO`.
- Login social com Google via Supabase OAuth.
- Redirecionamento por tipo de perfil:
  - `client` para `/client-home`.
  - `barber` para `/professional-dashboard`.

### Area do Cliente

- Home do cliente com saudacao, avatar, lista de servicos e lista de profissionais.
- Indicacao visual quando todos os barbeiros estao indisponiveis.
- Navegacao inferior com Inicio, Agendar e Perfil.
- Perfil do cliente com edicao de nome, telefone e avatar.

### Agendamento

- Fluxo por etapas:
  1. Escolher profissional.
  2. Escolher servico.
  3. Escolher data e horario.
  4. Ver confirmacao de sucesso.
- Pre-selecao de servico quando o cliente vem da home por `serviceId`.
- Exibicao dos proximos 7 dias.
- Horarios fixos: `09:00`, `10:00`, `11:00`, `13:00`, `14:00`, `15:00`, `16:00`, `17:00`.
- Consulta de horarios ocupados por profissional e data.
- Bloqueio de horarios ja agendados e nao cancelados.
- Prevencao basica de agendamento duplicado para o mesmo cliente, barbeiro e data/hora.
- Criacao de notificacao para o barbeiro apos confirmar agendamento.

### Area Profissional

- Dashboard com:
  - Ganhos estimados do dia.
  - Total de agendamentos do dia.
  - Proximo cliente.
  - Visao diaria resumida.
  - Botao de check-in para marcar atendimento como concluido.
- Alternancia de disponibilidade (`is_accepting_appointments`).
- Notificacoes em tempo real via Supabase Realtime.
- Som ao receber novo agendamento.
- Marcacao de notificacoes como lidas ao abrir o painel.

### Agenda Profissional

- Visualizacao por data, com intervalo de dias de 3 dias antes ate 14 dias depois.
- Lista de agendamentos do barbeiro logado.
- Exibicao de cliente, telefone, servico, horario, duracao e status.
- Alteracao de status:
  - concluido
  - cancelado
  - pendente

### Servicos Profissionais

- Listagem de servicos vinculados ao barbeiro.
- Criacao de servico com nome, descricao, preco e duracao.
- Edicao de servico existente.
- Exclusao de servico.
- Associacao do servico ao `barber_id` do usuario autenticado.

## 8. Requisitos Funcionais

### RF01 - Cadastro de usuario

O sistema deve permitir cadastro com nome completo, telefone, email e senha.

Critérios de aceite:
- Sem codigo de convite, o usuario deve ser criado como cliente.
- Com codigo `STTYLUS-PRO`, o usuario deve ser criado como barbeiro.
- O perfil deve ser salvo em `profiles` com `role`, `phone` e `full_name`.

### RF02 - Login e roteamento por perfil

O sistema deve autenticar o usuario e direcionar para a area correta.

Critérios de aceite:
- Barbeiros acessam o painel profissional.
- Clientes acessam a home do cliente.
- Credenciais invalidas exibem erro amigavel.

### RF03 - Visualizacao de servicos

Clientes devem visualizar servicos disponiveis com nome, preco e duracao.

Critérios de aceite:
- Se nao houver servicos, exibir estado vazio.
- Clicar em um servico deve iniciar agendamento com o servico pre-selecionado.

### RF04 - Agendamento de servico

Clientes devem conseguir criar um agendamento selecionando barbeiro, servico, data e horario.

Critérios de aceite:
- Apenas barbeiros com `is_accepting_appointments = true` devem aparecer no fluxo.
- Horarios ocupados devem aparecer desabilitados.
- O agendamento deve salvar `client_id`, `barber_id`, `service_id`, `appointment_date` e `status`.
- Apos confirmar, o cliente deve ver tela de sucesso.

### RF05 - Notificacao de novo agendamento

Ao criar um agendamento, o sistema deve criar uma notificacao para o barbeiro.

Critérios de aceite:
- A notificacao deve conter titulo, mensagem, usuario destinatario e tipo.
- O barbeiro deve receber a notificacao em tempo real quando estiver no dashboard.
- Notificacoes abertas devem ser marcadas como lidas.

### RF06 - Agenda do barbeiro

Barbeiros devem visualizar agendamentos filtrados por data.

Critérios de aceite:
- A agenda deve listar apenas agendamentos do barbeiro autenticado.
- Deve exibir telefone do cliente quando disponivel.
- Deve permitir alterar status para concluido, cancelado ou pendente.

### RF07 - Gerenciamento de servicos

Barbeiros devem poder cadastrar, editar e excluir seus servicos.

Critérios de aceite:
- Servicos criados devem receber `barber_id` do usuario logado.
- Barbeiros nao devem editar ou excluir servicos de outro barbeiro.
- Campos obrigatorios: nome, preco e duracao.

### RF08 - Disponibilidade do barbeiro

Barbeiros devem poder ligar/desligar a disponibilidade para novos agendamentos.

Critérios de aceite:
- Quando indisponivel, o barbeiro nao aparece como opcao no fluxo de agendamento.
- Se todos estiverem indisponiveis, cliente ve aviso de barbearia fechada.

### RF09 - Perfil e avatar

Usuarios devem poder editar nome, telefone e foto de perfil.

Critérios de aceite:
- Alteracoes devem persistir em `profiles`.
- Avatar deve ser enviado para o bucket `avatars`.
- A URL publica do avatar deve ser salva em `profiles.avatar_url`.

## 9. Requisitos Nao Funcionais

- Interface mobile-first.
- Feedback visual para carregamento, erro e sucesso.
- Dados protegidos com Supabase RLS.
- Tempo de resposta percebido inferior a 2 segundos para navegacao comum em rede estavel.
- Experiencia consistente em navegadores modernos.
- Componentes acessiveis o suficiente para navegacao por botao e leitura de labels basicos.

## 10. Modelo de Dados

### profiles

Representa clientes e barbeiros.

Campos principais:
- `id`: UUID vinculado a `auth.users`.
- `full_name`: nome completo.
- `phone`: telefone/WhatsApp.
- `role`: `client`, `barber` ou `admin`.
- `avatar_url`: URL publica do avatar.
- `is_accepting_appointments`: disponibilidade do barbeiro.
- `created_at`: data de criacao.

### services

Representa servicos oferecidos.

Campos principais:
- `id`: UUID.
- `name`: nome do servico.
- `description`: descricao opcional.
- `price`: preco.
- `duration_minutes`: duracao.
- `barber_id`: profissional responsavel.
- `created_at`: data de criacao.

### appointments

Representa agendamentos.

Campos principais:
- `id`: UUID.
- `client_id`: cliente.
- `barber_id`: barbeiro.
- `service_id`: servico.
- `appointment_date`: data e hora.
- `status`: `pendente`, `confirmado`, `cancelado` ou `concluido`.
- `created_at`: data de criacao.

### notifications

Representa notificacoes para usuarios.

Campos principais:
- `id`: UUID.
- `user_id`: destinatario.
- `title`: titulo.
- `message`: mensagem.
- `type`: tipo, por exemplo `appointment`.
- `is_read`: controle de leitura.
- `created_at`: data de criacao.

## 11. Politicas de Seguranca

- Perfis podem ser lidos publicamente para permitir listagem de profissionais.
- Usuarios podem inserir e atualizar o proprio perfil.
- Clientes podem criar agendamentos para si mesmos.
- Clientes e barbeiros podem visualizar/atualizar agendamentos em que participam.
- Servicos podem ser lidos por todos.
- Barbeiros so podem criar, editar e excluir servicos associados ao proprio `barber_id`.
- Usuarios so podem visualizar e atualizar suas proprias notificacoes.

## 12. Fluxos Principais

### Fluxo de cliente: criar agendamento

1. Cliente faz login.
2. Sistema redireciona para `/client-home`.
3. Cliente escolhe um servico ou acessa `/client-home/agendar`.
4. Cliente escolhe barbeiro disponivel.
5. Cliente escolhe servico, data e horario.
6. Sistema valida duplicidade e horarios ocupados.
7. Sistema cria agendamento com status `confirmado`.
8. Sistema cria notificacao para o barbeiro.
9. Cliente ve confirmacao.

### Fluxo profissional: acompanhar dia

1. Barbeiro faz login.
2. Sistema redireciona para `/professional-dashboard`.
3. Dashboard carrega agenda do dia, ganhos estimados e proximo cliente.
4. Novas notificacoes entram em tempo real.
5. Barbeiro pode abrir notificacoes, fazer check-in ou navegar para agenda.

### Fluxo profissional: gerenciar servicos

1. Barbeiro acessa `/professional-dashboard/servicos`.
2. Sistema lista seus servicos.
3. Barbeiro abre modal de novo servico.
4. Preenche nome, descricao, preco e duracao.
5. Sistema salva o servico com `barber_id`.
6. Lista e atualizada.

## 13. Metricas de Sucesso

- Percentual de agendamentos concluidos sem contato manual.
- Tempo medio para cliente concluir um agendamento.
- Numero de agendamentos criados por semana.
- Taxa de barbeiros com disponibilidade ativa.
- Numero de conflitos/duplicidades reportados.
- Retencao de clientes que realizam segundo agendamento.

## 14. Riscos e Pontos de Atencao

- O schema base e os scripts incrementais precisam estar alinhados. Algumas colunas usadas pelo app (`role`, `avatar_url`, `barber_id`, `is_accepting_appointments`, `type`) estao em scripts separados.
- Horarios sao fixos no frontend, sem configuracao por barbeiro.
- Nao ha duracao real bloqueando multiplos slots; o sistema bloqueia apenas o horario exato.
- Politica de inserir notificacoes esta permissiva no MVP.
- Textos acentuados aparecem com encoding inconsistente em alguns arquivos.
- Login por Google cria usuario como cliente por padrao.

## 15. Roadmap Sugerido

### Fase 1 - Estabilizacao do MVP

- Consolidar todos os scripts Supabase em um schema unico atualizado.
- Corrigir encoding dos arquivos para UTF-8.
- Ajustar lint e regras React para builds limpos.
- Garantir protecao de rotas por perfil.
- Melhorar mensagens de erro Supabase no frontend.

### Fase 2 - Agenda Profissional

- Configurar horarios por barbeiro.
- Bloquear horarios considerando a duracao do servico.
- Permitir reagendamento e cancelamento pelo cliente.
- Adicionar historico de agendamentos do cliente.

### Fase 3 - Operacao da Barbearia

- Painel administrativo.
- Cadastro e convite de profissionais.
- Relatorios de faturamento por periodo.
- Ranking de servicos mais vendidos.
- Exportacao da agenda.

### Fase 4 - Crescimento

- Confirmacao via WhatsApp.
- Lembretes automaticos.
- Pagamento online ou sinal.
- Avaliacoes de profissionais.
- Programa de fidelidade.

## 16. Stack Tecnica

- Next.js App Router.
- React.
- TypeScript.
- Tailwind CSS.
- Supabase Auth.
- Supabase Database/Postgres.
- Supabase Storage para avatares.
- Supabase Realtime para notificacoes.
- Lucide React para icones.
- Motion para animacoes.

## 17. Definicao de Pronto do MVP

O MVP e considerado pronto quando:

- Cliente consegue criar conta, entrar, escolher servico, barbeiro, data e horario e confirmar agendamento.
- Barbeiro consegue entrar, ver agenda do dia, receber notificacao e atualizar status de agendamento.
- Barbeiro consegue cadastrar, editar e excluir servicos proprios.
- Disponibilidade do barbeiro afeta a experiencia do cliente.
- Banco possui schema e politicas consistentes com o frontend.
- Build de producao passa sem erros.
