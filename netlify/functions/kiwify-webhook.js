/**
 * Webhook do Kiwify: recebe as notificacoes de pagamento.
 *
 * Registra no log o que chegou (com dados pessoais mascarados) e tenta
 * identificar e-mail, produto e status em mais de um formato de payload.
 * Ainda NAO libera acesso automaticamente: apenas registra.
 */

const APROVADO = ['paid', 'approved', 'confirmed', 'order_approved', 'subscription_renewed'];
const RECUSADO = [
  'refused', 'failed', 'order_rejected', 'refunded', 'order_refunded',
  'chargedback', 'chargeback', 'subscription_canceled', 'subscription_late'
];

const SENSIVEL = /cpf|cnpj|mobile|phone|telefone|celular|address|endereco|street|zipcode|cep|^ip$|card|token|signature/i;

// Copia o payload trocando valores sensiveis por "***"
function mascarar(v, chave) {
  if (v === null || v === undefined) return v;
  if (Array.isArray(v)) return v.map((x) => mascarar(x, chave));
  if (typeof v === 'object') {
    const o = {};
    for (const k of Object.keys(v)) o[k] = mascarar(v[k], k);
    return o;
  }
  if (chave && SENSIVEL.test(chave)) return '***';
  if (typeof v === 'string' && v.includes('@')) {
    const [u, d] = v.split('@');
    return u.slice(0, 2) + '***@' + d;
  }
  return v;
}

// Primeiro valor preenchido entre varios caminhos possiveis (ex.: "Customer.email")
function pegar(obj, caminhos) {
  for (const c of caminhos) {
    let v = obj;
    for (const parte of c.split('.')) {
      v = v && typeof v === 'object' ? v[parte] : undefined;
    }
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return undefined;
}

const responder = (statusCode, corpo) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(corpo)
});

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    console.log(`[Kiwify] Metodo ${event.httpMethod} ignorado (esperado POST)`);
    return responder(405, { error: 'Method not allowed' });
  }

  let dados;
  try {
    const bruto = event.isBase64Encoded
      ? Buffer.from(event.body || '', 'base64').toString('utf8')
      : event.body || '';
    dados = JSON.parse(bruto);
  } catch (err) {
    console.log('[Kiwify] Corpo nao e JSON valido. Content-Type:', event.headers && event.headers['content-type']);
    return responder(400, { error: 'Invalid JSON' });
  }

  // Alguns envios vem embrulhados em "order" ou "data"
  const p = (dados && (dados.order || dados.data)) || dados || {};

  console.log('[Kiwify] Recebido:', JSON.stringify(mascarar(dados)));

  const email = pegar(p, ['Customer.email', 'customer.email', 'email', 'buyer.email']);
  const produto = pegar(p, ['Product.product_name', 'product.name', 'product_name', 'product']);
  const status = String(
    pegar(p, ['order_status', 'webhook_event_type', 'status', 'event']) || ''
  ).toLowerCase();

  let resultado = 'desconhecido';
  if (APROVADO.includes(status)) resultado = 'aprovado';
  else if (RECUSADO.includes(status)) resultado = 'recusado';

  console.log(
    `[Kiwify] Resultado: ${resultado} | status="${status}" | email=${email ? mascarar(String(email)) : 'NAO ENCONTRADO'} | produto=${produto || 'NAO ENCONTRADO'}`
  );

  // Sempre 200 para payload valido, para o Kiwify nao ficar reenviando
  return responder(200, {
    received: true,
    resultado,
    email_encontrado: Boolean(email)
  });
};
