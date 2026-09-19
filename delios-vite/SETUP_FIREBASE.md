# Configurando o Firebase

## 1. Criar o projeto e o banco

1. Crie um projeto no Firebase Console usando uma conta institucional da escola.
2. Abra **Build → Firestore Database → Create database**.
3. Escolha o modo de produção e uma região próxima.
4. Abra a aba **Rules**, cole o conteúdo de `firestore.rules` e publique.

As regras permitem que qualquer visitante envie um relato validado, mas somente administradores autorizados podem ler e alterar o andamento.

## 2. Ativar o login administrativo

1. Abra **Build → Authentication → Get started**.
2. Em **Sign-in method**, ative **Email/Password**.
3. Em **Users**, crie a conta do administrador da escola.
4. Copie o **User UID** exibido para essa conta.

Não habilite cadastro de usuário no site.

## 3. Autorizar o administrador

1. No Firestore, crie a coleção `admins`.
2. Crie um documento cujo **Document ID** seja exatamente o UID copiado.
3. Adicione o campo `role`, tipo string, com o valor `admin`.

Para remover o acesso de alguém, desative a conta no Authentication e apague o documento correspondente em `admins`.

## 4. Conectar o Vite

Em **Project settings → General → Your apps**, adicione um aplicativo Web e copie o objeto `firebaseConfig`.

Copie `.env.example` para `.env` e preencha:

```env
VITE_FIREBASE_API_KEY=SUA_API_KEY
VITE_FIREBASE_AUTH_DOMAIN=SEU-PROJETO.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=SEU-PROJETO
VITE_FIREBASE_STORAGE_BUCKET=SEU-PROJETO.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=SEU_SENDER_ID
VITE_FIREBASE_APP_ID=SEU_APP_ID
```

Esses valores identificam o aplicativo Web. A segurança dos dados depende principalmente das regras do Firestore e das permissões administrativas, não de esconder esse objeto.

## 5. Testar

```bash
npm install
npm run dev
```

1. Envie um relato em `/ajuda`.
2. Confirme que o Firestore criou um documento em `support_reports`.
3. Entre em `/login` com a conta administrativa.
4. Confirme que o painel lista o relato e altera o status.
5. Saia do painel e confirme que `/admin` redireciona para o login.

## 6. Publicar na Vercel

Adicione todas as variáveis `VITE_FIREBASE_*` do `.env` em **Project Settings → Environment Variables** e faça um novo deploy.

## Responsabilidade pelos dados

A conta principal, a revisão dos acessos, os backups e o prazo de retenção dos relatos devem ficar sob responsabilidade de um adulto autorizado pela escola. Antes do uso real, a escola deve definir quem atende os relatos e quem pode consultar os dados.
