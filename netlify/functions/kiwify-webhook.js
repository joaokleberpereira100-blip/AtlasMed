/**
 * Webhook do Kiwify: libera o acesso ao app quando o pagamento e confirmado
 * (Pix, cartao ou boleto).
 *
 * Pagamento aprovado + e-mail do comprador:
 *   - ja existe conta com esse e-mail  -> recebe o papel "member"
 *   - ainda nao existe conta           -> a conta e criada ja com "member" e o
 *     comprador recebe um e-mail com link para definir a propria senha
 *
 * Usa a API de administracao do Netlify Identity, cujo token o proprio Netlify
 * entrega a funcao (context.clientContext.identity). Nao precisa de variavel
 * de ambiente para isso.
 *
 * Opcional, recomendado: defina KIWIFY_WEBHOOK_TOKEN (o token do webhook no
 * painel do Kiwify) para a funcao recusar chamadas que nao venham do Kiwify.
 */

const crypto = require('crypto');

const PAPEL = 'member';

// Pagamento confirmado
const APROVADO = ['paid', 'approved', 'order_approved', 'subscription_renewed'];

// Eventos que NAO devem liberar acesso, mesmo que o pedido original conste como pago
const NEGATIVO = [
  'refused', 'refunded', 'chargedback', 'chargeback', 'canceled', 'cancelled',
  'order_rejected', 'order_refunded', 'subscription_canceled', 'subscription_late'
];

const SENSIVEL = /cpf|cnpj|mobile|phone|telefone|celular|address|endereco|street|zipcode|cep|^ip$|card|token|signature|pix_code|boleto/i;

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

function iguais(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

// Confere a assinatura que o Kiwify manda em ?signature= (HMAC-SHA1 do corpo)
function assinaturaValida(segredo, assinatura, bruto, dados) {
  if (!assinatura) return false;
  const h = (txt) => crypto.createHmac('sha1', segredo).update(txt).digest('hex');
  return iguais(h(bruto), assinatura) || iguais(h(JSON.stringify(dados)), assinatura);
}

async function api(identity, caminho, opcoes = {}) {
  const res = await fetch(identity.url + caminho, {
    method: opcoes.method || 'GET',
    headers: {
      Authorization: 'Bearer ' + identity.token,
      'Content-Type': 'application/json'
    },
    body: opcoes.json ? JSON.stringify(opcoes.json) : undefined
  });
  const texto = await res.text();
  let json = null;
  try { json = texto ? JSON.parse(texto) : null; } catch (e) { /* resposta nao-JSON */ }
  if (!res.ok) {
    const erro = new Error(`Identity ${opcoes.method || 'GET'} ${caminho.split('?')[0]} -> ${res.status} ${texto.slice(0, 200)}`);
    erro.status = res.status;
    throw erro;
  }
  return json;
}

async function buscarUsuario(identity, email) {
  const r = await api(identity, '/admin/users?per_page=100&filter=' + encodeURIComponent(email));
  const lista = (r && r.users) || [];
  return lista.find((u) => String(u.email || '').toLowerCase() === email) || null;
}

// Garante que o e-mail tenha conta com o papel "member". Seguro repetir.
async function liberarAcesso(identity, email, nome) {
  const existente = await buscarUsuario(identity, email);

  if (existente) {
    const meta = existente.app_metadata || {};
    const papeis = Array.isArray(meta.roles) ? meta.roles : [];
    if (papeis.includes(PAPEL)) return 'ja_tinha_acesso';
    await api(identity, '/admin/users/' + existente.id, {
      method: 'PUT',
      json: { app_metadata: { ...meta, roles: [...papeis, PAPEL] } }
    });
    return 'acesso_liberado_conta_existente';
  }

  // Sem conta: cria com senha aleatoria (que ninguem fica sabendo) e manda
  // o e-mail de definicao de senha para o comprador.
  await api(identity, '/admin/users', {
    method: 'POST',
    json: {
      email,
      password: crypto.randomBytes(24).toString('base64url'),
      confirm: true,
      app_metadata: { roles: [PAPEL] },
      user_metadata: { full_name: nome || '', origem: 'kiwify' }
    }
  });

  try {
    await api(identity, '/recover', { method: 'POST', json: { email } });
    return 'conta_criada_email_de_senha_enviado';
  } catch (err) {
    console.log('[Kiwify] Conta criada, mas o e-mail de senha falhou:', err.message);
    return 'conta_criada_email_de_senha_FALHOU';
  }
}

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    console.log(`[Kiwify] Metodo ${event.httpMethod} ignorado (esperado POST)`);
    return responder(405, { error: 'Method not allowed' });
  }

  const bruto = event.isBase64Encoded
    ? Buffer.from(event.body || '', 'base64').toString('utf8')
    : event.body || '';

  let dados;
  try {
    dados = JSON.parse(bruto);
  } catch (err) {
    console.log('[Kiwify] Corpo nao e JSON valido.');
    return responder(400, { error: 'Invalid JSON' });
  }

  const assinatura = (event.queryStringParameters || {}).signature;
  const segredo = process.env.KIWIFY_WEBHOOK_TOKEN;
  if (segredo) {
    if (!assinaturaValida(segredo, assinatura, bruto, dados)) {
      console.log(`[Kiwify] ASSINATURA INVALIDA (veio assinatura: ${assinatura ? 'sim' : 'nao'}). Chamada recusada.`);
      return responder(401, { error: 'Invalid signature' });
    }
  } else {
    console.log(`[Kiwify] AVISO: KIWIFY_WEBHOOK_TOKEN nao definido; origem da chamada NAO verificada (veio assinatura: ${assinatura ? 'sim' : 'nao'}).`);
  }

  // Alguns envios vem embrulhados em "order" ou "data"
  const p = (dados && (dados.order || dados.data)) || dados || {};

  console.log('[Kiwify] Recebido:', JSON.stringify(mascarar(dados)));

  const emailBruto = pegar(p, ['Customer.email', 'customer.email', 'email', 'buyer.email']);
  const email = emailBruto ? String(emailBruto).trim().toLowerCase() : '';
  const nome = pegar(p, ['Customer.full_name', 'customer.full_name', 'customer.name', 'name']);
  const produto = pegar(p, ['Product.product_name', 'product.name', 'product_name', 'product']);
  const status = String(pegar(p, ['order_status', 'status']) || '').toLowerCase();
  const evento = String(pegar(p, ['webhook_event_type', 'event']) || '').toLowerCase();

  let resultado = 'ignorado';
  if (NEGATIVO.includes(status) || NEGATIVO.includes(evento)) resultado = 'nao_aprovado';
  else if (APROVADO.includes(status) || APROVADO.includes(evento)) resultado = 'aprovado';

  let acesso = 'nao_se_aplica';
  if (resultado === 'aprovado') {
    const identity = context && context.clientContext && context.clientContext.identity;
    if (!email) {
      acesso = 'ERRO_sem_email';
    } else if (!identity || !identity.url || !identity.token) {
      acesso = 'ERRO_identity_indisponivel';
    } else {
      try {
        acesso = await liberarAcesso(identity, email, nome);
      } catch (err) {
        console.log('[Kiwify] Falha ao liberar acesso:', err.message);
        acesso = 'ERRO_api_identity';
      }
    }
  }

  console.log(
    `[Kiwify] Resultado: ${resultado} | acesso: ${acesso} | status="${status}" | evento="${evento}" | email=${email ? mascarar(email) : 'NAO ENCONTRADO'} | produto=${produto || 'NAO ENCONTRADO'}`
  );

  // Pagamento aprovado que nao conseguimos liberar: responde erro para o
  // Kiwify tentar de novo, em vez de perder a liberacao em silencio.
  if (acesso.startsWith('ERRO_api') || acesso === 'ERRO_identity_indisponivel') {
    return responder(500, { received: true, resultado, acesso });
  }

  return responder(200, { received: true, resultado, acesso });
};
