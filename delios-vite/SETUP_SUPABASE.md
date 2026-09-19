# Configurando o Supabase

## 1. Criar o projeto

1. Crie um projeto em `supabase.com`.
2. Abra **SQL Editor**.
3. Cole e execute o conteúdo de `supabase/schema.sql`.

O SQL cria as tabelas, ativa Row Level Security e impede leitura pública dos relatos.

## 2. Conectar o site

Em **Project Settings → API**, copie:

- Project URL;
- chave pública `anon` ou `publishable`.

Crie um arquivo `.env` na raiz:

```env
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_CHAVE_PUBLICA
```

Nunca coloque a chave `service_role` no Vite, no GitHub ou na Vercel. O navegador deve receber somente a chave pública.

## 3. Criar administrador

1. Abra **Authentication → Users**.
2. Crie o usuário com e-mail e senha.
3. Copie o UUID do usuário.
4. Execute no SQL Editor:

```sql
insert into public.profiles (id, role)
values ('COLE_O_UUID_AQUI', 'admin')
on conflict (id) do update set role = 'admin';
```

Não existe cadastro de administradores pelo site. Isso evita que visitantes criem contas privilegiadas.

## 4. Testar antes de publicar

1. Envie um relato anônimo em `/ajuda`.
2. Confirme que o relato não pode ser consultado sem login.
3. Entre em `/login` com o administrador.
4. Confirme que o painel lista o relato e permite alterar apenas o andamento.

## 5. Publicar na Vercel

1. Envie o projeto para um repositório GitHub.
2. Importe o repositório na Vercel.
3. Adicione `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` em **Environment Variables**.
4. Use `npm run build` e o diretório de saída `dist`.

O arquivo `vercel.json` já contém a reescrita necessária para as rotas `/ajuda`, `/login` e `/admin` funcionarem ao atualizar a página.
