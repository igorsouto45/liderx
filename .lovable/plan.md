# Plano de Implementação: Gestão de Lideranças, Perfil de Acesso e Correções

Este plano visa corrigir o problema de salvamento de eleitores, implementar o sistema de lideranças (com cadastro e acesso restrito), e adicionar funcionalidades de captura (QR Code) e prioridades.

## 1. Banco de Dados e Segurança (Migração)
- **Perfis Automáticos**: Criar trigger para gerar automaticamente um registro na tabela `perfis` ao criar um usuário no Auth.
- **Sincronização Retroativa**: Garantir que todos os usuários atuais do Auth tenham um perfil correspondente.
- **Tabela `liderancas`**: Criar tabela para armazenar dados geográficos e cadastrais dos líderes (nome, telefone, CPF, CEP, endereço, zona/seção, etc.), vinculada ao perfil do usuário.
- **Tabela `prioridades`**: Criar tabela para registrar demandas e prioridades vinculadas às lideranças.
- **Geolocalização**: Adicionar campos de latitude e longitude em `eleitores` e `liderancas`.
- **Segurança (RLS)**:
  - Usuários com perfil `líder` só podem ver e cadastrar eleitores vinculados ao seu ID (`origem_usuario_id`).
  - Admin e Operador mantêm acesso total.

## 2. Correção e Melhoria no Cadastro de Eleitores
- **Bug de Salvamento**: Validar campos numéricos (Zona/Seção) para evitar erros de tipo e garantir que o `origem_usuario_id` seja válido.
- **Feedback Visual**: Melhorar mensagens de erro e sucesso no diálogo de cadastro.

## 3. Gestão de Lideranças (Frontend)
- **Cadastro de Líder**: Implementar formulário em `src/routes/_authenticated.liderancas.tsx` idêntico ao de eleitores.
- **Listagem**: Mostrar líderes cadastrados e sua localização (preparação para o mapa).

## 4. Perfil de Acesso Restrito (Liderança)
- **Navegação Inteligente**: No layout autenticado, ocultar abas administrativas (Dashboard, Configurações, etc.) para usuários com perfil `líder`.
- **Restrição de Conteúdo**: Garantir que o líder veja apenas sua base de eleitores e ferramentas de captura.

## 5. Captura e Prioridades
- **QR Code Dinâmico**: Em `src/routes/_authenticated.captura.tsx`, gerar o link e QR Code usando o ID do usuário logado como referência.
- **Página de Prioridades**: Implementar listagem e cadastro de prioridades em `src/routes/_authenticated.prioridades.tsx`.

## Detalhes Técnicos
- Utilização de Triggers PL/pgSQL para automação de perfis.
- Políticas RLS (Row Level Security) avançadas para isolamento de dados.
- Integração com `qrcode.react` para geração dinâmica de códigos.
