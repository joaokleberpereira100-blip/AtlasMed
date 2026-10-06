# Integração Kiwify - AtlasMed

## Como funciona

1. O aluno cria a conta no site e escolhe um plano; o botão leva ao checkout do Kiwify
   (mensal: https://pay.kiwify.com.br/xlpDZiO, anual: https://pay.kiwify.com.br/4nzHrR3).
2. O Kiwify avisa o webhook `/.netlify/functions/kiwify-webhook` a cada evento.
3. O webhook atualiza o papel `member` no Netlify Identity pelo **e-mail do comprador**:
   - compra aprovada / assinatura renovada: libera o acesso (cria a conta e envia
     e-mail de definição de senha se ela ainda não existir);
   - reembolso, chargeback, assinatura cancelada ou atrasada: retira o acesso.
4. O arquivo `_redirects` só abre `/app/` para quem tem o papel `member`.

O cadastro sozinho não dá acesso. Contas de acesso vitalício ficam na lista
`VITALICIO`, repetida em `kiwify-webhook.js` e `identity-signup.js`.

## Configuração no Kiwify

Webhook apontando para
`https://atlasmedparaestudantes.netlify.app/.netlify/functions/kiwify-webhook`,
com os eventos: compra aprovada, compra reembolsada, chargeback, assinatura
renovada, assinatura cancelada e assinatura atrasada.

## Segurança (obrigatório antes de divulgar)

No Netlify, em Project configuration → Environment variables, crie
`KIWIFY_WEBHOOK_TOKEN` com o token exibido na tela do webhook no Kiwify e faça
um novo deploy. Sem ela, o webhook aceita chamadas de qualquer origem.

## Conferindo

Netlify → Functions → kiwify-webhook → Function log. Cada chamada termina com
uma linha `[Kiwify] Resultado: ... | acesso: ...`.
