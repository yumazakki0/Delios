# Configuração do Firebase e da Vercel — V3

Esta versão usa o Firebase Authentication e o Firestore no navegador, além de funções protegidas em `api/` executadas pela Vercel. A lista real de estudantes deve ser configurada somente por um adulto autorizado pela escola.

## 1. Firestore e regras

1. No Firebase Console, abra **Build → Firestore Database → Create database**.
2. Escolha o modo de produção e uma região próxima.
3. Abra **Rules**, substitua tudo pelo conteúdo de `firestore.rules` e publique.

As regras fazem o seguinte:

- nenhum visitante envia diretamente ao Firestore;
- estudantes leem apenas o próprio cadastro básico;
- administradores autorizados leem os tickets;
- dados de identificação, convites, auditoria e limites ficam exclusivos do backend;
- administradores só alteram campos de andamento e não conseguem editar o relato original.

## 2. Ativar o Firebase Authentication

1. Abra **Build → Authentication → Get started**.
2. Em **Sign-in method**, ative **Email/Password**.
3. Em **Users**, crie manualmente as contas dos profissionais da escola.
4. Copie o **User UID** de cada profissional.

Não habilite cadastro público. As contas estudantis são criadas apenas após a ativação por código.

## 3. Definir os perfis administrativos

No Firestore, crie a coleção `admins`. O ID de cada documento deve ser exatamente o UID do usuário correspondente.

Conta de direção, autorizada a importar alunos e revelar uma identidade com auditoria:

```text
admins/UID_DA_DIRECAO
role: "q"
```

Conta da equipe comum, autorizada a atender tickets sem revelar identidades:

```text
admins/UID_DO_PROFISSIONAL
role: "staff"
```

Para revogar um acesso, desative a conta no Authentication e remova o documento de `admins`.

## 4. Variáveis públicas do aplicativo Web

Em **Project settings → General → Your apps**, adicione um aplicativo Web e copie o `firebaseConfig`.

Copie `.env.example` para `.env.local` e preencha as variáveis `VITE_FIREBASE_*`. Essas chaves identificam o aplicativo Web; as regras do Firestore e as autorizações do backend protegem os dados.

## 5. Credencial privada do backend

No Firebase Console, abra **Project settings → Service accounts → Generate new private key**. Um adulto responsável deve guardar o arquivo baixado e copiar somente estes três valores para `.env.local`:

```env
FIREBASE_ADMIN_PROJECT_ID=seu-project-id
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@seu-project-id.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

Regras importantes:

- nunca use o prefixo `VITE_` nessas três variáveis;
- nunca envie a chave privada por chat ou coloque o arquivo JSON no GitHub;
- mantenha os `\n` na chave ao cadastrá-la na Vercel;
- se uma chave privada vazar, revogue-a no Google Cloud e gere outra.

## 6. Rodar localmente

Instale e abra o ambiente completo:

```bash
npm install
npx vercel login
npm run dev:full
```

Use `npm run dev:full` porque esta V3 depende das funções em `api/`. O comando `npm run dev` abre somente o frontend Vite.

## 7. Importar contas estudantis

1. Entre com uma conta cujo `role` seja `director`.
2. Abra **Painel → Alunos**.
3. Baixe o modelo fictício.
4. Prepare um CSV com as colunas:

```text
username,full_name,school_year,class_group
```

5. Importe e baixe os códigos gerados.
6. Entregue cada código apenas ao estudante correto.

O código aparece uma única vez, fica salvo somente como hash e deixa de funcionar após a ativação. Não importe CPF, data de nascimento, endereço ou contatos familiares. Durante o desenvolvimento, use somente nomes fictícios.

## 8. Publicar na Vercel

Cadastre no projeto da Vercel todas as variáveis de `.env.example` em **Settings → Environment Variables**:

- `VITE_FIREBASE_*` para o aplicativo Web;
- `FIREBASE_ADMIN_*` somente para as funções do backend.

Depois faça um novo deploy. Não inclua `.env.local` no ZIP ou no repositório.

## 9. Teste de aceitação

1. A direção importa um usuário fictício e baixa o código.
2. O estudante ativa a conta em `/aluno` e cria uma senha.
3. O estudante envia um relato em `/ajuda`.
4. Um segundo envio imediato recebe o aviso de espera.
5. O profissional abre o ticket e confirma que não aparece nome, turma ou usuário.
6. Um texto sinalizado aparece oculto até o profissional clicar para revisar.
7. O profissional classifica o ticket como conteúdo inadequado.
8. Uma conta `staff` não consegue revelar a identidade.
9. Uma conta `director` informa uma justificativa de pelo menos 20 caracteres e consegue revelar.
10. O Firestore registra o acesso em `identity_access_logs`.

## Responsabilidade institucional

A escola deve definir por escrito quem pode criar contas, atender relatos, autorizar identificação, auditar acessos e excluir dados. Esta aplicação não substitui a política de proteção de dados nem a avaliação de um profissional responsável.
