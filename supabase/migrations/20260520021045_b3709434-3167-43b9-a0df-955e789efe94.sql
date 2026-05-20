-- A tabela liderancas já existe, vamos garantir que ela tenha os campos necessários para o auto-cadastro
-- e vinculação com auth.users

-- Criar um bucket para documentos se não existir (o Supabase cria via API, mas aqui deixamos a política)
-- Políticas para o bucket 'documentos-liderancas'
-- SELECT: Público ou autenticado? O admin precisa ver. O líder precisa ver os seus.
-- Como é para contratação, o admin (tipo='admin') vê todos. O líder vê o seu (auth.uid() = auth_user_id).

-- Se a tabela de documentos_lideranca já existir, não fazemos nada.
-- Vou verificar se ela já tem os campos.

-- Na verdade, vou criar uma página de cadastro público para líderes similar à de eleitores.
-- Mas com campos extras de senha e arquivos.

-- O usuário pediu: "possibilita o Lider se cadastrar com os dados, cadastrar o email e senha de acesso e subir os arquivos para contrataçao"
