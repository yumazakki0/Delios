# Délios — Vite + Supabase

Plataforma de acolhimento escolar com formulário confidencial, envio anônimo opcional e painel administrativo protegido.

## Tecnologias

- Vite + React + TypeScript;
- React Router;
- Supabase Auth e PostgreSQL;
- Row Level Security;
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

Antes de enviar relatos reais, configure o Supabase seguindo [SETUP_SUPABASE.md](SETUP_SUPABASE.md).

## Build

```bash
npm run build
```

O resultado fica em `dist/`.

## Segurança

- nunca use a chave `service_role` no frontend;
- mantenha o cadastro de administradores fechado;
- revise periodicamente quem possui a função `admin`;
- defina com a escola quem atende os relatos e por quanto tempo os dados serão guardados;
- não prometa segredo absoluto quando houver necessidade de proteção ou encaminhamento oficial.
