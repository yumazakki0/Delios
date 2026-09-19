# Délios — Vite + Firebase

Plataforma de acolhimento escolar com formulário confidencial, envio anônimo opcional e painel administrativo protegido.

## Tecnologias

- Vite + React + TypeScript;
- React Router;
- Firebase Authentication e Cloud Firestore;
- Firestore Security Rules;
- CSS responsivo;
- Vercel.

## Funcionalidades

- página inicial responsiva;
- formulário com nome, ano e turma opcionais;
- categorias de situação e descrição livre;
- confirmação clara de confidencialidade e limites do sigilo;
- login sem cadastro público;
- painel administrativo com busca, filtros e status;
- botão de saída rápida;
- banco protegido contra leitura anônima.

## Rodar no VS Code

```bash
npm install
cp .env.example .env
npm run dev
```

Antes de enviar relatos reais, configure o Firebase seguindo [SETUP_FIREBASE.md](SETUP_FIREBASE.md).

## Build

```bash
npm run build
```

O resultado fica em `dist/`.

## Segurança

- mantenha o cadastro de administradores fechado;
- nunca permita leitura pública da coleção `support_reports`;
- revise periodicamente quem possui a função `admin`;
- defina com a escola quem atende os relatos e por quanto tempo os dados serão guardados;
- não prometa segredo absoluto quando houver necessidade de proteção ou encaminhamento oficial.
