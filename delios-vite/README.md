# Délios — Vite + Firebase

Plataforma de acolhimento escolar com contas individuais, identidade protegida e painel administrativo com acesso por função.

## Tecnologias

- Vite + React + TypeScript;
- React Router;
- Firebase Authentication e Cloud Firestore;
- Firestore Security Rules;
- CSS responsivo;
- Vercel.

## Funcionalidades

- página inicial responsiva;
- conta estudantil ativada por código individual;
- identidade separada do conteúdo do relato;
- categorias de situação e descrição livre;
- confirmação clara de confidencialidade e limites do sigilo;
- login sem cadastro público;
- painel administrativo com busca, filtros e status;
- fila de tickets com prioridade, leitura detalhada e conclusão rápida;
- triagem auxiliar de padrões suspeitos, sempre sujeita à revisão humana;
- classificação manual e anotações internas protegidas;
- botão de saída rápida;
- limite de um novo envio a cada 45 segundos por conta;
- identificação excepcional somente pela direção, com justificativa registrada;
- banco protegido contra leitura anônima.

## Rodar no VS Code

```bash
npm install
cp .env.example .env.local
npm run dev:full
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
- revise periodicamente quem possui as funções `director` e `staff`;
- nunca coloque `FIREBASE_ADMIN_PRIVATE_KEY` no frontend ou no GitHub;
- use somente dados fictícios durante o desenvolvimento;
- defina com a escola quem atende os relatos e por quanto tempo os dados serão guardados;
- não prometa segredo absoluto quando houver necessidade de proteção ou encaminhamento oficial.
