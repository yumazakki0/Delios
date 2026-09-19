# Atualização V3 — contas e proteção de identidade

## O que mudou

- conta individual com usuário simples definido pela escola;
- primeiro acesso com código aleatório de uso único;
- importação de estudantes restrita à direção;
- relato salvo sem nome, turma ou usuário no documento do ticket;
- vínculo de identidade mantido em coleção separada e inacessível pelo navegador;
- triagem automática limitada a sinais de formatação e repetição;
- conteúdo sinalizado oculto até um profissional escolher revisar;
- limite de 45 segundos entre envios da mesma conta;
- identificação excepcional somente para `director` após classificação manual;
- justificativa, responsável e horário gravados em `identity_access_logs`;
- regras do Firestore fechadas para as coleções internas.

## Decisões de privacidade

CPF e data de nascimento não são usados. Eles aumentariam o impacto de um vazamento e não são necessários para o objetivo do sistema. O formulário informa claramente que é confidencial, mas não totalmente anônimo.

O bot não decide se um relato é verdadeiro, não pune ninguém e não identifica autores. Ele apenas recomenda uma leitura adicional e desfoca o conteúdo até a revisão humana.

## Antes do deploy

Siga `SETUP_FIREBASE.md`, publique `firestore.rules`, configure as variáveis privadas do Firebase Admin diretamente na Vercel e execute `npm run build`.
