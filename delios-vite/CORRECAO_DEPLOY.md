# Correção do deploy e do painel administrativo

## O que estava acontecendo

Os avisos de pacotes obsoletos, scripts de instalação e tamanho do bundle não interromperam o deploy. A falha real era `TS2835`: as funções da Vercel foram compiladas como ESM/NodeNext e os imports relativos das APIs não tinham a extensão `.js`.

Quando uma função caía, a Vercel devolvia uma mensagem de texto. O frontend tentava interpretar essa mensagem como JSON e mostrava `Unexpected token 'A'`.

O painel também podia receber `permission-denied` ao atualizar tickets criados antes da V3, pois as regras exigiam campos que não existiam nos documentos antigos.

## Alterações feitas

- imports ESM das APIs corrigidos para o compilador da Vercel;
- Node.js 22 definido no `package.json`;
- leitura segura de respostas das APIs, inclusive quando a Vercel devolver texto;
- mensagens administrativas melhores para erros de permissão;
- regras compatíveis com tickets antigos sem liberar edição do conteúdo original.
- inicialização tardia do Firebase Admin para impedir `FUNCTION_INVOCATION_FAILED` antes da rota;
- normalização da chave privada com ou sem aspas externas e com `\\n` ou quebras reais;
- mensagens seguras que distinguem variável ausente de chave privada inválida.

## Erro `FUNCTION_INVOCATION_FAILED` na importação

Quando o log mostra `No outgoing requests`, a função caiu antes de consultar o Firebase. Confira em **Vercel → Project → Settings → Environment Variables** se estas três variáveis estão habilitadas para **Production**:

```text
FIREBASE_ADMIN_PROJECT_ID
FIREBASE_ADMIN_CLIENT_EMAIL
FIREBASE_ADMIN_PRIVATE_KEY
```

O valor da chave deve ser o campo `private_key` do JSON da conta de serviço. Não cole o JSON inteiro e não coloque `FIREBASE_ADMIN_PRIVATE_KEY=` dentro do valor. Depois de qualquer alteração de ENV, faça um novo deploy; deploys antigos não recebem as variáveis novas.

## Passos obrigatórios depois de enviar o código

1. No Firebase Console, abra **Firestore Database → Rules**.
2. Substitua as regras atuais pelo conteúdo de `firestore.rules`.
3. Clique em **Publish**.
4. Envie este código corrigido ao GitHub.
5. Faça um novo deploy na Vercel.
6. Confirme que as nove variáveis de ambiente continuam cadastradas.
7. Teste a alteração de status, prioridade e anotação em um ticket antigo e em um novo.

Publicar apenas o código não atualiza automaticamente as regras do Firestore. Essa etapa precisa ser feita no Firebase Console ou pela Firebase CLI.
