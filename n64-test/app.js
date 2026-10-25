'use strict';
/* PMOS N64 v3 · controles corregidos, mismo gameID para conservar guardados. */
const BASE='https://pub-e255b156b86149298448979225186068.r2.dev/';
const CDN='https://cdn.emulatorjs.org/stable/data/';
const byId=id=>document.getElementById(id);
const query=new URLSearchParams(location.search);
const rawId=query.get('id')||'';
const startScreen=byId('startScreen'),startButton=byId('startButton'),retryButton=byId('retryButton');
let selected=null,started=false;
function message(title,detail){byId('headline').textContent=title;byId('detail').textContent=detail}
function fail(detail){message('No se pudo abrir el cartucho',detail);byId('note').textContent='Comprueba el archivo y la configuración de Cloudflare.';retryButton.hidden=false;startButton.hidden=true;byId('readyControls').hidden=true}
retryButton.onclick=()=>location.reload();
function cleanPath(path){if(typeof path!=='string'||!/^Assets[0-9A-Za-z_-]+\/[^/]+\.(?:z64|n64|v64)$/i.test(path))return null;if(path.includes('..')||/[?#\\]/.test(path))return null;return path}
function cloudflareUrl(path){return BASE+path.split('/').map(encodeURIComponent).join('/')}
async function prepare(){try{
 if(!/^n64[a-z0-9]{12,40}$/i.test(rawId))throw Error('El identificador del NFC no es válido.');
 const r=await fetch('./n64-games.json',{cache:'no-store'});if(!r.ok)throw Error('No se encontró n64-games.json.');
 const config=await r.json(),path=cleanPath(config[rawId]);if(!path)throw Error('Este cartucho aún no tiene una ROM N64 asignada.');
 selected={id:rawId,path,url:cloudflareUrl(path)};message('Cartucho reconocido','Comprobando el archivo Nintendo 64…');
 const response=await fetch(selected.url,{method:'HEAD',mode:'cors',cache:'no-store'});if(!response.ok)throw Error('El archivo remoto devolvió HTTP '+response.status+'.');
 message('Cartucho listo','Selecciona el motor y presiona Iniciar.');byId('readyControls').hidden=false;byId('note').textContent='Para mayor fluidez, cierra otras pestañas y utiliza el modo horizontal.';startButton.hidden=false;
}catch(e){fail(e?.message||String(e))}}
function launch(){if(!selected||started)return;started=true;startButton.disabled=true;message('Iniciando N64…','Preparando motor, pantalla y controles.');
 byId('gameShell').hidden=false;
 window.EJS_player='#game';
 window.EJS_core=byId('coreChoice').value==='parallel-n64'?'parallel-n64':'n64';
 window.EJS_gameUrl=selected.url;
 window.EJS_pathtodata=CDN;
 window.EJS_startOnLoaded=true; // El usuario acaba de interactuar con Iniciar.
 window.EJS_controlScheme='n64';
 window.EJS_gameName='PMOS N64 '+selected.id;
 // Mantenemos exactamente el gameID anterior para preservar save states existentes.
 window.EJS_gameID=Array.from(selected.id).reduce((a,c)=>((a*33)^c.charCodeAt(0))>>>0,5381)||1;
 window.EJS_color='#78c9ff';
 window.EJS_defaultOptions={'save-state-location':'browser'};
 // Opciones de guardado por defecto: no se ocultan saveState/loadState.
 if(/Android|iPhone|iPad|Mobile/i.test(navigator.userAgent)){
   window.EJS_browserMode='mobile';
   // Diseño PMOS v3: en vertical la cruceta se oculta para evitar dos círculos encimados;
   // en horizontal aparece a la derecha de la palanca. La CSS posiciona y dimensiona el mando.
   // Los valores son los del esquema N64 de EmulatorJS (no el mapeo incorrecto de v2).
   window.EJS_VirtualGamepadSettings=[
     {type:'zone',id:'pmos_stick',location:'left',left:'45%',top:'55%',joystickInput:true,color:'blue',inputValues:[16,17,18,19]},
     {type:'dpad',id:'pmos_dpad',location:'left',left:'75%',top:'65%',joystickInput:false,inputValues:[4,5,6,7]},
     {type:'button',text:'B',id:'pmos_b',location:'right',left:18,top:180,bold:true,fontSize:21,input_value:1},
     {type:'button',text:'A',id:'pmos_a',location:'right',left:103,top:180,bold:true,fontSize:21,input_value:0},
     // Botones C son entradas de ejes del mando N64, no botones digitales 12 a 15.
     {type:'button',text:'C↑',id:'pmos_cu',location:'right',left:74,top:20,fontSize:15,joystickInput:true,input_value:23},
     {type:'button',text:'C←',id:'pmos_cl',location:'right',left:23,top:68,fontSize:15,joystickInput:true,input_value:21},
     {type:'button',text:'C↓',id:'pmos_cd',location:'right',left:74,top:116,fontSize:15,joystickInput:true,input_value:22},
     {type:'button',text:'C→',id:'pmos_cr',location:'right',left:125,top:68,fontSize:15,joystickInput:true,input_value:20},
     {type:'button',text:'L',id:'pmos_l',location:'left',left:5,top:-15,fontSize:15,block:true,input_value:10},
     {type:'button',text:'Z',id:'pmos_z',location:'left',left:82,top:-15,fontSize:15,block:true,input_value:12},
     {type:'button',text:'R',id:'pmos_r',location:'right',left:120,top:-15,fontSize:15,block:true,input_value:11},
     {type:'button',text:'START',id:'pmos_start',location:'center',left:35,fontSize:14,block:true,input_value:3}
   ];
 }
 window.EJS_onGameStart=()=>{startScreen.hidden=true};
 const script=document.createElement('script');script.src=CDN+'loader.js';script.onerror=()=>{started=false;byId('gameShell').hidden=true;fail('No se pudo cargar EmulatorJS. Revisa tu conexión.')};document.body.append(script);
 setTimeout(()=>{if(started)startScreen.hidden=true},5000);
}
startButton.onclick=launch;
prepare();
