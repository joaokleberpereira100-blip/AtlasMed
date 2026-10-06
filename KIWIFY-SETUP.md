# Integração Kiwify - AtlasMed

## Status Atual ✅

Você já criou os dois produtos e temos os links:
- **Mensal**: https://pay.kiwify.com.br/xlpDZiO
- **Anual**: https://pay.kiwify.com.br/4nzHrR3

## O que foi feito

1. ✅ Links de checkout integrados no site
2. ✅ Botões de compra agora redirecionam para Kiwify
3. ✅ Webhook criado para processar pagamentos (`netlify/functions/kiwify-webhook.js`)

## Próximos passos

### 1. Obter a URL do Webhook

A URL do seu webhook será:
```
https://seu-dominio.netlify.app/.netlify/functions/kiwify-webhook
```

Substitua `seu-dominio` pelo seu domínio real. Exemplo:
```
https://atlasmed.netlify.app/.netlify/functions/kiwify-webhook
```

### 2. Configurar Webhook no Kiwify

1. Acesse https://admin.kiwify.com.br/
2. Vá para **Configurações** → **Webhooks** (ou similar)
3. Adicione uma nova notificação/webhook
4. Cole a URL do webhook acima
5. Escolha os eventos:
   - ✅ Pagamento aprovado/confirmado
   - ✅ Pagamento recusado
6. Salve

### 3. Dados que o Kiwify enviará

O webhook espera receber JSON assim:
```json
{
  "email": "cliente@exemplo.com",
  "product": "mensal ou anual",
  "status": "approved|confirmed|paid|failed|refused"
}
```

### 4. Como funciona o fluxo

1. Cliente clica em "Ir para pagamento no Kiwify"
2. É redirecionado para a página de checkout do Kiwify
3. Cliente paga (qualquer método: Pix, cartão, boleto)
4. Kiwify confirma o pagamento
5. Kiwify envia notificação para nosso webhook
6. Webhook registra o pagamento (você pode adicionar lógica de banco de dados depois)
7. **Futuramente**: Webhook concede acesso automático (role "member") ao usuário

## Segurança

- O webhook está em `/netlify/functions/` (seguro)
- Você pode adicionar validação de assinatura do Kiwify depois (secret key)
- Por enquanto, apenas valida os campos obrigatórios

## Próxima Fase

Quando quiser automatizar o acesso:
1. Criar tabela de pagamentos no banco de dados (Supabase, etc)
2. Modificar o webhook para atribuir role "member" ao usuário automaticamente
3. Usar email do cliente para linkar com a conta no Netlify Identity

## Links importantes

- Seu site: [a ser publicado]
- Admin Kiwify: https://admin.kiwify.com.br/
- Suporte Kiwify: https://help.kiwify.com.br/
