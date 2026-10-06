/**
 * Webhook do Kiwify para processar confirmações de pagamento
 * Quando um usuário compra, o Kiwify envia os dados aqui
 * e nós concedemos acesso automático baseado no email
 */

exports.handler = async (event) => {
  // Valida que é um POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { email, product, status } = JSON.parse(event.body);

    // Valida os dados essenciais
    if (!email || !product || !status) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    // Se o pagamento foi confirmado (status = 'approved' ou similar)
    if (status === 'approved' || status === 'confirmed' || status === 'paid') {
      console.log(`[Kiwify] Pagamento confirmado para ${email}`);

      // Aqui você pode:
      // 1. Registrar o pagamento no seu banco de dados
      // 2. Enviar email de confirmação
      // 3. Conceder acesso ao usuário via Netlify Identity

      // Exemplo: Busca o usuário no Netlify Identity e atribui o role "member"
      // (Isso seria feito via API do Netlify Identity, não está implementado aqui)

      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message: 'Pagamento processado com sucesso',
          email: email,
          product: product
        })
      };
    }

    // Se o pagamento foi recusado
    if (status === 'failed' || status === 'refused') {
      console.log(`[Kiwify] Pagamento recusado para ${email}`);
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: false,
          message: 'Pagamento recusado',
          email: email
        })
      };
    }

    // Status desconhecido, mas processado
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Webhook recebido',
        status: status
      })
    };

  } catch (err) {
    console.error('Erro ao processar webhook:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
