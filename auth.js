/* AtlasMed · cliente mínimo do Netlify Identity (GoTrue). Sem dependências.
   Os e-mails e senhas ficam no Netlify (Identity). Aqui só há o token da sessão. */
(function(){
'use strict';
var API='/.netlify/identity',KEY='am_auth';
function jparse(s){try{return JSON.parse(s)}catch(e){return null}}
function load(){try{return jparse(localStorage.getItem(KEY))}catch(e){return null}}
function store(s){try{if(s)localStorage.setItem(KEY,JSON.stringify(s));else localStorage.removeItem(KEY)}catch(e){}cookie(s)}
function cookie(s){try{
  var sec=location.protocol==='https:'?'; Secure':'';
  if(s&&s.access_token){var age=Math.max(60,Math.floor((s.expires_at-Date.now())/1000));document.cookie='nf_jwt='+s.access_token+'; Path=/; Max-Age='+age+'; SameSite=Lax'+sec}
  else document.cookie='nf_jwt=; Path=/; Max-Age=0; SameSite=Lax'+sec}catch(e){}}
function msg(d,st){
  var m=(d&&(d.error_description||d.msg||d.message||d.error))||'';
  if(/invalid.*(grant|credentials)|No user found|invalid_grant/i.test(m)||st===400&&/password/i.test(m))return 'E-mail ou senha incorretos.';
  if(/not confirmed|confirm/i.test(m))return 'Confirme seu e-mail pelo link que enviamos antes de entrar.';
  if(/already|registered|exists/i.test(m))return 'Este e-mail já tem cadastro. Use Entrar.';
  if(/password/i.test(m)&&/(short|least|characters|weak)/i.test(m))return 'A senha precisa ter pelo menos 8 caracteres.';
  if(/signups? (not allowed|disabled)|not allowed/i.test(m))return 'Os cadastros estão temporariamente fechados.';
  if(st===404)return 'O serviço de login ainda não está ativo neste endereço.';
  if(st===429)return 'Muitas tentativas. Aguarde um minuto e tente de novo.';
  return m||'Não foi possível concluir. Tente novamente.';}
async function call(path,o){
  o=o||{};var h={};if(o.token)h.Authorization='Bearer '+o.token;
  var body;if(o.form){h['Content-Type']='application/x-www-form-urlencoded';body=new URLSearchParams(o.form).toString()}
  else if(o.json){h['Content-Type']='application/json';body=JSON.stringify(o.json)}
  var r;try{r=await fetch(API+path,{method:o.method||'GET',headers:h,body:body})}catch(e){throw new Error('Sem conexão. Verifique a internet e tente de novo.')}
  var t=await r.text(),d=t?jparse(t):null;
  if(!r.ok){var e=new Error(msg(d,r.status));e.status=r.status;throw e}
  return d||{}}
function mk(t){var exp=Date.now()+(+t.expires_in||3600)*1000;return{access_token:t.access_token,refresh_token:t.refresh_token,expires_at:exp}}
async function fetchUser(s){var u=await call('/user',{token:s.access_token});s.user=slim(u);store(s);return s}
function slim(u){var m=u.user_metadata||{},p=(u.app_metadata&&u.app_metadata.provider)||'email';
  return{id:u.id,email:u.email,name:m.full_name||m.name||'',provider:p,created:u.created_at,roles:(u.app_metadata&&u.app_metadata.roles)||[]}}
var A={
  user:function(){var s=load();return s&&s.user||null},
  has:function(){var s=load();return !!(s&&s.refresh_token)},
  initial:function(u){u=u||A.user()||{};var c=(u.name||u.email||'?').trim().charAt(0);return c?c.toLocaleUpperCase('pt-BR'):'?'},
  first:function(u){u=u||A.user()||{};return (u.name||'').trim().split(/\s+/)[0]||(u.email||'').split('@')[0]},
  settings:async function(){try{return await call('/settings')}catch(e){return null}},
  login:async function(email,pw){
    var t=await call('/token',{method:'POST',form:{grant_type:'password',username:email,password:pw}});
    var s=mk(t);store(s);return fetchUser(s)},
  signup:async function(name,email,pw){
    var d=await call('/signup',{method:'POST',json:{email:email,password:pw,data:{full_name:name}}});
    if(d.access_token){var s=mk(d);store(s);await fetchUser(s);return{done:true}}
    if(d.confirmed_at||d.confirmation_sent_at===undefined&&d.id){await A.login(email,pw);return{done:true}}
    return{confirm:true}},
  recover:function(email){return call('/recover',{method:'POST',json:{email:email}})},
  google:function(){location.href=API+'/authorize?provider=google&site_url='+encodeURIComponent(location.origin)},
  token:async function(force){
    var s=load();if(!s||!s.refresh_token)return null;
    if(!force&&s.expires_at-Date.now()>60000){cookie(s);return s.access_token}
    try{var t=await call('/token',{method:'POST',form:{grant_type:'refresh_token',refresh_token:s.refresh_token}});
      var n=mk(t);n.user=s.user;store(n);return n.access_token}
    catch(e){if(e.status>=400&&e.status<500){store(null);return null}throw e}},
  /* valida a sessão: true = logado, false = precisa entrar. Erro de rede mantém a sessão salva. */
  ensure:async function(){
    var s=load();if(!s||!s.refresh_token)return false;
    try{var tk=await A.token();if(!tk)return false;s=load();if(!s.user)await fetchUser(s);return true}
    catch(e){return !!load()}},
  /* true = a conta tem assinatura ativa (papel "member"). Renova o token para o
     papel recém-liberado valer na hora, sem precisar sair e entrar de novo. */
  member:async function(){
    var s=load();if(!s||!s.refresh_token)return false;
    var tk=await A.token(true);if(!tk)return false;
    s=load();await fetchUser(s);
    return (s.user.roles||[]).indexOf('member')>=0},
  update:async function(patch){
    var tk=await A.token();if(!tk)throw new Error('Sessão expirada. Entre novamente.');
    var u=await call('/user',{method:'PUT',token:tk,json:patch}),s=load();s.user=slim(u);store(s);return s.user},
  logout:async function(){
    var s=load();try{if(s&&s.access_token)await fetch(API+'/logout',{method:'POST',headers:{Authorization:'Bearer '+s.access_token}})}catch(e){}
    store(null)},
  /* trata o retorno de Google, confirmação de e-mail e recuperação (token no #hash) */
  callback:async function(){
    var h=location.hash.replace(/^#/,'');if(!h||h.indexOf('=')<0)return null;
    var p=new URLSearchParams(h),clean=function(){history.replaceState(null,'',location.pathname+location.search)};
    if(p.get('error')){var m=p.get('error_description')||p.get('error');clean();return{error:/access_denied/.test(m)?'Login cancelado.':'Não foi possível entrar com o Google. Tente de novo.'}}
    if(p.get('access_token')){var s=mk({access_token:p.get('access_token'),refresh_token:p.get('refresh_token'),expires_in:p.get('expires_in')});store(s);clean();
      try{await fetchUser(s)}catch(e){}return{login:true,recovery:p.get('type')==='recovery'}}
    var ct=p.get('confirmation_token');
    if(ct){clean();try{var t=await call('/verify',{method:'POST',json:{type:'signup',token:ct}});var s2=mk(t);store(s2);await fetchUser(s2);return{login:true,confirmed:true}}catch(e){return{error:'Link de confirmação inválido ou expirado. Faça o cadastro de novo.'}}}
    var rt=p.get('recovery_token');
    if(rt){clean();try{var t2=await call('/verify',{method:'POST',json:{type:'recovery',token:rt}});var s3=mk(t2);store(s3);await fetchUser(s3);return{login:true,recovery:true}}catch(e){return{error:'Link de recuperação inválido ou expirado. Peça outro.'}}}
    return null}
};
window.AM_AUTH=A;
})();
