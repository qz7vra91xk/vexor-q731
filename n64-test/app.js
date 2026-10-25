'use strict';
/* PMOS Nintendo 64 · independiente de la aplicación GBA existente */
const BASE = 'https://pub-e255b156b86149298448979225186068.r2.dev/';
const CDN = 'https://cdn.emulatorjs.org/stable/data/';
const byId = id => document.getElementById(id);
const query = new URLSearchParams(location.search);
const rawId = query.get('id') || '';
const startScreen=byId('startScreen'), startButton=byId('startButton'),retryButton=byId('retryButton');
let selected=null,started=false;
function message(title,detail){byId('headline').textContent=title;byId('detail').textContent=detail}
function fail(detail){message('No se pudo abrir el cartucho',detail);byId('note').textContent='Comprueba el archivo y la configuración de Cloudflare.';retryButton.hidden=false;startButton.hidden=true}
retryButton.onclick=()=>location.reload();
function cleanPath(path){
  // R2 conserva los nombres originales; permitimos espacios y paréntesis.
  if (typeof path !== 'string' || !/^Assets[0-9A-Za-z_-]+\/[^/]+\.(?:z64|n64|v64)$/i.test(path)) return null;
  if (path.includes('..') || /[?#\\]/.test(path)) return null;
  return path;
}
function cloudflareUrl(path){
  // EncodeURI conserva algunos caracteres reservados; encodeURIComponent codifica también los paréntesis.
  return BASE + path.split('/').map(encodeURIComponent).join('/');
}
async function prepare(){
  try{
    if(!/^n64[a-z0-9]{12,40}$/i.test(rawId)) throw Error('El identificador del NFC no es válido.');
    const r=await fetch('./n64-games.json',{cache:'no-store'});
    if(!r.ok) throw Error('No se encontró n64-games.json.');
    const config=await r.json();
    const path=cleanPath(config[rawId]);
    if(!path) throw Error('Este cartucho aún no tiene una ROM N64 asignada.');
    selected={id:rawId,path,url:cloudflareUrl(path)};
    message('Cartucho reconocido','Comprobando el archivo de Nintendo 64…');
    const response=await fetch(selected.url,{method:'HEAD',mode:'cors',cache:'no-store'});
    if(!response.ok) throw Error('El archivo remoto devolvió HTTP '+response.status+'.');
    message('Cartucho listo','Presiona Iniciar para cargar el motor N64.');
    byId('note').textContent='Nintendo 64 puede requerir más potencia que GBA. El primer inicio necesita internet.';
    startButton.hidden=false;
  }catch(e){fail(e?.message||String(e))}
}
function launch(){
  if(!selected||started)return;
  started=true;startButton.disabled=true;
  message('Iniciando N64…','Descargando el motor y preparando los controles.');
  // EmulatorJS documenta que el autoarranque sin interacción puede congelarse.
  // Esta pulsación real del usuario evita ese comportamiento.
  byId('gameShell').hidden=false;
  window.EJS_player='#game';
  window.EJS_core='n64'; // mupen64plus_next por defecto; alternativa: parallel-n64
  window.EJS_gameUrl=selected.url;
  window.EJS_pathtodata=CDN;
  window.EJS_startOnLoaded=true;
  window.EJS_controlScheme='n64';
  window.EJS_gameName='PMOS N64 '+selected.id;
  // ID estable y único para separar partidas por cartucho; sin perder la referencia al enlace NFC.
  window.EJS_gameID=Array.from(selected.id).reduce((a,c)=>((a*33) ^ c.charCodeAt(0)) >>> 0,5381) || 1;
  window.EJS_onGameStart=()=>{startScreen.hidden=true};
  const script=document.createElement('script');
  script.src=CDN+'loader.js';
  script.onerror=()=>{started=false;byId('gameShell').hidden=true;fail('No se pudo cargar EmulatorJS. Revisa la conexión y vuelve a intentar.')};
  document.body.append(script);
  // No tapamos el emulador indefinidamente si el callback no está disponible en una versión CDN.
  setTimeout(()=>{if(started)startScreen.hidden=true},5000);
}
startButton.onclick=launch;
prepare();
