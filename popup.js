const EXT=globalThis.browser??globalThis.chrome;
const HAS_PROMISE_API=typeof globalThis.browser!=='undefined'&&EXT===globalThis.browser;
const PASSWORD='VPN MUNNA';
const DEFAULTS={profileVersion:9,enabled:true,gainDb:12,loudness:2,maxBoost:6,drive:.5,thresholdDb:-24,ratio:4,limiterDb:-2,presenceDb:3,lowShelfDb:4,highShelfDb:4,sustain:false,sustainTargetDb:-8,sustainMaxGain:8,forceRawMic:false,reverbEnabled:false,reverbDelay:.035,reverbFeedback:.18,reverbWet:.12,keepAlive:false,keepAliveGain:.0002,senderRefreshMs:750};
const ids=Object.keys(DEFAULTS).filter(k=>k!=='profileVersion');
function get(key){if(HAS_PROMISE_API)return EXT.storage.local.get(key);return new Promise(r=>EXT.storage.local.get(key,v=>r(EXT.runtime?.lastError?{}:v||{})));}
function set(v){if(HAS_PROMISE_API)return EXT.storage.local.set(v);return new Promise(r=>EXT.storage.local.set(v,()=>r(!EXT.runtime?.lastError)));}
function send(m){if(HAS_PROMISE_API)return EXT.runtime.sendMessage(m);return new Promise(r=>{try{EXT.runtime.sendMessage(m,v=>r(EXT.runtime?.lastError?null:v||null));}catch(e){r(null)}})}
function fmt(v){const n=Number(v);return Math.abs(n)<.01&&n!==0?n.toFixed(4):Number.isInteger(n)?String(n):n.toFixed(1)}
function labels(){ids.forEach(id=>{const el=document.getElementById(id),o=document.getElementById(id+'Val');if(el&&o&&el.type!=='checkbox')o.textContent=fmt(el.value)+(id==='gainDb'?' dB':'')})}
async function read(){const x=await get('micMaximizerConfig'),saved=x.micMaximizerConfig||{};return saved.profileVersion===9?{...DEFAULTS,...saved}:{...DEFAULTS}}
async function save(c){const merged={...DEFAULTS,...c};await set({micMaximizerConfig:merged});apply(merged)}
function apply(c){ids.forEach(id=>{const el=document.getElementById(id);if(!el)return;if(el.type==='checkbox')el.checked=!!c[id];else el.value=c[id]});labels()}
async function init(){const unlocked=(await get('fbxMicUnlocked')).fbxMicUnlocked===true;document.getElementById('login').hidden=unlocked;document.getElementById('app').hidden=!unlocked;if(!unlocked)return;
 const c=await read();apply(c);ids.forEach(id=>{const el=document.getElementById(id);if(el)el.addEventListener('input',async()=>{const v=await read();v[id]=el.type==='checkbox'?el.checked:Number(el.value);await save(v)})});
 const links={openMicOn:'enabled',bassOn:'lowShelfDb',clearOn:'highShelfDb'};
 for(const [control,key] of Object.entries(links)){const el=document.getElementById(control);el.addEventListener('change',async()=>{const v=await read();if(control==='openMicOn')v.enabled=el.checked;else if(!el.checked)v[key]=0;else v[key]=key==='lowShelfDb'?4:4;await save(v)})}
 await status();setInterval(status,5000);
}
async function status(){const el=document.getElementById('hookStatus');if(!el)return;try{const s=await send({type:'MICMAX_STATUS_REQUEST'});const age=s?.lastHeartbeat?Date.now()-s.lastHeartbeat:Infinity;el.textContent=s?.ok&&age<12000?'● ACTIVE on WhatsApp Web':'● Open or reload WhatsApp Web';}catch(e){el.textContent='● WhatsApp Web not detected'}}
document.getElementById('loginForm').addEventListener('submit',async e=>{e.preventDefault();const p=document.getElementById('password').value;if(p===PASSWORD){await set({fbxMicUnlocked:true});document.getElementById('loginError').textContent='';document.getElementById('login').hidden=true;document.getElementById('app').hidden=false;await init();}else{document.getElementById('loginError').textContent='Wrong password. Try again.';document.getElementById('password').value='';}});
init();