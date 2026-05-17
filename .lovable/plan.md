## Objetivo
Tornar o cadastro de eleitor completo, com lookup de endereço via ViaCEP e atribuição automática de zona, seção e local de votação a partir da planilha do RJ.

## Mudanças no banco

1. **Nova tabela `locais_votacao`** com os campos relevantes:
   - `uf`, `municipio`, `zona`, `secao`, `local_numero`, `local_nome`, `endereco`, `bairro`, `cep`, `latitude`, `longitude`
   - Índices em `cep` e (`bairro`, `municipio`) para busca rápida
   - RLS: leitura pública para usuários autenticados
   - Importação dos ~38k registros ativos da planilha enviada (via COPY)

2. **Tabela `eleitores`** — novos campos:
   - `data_nascimento` (date, obrigatório no formulário)
   - `cpf` (text, opcional)
   - `cep`, `endereco`, `numero`, `complemento`, `cidade`, `uf`
   - `zona_votacao`, `secao_votacao`, `local_votacao_nome`

## Mudanças na UI (Cadastrar Eleitor)

Formulário ampliado em diálogo com:
- Nome (obrigatório)
- WhatsApp (obrigatório, máscara)
- Data de Nascimento (obrigatório)
- CPF (opcional)
- CEP — onBlur dispara `https://viacep.com.br/ws/{cep}/json/` e preenche endereço, bairro, cidade, UF
- Após CEP preenchido, consulta `locais_votacao` filtrando por CEP exato (fallback: bairro + município) e seleciona o local mais frequente, preenchendo zona, seção e nome do local automaticamente
- Status (apoiador/indeciso/rejeição)

## Detalhes técnicos

- Importação: filtrar `DS_SITU_LOCAL_VOTACAO = 'ATIVO'`, exportar CSV e usar `\copy` via psql.
- Lookup de zona/seção: query `select zona, secao, local_nome from locais_votacao where cep = $1 limit 1`. Quando CEP não bate, usar `ilike` em bairro + município.
- Validação com Zod no cliente (CPF opcional, telefone com 10–11 dígitos).