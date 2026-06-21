## Escopo

Adicionar três novos módulos ao sistema existente, sem alterar funcionalidades atuais:

1. **Cadastro do Candidato** (singleton) — para dados fixos usados em contratos e recibos
2. **Gestão de Liderança** (visão do próprio líder) — eleitores captados, reuniões e fotos
3. **Recibos de Pagamento** — base preparada para receber o modelo depois
4. **PWA + Captura de fotos offline com GPS/data/hora**

---

## 1. Cadastro do Candidato (singleton)

**Nova rota:** `/candidato` (menu lateral, visível só para Admin)

**Tabela:** `public.candidato` (linha única, enforced por constraint)

Campos:
- Dados básicos: `nome_completo`, `nome_urna`, `cpf`, `rg`, `data_nascimento`, `nacionalidade`, `estado_civil`, `profissao`
- Dados eleitorais (sem número de urna): `cargo_pretendido`, `partido_sigla`, `coligacao`
- `updated_at`, `updated_by`

**Comportamento:**
- Só Admin edita
- A tela carrega o registro único (ou cria vazio na primeira vez)
- Emissão de Contrato passa a usar automaticamente esses dados como contratante fixo

---

## 2. Gestão de Liderança (painel do próprio líder)

**Nova rota:** `/minha-gestao` (visível para perfil `líder`; Admin enxerga com seletor de líder)

Três abas internas:

**a) Eleitores Captados**
- Lista os eleitores onde `origem_usuario_id = auth.uid()` (já existe via RLS)
- Reaproveita componentes da tela de eleitores em modo leitura/resumo
- Totais: hoje, semana, mês

**b) Reuniões**
- Nova tabela `reunioes_liderança`: `titulo`, `descricao`, `data_hora`, `local_nome`, `endereco`, `latitude`, `longitude`, `status` (agendada/realizada/cancelada), `lideranca_id`
- CRUD pelo próprio líder

**c) Fotos de Reunião**
- Nova tabela `fotos_reuniao`: `reuniao_id`, `lideranca_id`, `storage_path`, `latitude`, `longitude`, `capturada_em` (timestamp do dispositivo no momento da foto), `enviada_em`, `observacao`
- Novo bucket privado `fotos-reunioes`
- Galeria com mapa de pino por foto

---

## 3. PWA + Fotos offline com GPS

Seguindo a skill PWA do Lovable:
- Manifest + ícones + `vite-plugin-pwa` com `generateSW`, `registerType: autoUpdate`
- Wrapper de registro com guarda: nunca registra em preview/iframe/dev
- `NetworkFirst` para navegação HTML

**Captura no celular:**
- Componente "Tirar Foto da Reunião" usa `<input type="file" accept="image/*" capture="environment">` para abrir a câmera
- No momento do disparo: `navigator.geolocation.getCurrentPosition` + `Date.now()` são gravados junto com o blob
- Os dados (foto + lat/lng + timestamp + reuniao_id) ficam em **IndexedDB** (lib `idb`) numa fila `outbox_fotos`
- Service worker dispara **Background Sync** (`sync` tag `upload-fotos`); fallback: ao voltar online (`online` event) ou ao abrir o app, um worker em foreground processa a fila e faz upload para o Storage + insere linha em `fotos_reuniao`
- Indicador na UI mostra "X fotos aguardando envio"

> Importante: o app só funciona offline depois de publicado e instalado (PWA não roda offline no preview do editor).

---

## 4. Recibos de Pagamento (base)

**Nova rota:** `/recibos` (Admin)

**Tabela:** `public.recibos`
- `numero` (sequencial), `pagador_nome`, `pagador_cpf`, `valor`, `descricao`, `data_emissao`, `forma_pagamento`, `lideranca_id` (opcional), `pdf_path`

**Tela:**
- Lista + criar recibo + download PDF
- Geração de PDF reaproveitando o mesmo gerador da Emissão de Contrato, usando os dados do **Candidato** como emissor
- Modelo visual fica como placeholder até o usuário enviar o modelo oficial — só então o layout final é aplicado

---

## Migrações (uma única, com GRANTs e RLS)

- `candidato` (singleton): só admin lê/escreve
- `reunioes_lideranca`: líder vê/edita as próprias; admin vê todas
- `fotos_reuniao`: líder insere/lê as próprias; admin lê todas
- `recibos`: só admin
- Bucket `fotos-reunioes` (privado) + políticas no `storage.objects` por pasta `{lideranca_id}/...`

---

## Detalhes técnicos

- Stack: TanStack Start + Supabase (Lovable Cloud)
- Libs novas: `idb` (IndexedDB), `vite-plugin-pwa`, `workbox-window`
- Service worker próprio para Background Sync de upload (registrado pelo wrapper guardado, sem rodar em preview)
- Geração de PDF: continua na rota existente de contrato; recibos usam o mesmo utilitário
- Menu lateral: novos itens "Candidato" (admin), "Minha Gestão" (líder/admin), "Recibos" (admin)
- Nenhuma alteração nas rotas/lógicas existentes (Eleitores, Mapa RJ, Situação Eleitoral etc.)

---

## Fora de escopo (até você confirmar)

- Layout final do recibo — aguardando seu modelo
- Layout final do contrato com novos dados do candidato — aguardando modelo (se for diferente do atual)
- Notificações push para o líder
