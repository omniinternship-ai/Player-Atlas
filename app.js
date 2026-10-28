(() => {
'use strict';
const $=id=>document.getElementById(id),fmt=n=>Number(n).toLocaleString('th-TH',{maximumFractionDigits:1});
let busy=false,client;
function clear(){for(const id of ['players','score','average','safe','mission','minigame','complete','updated'])$(id).textContent='—';$('ranking').replaceChildren();}
function render(data){
 const s=data?.summary,ranks=data?.ranking;if(!s||!Array.isArray(ranks))throw Error('รูปแบบข้อมูลไม่ถูกต้อง');
 const numbers=['players','total_score','mission_score','minigame_score','safest','decisions','completed'];if(numbers.some(k=>s[k]===null||!Number.isFinite(Number(s[k]))))throw Error('ค่าข้อมูลไม่ถูกต้อง');
 const players=Number(s.players),decisions=Number(s.decisions);
 $('players').textContent=fmt(players);$('score').textContent=fmt(s.total_score);$('average').textContent=players?fmt(s.average_score):'—';$('safe').textContent=decisions?fmt(Number(s.safest)/decisions*100)+'%':'—';
 $('mission').textContent=fmt(s.mission_score);$('minigame').textContent=fmt(s.minigame_score);$('complete').textContent=fmt(s.completed)+' คน'+(players?' ('+fmt(Number(s.completed)/players*100)+'%)':'');
 $('updated').textContent=s.last_saved_at?new Date(s.last_saved_at).toLocaleString('th-TH'):'ยังไม่มีบันทึก';
 $('ranking').replaceChildren();for(const r of ranks){if(![r.rank,r.total_score,r.players].every(v=>Number.isFinite(Number(v))))throw Error('อันดับไม่ถูกต้อง');const tr=document.createElement('tr');for(const value of [fmt(r.rank),fmt(r.total_score),fmt(r.players),players?fmt(Number(r.players)/players*100)+'%':'—']){const td=document.createElement('td');td.textContent=value;tr.append(td);}$('ranking').append(tr);}
 if(!players){const tr=document.createElement('tr'),td=document.createElement('td');td.colSpan=4;td.textContent='ยังไม่มีผู้เล่นบันทึกสถิติ';tr.append(td);$('ranking').append(tr);}
}
async function load(){if(busy)return;busy=true;$('refresh').disabled=true;$('notice').textContent='กำลังอ่านสถิติรวมจาก Supabase…';try{const c=window.SUPABASE_CONFIG;if(!window.supabase||!c?.url)throw Error('ไม่สามารถโหลดการเชื่อมต่อได้ ตรวจอินเทอร์เน็ต');client ||= window.supabase.createClient(c.url,c.publishableKey,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});const {data,error}=await client.rpc('atlas_global_summary');if(error)throw error;render(data);$('modeLabel').textContent='ข้อมูลจริง · Supabase';$('notice').textContent='ข้อมูลจริงจาก v003_player_data · รวมผู้เล่นทุกพื้นที่โดยไม่ต้องเลือกจังหวัด · รีเฟรชทุก 60 วินาที';}catch(error){clear();$('modeLabel').textContent='ยังโหลดข้อมูลไม่ได้';$('notice').textContent=error.code==='PGRST202'?'ต้องติดตั้ง Player-Atlas/supabase/global-stats.sql ใน Supabase SQL Editor ก่อน เพื่ออ่านจำนวนผู้เล่นและอันดับจริง':'โหลดข้อมูลไม่ได้: '+error.message+' • ไม่มีการแสดงตัวเลขสมมติ';}finally{busy=false;$('refresh').disabled=false;}}
const map=$('thailandMap'),image=$('mapImage');let zoom=1,x=0,y=0,drag=null;
function transform(){const maxX=map.clientWidth*(zoom-1)/2,maxY=map.clientHeight*(zoom-1)/2;x=Math.max(-maxX,Math.min(maxX,x));y=Math.max(-maxY,Math.min(maxY,y));image.style.transform=`translate(${x}px,${y}px) scale(${zoom})`;$('zoomOut').disabled=zoom<=1;$('zoomIn').disabled=zoom>=3;}
function changeZoom(delta){zoom=Math.max(1,Math.min(3,zoom+delta));transform();}
$('zoomIn').onclick=()=>changeZoom(.25);$('zoomOut').onclick=()=>changeZoom(-.25);$('resetMap').onclick=()=>{zoom=1;x=y=0;transform();};
map.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY};map.setPointerCapture(e.pointerId);});map.addEventListener('pointermove',e=>{if(!drag)return;x+=e.clientX-drag.x;y+=e.clientY-drag.y;drag={x:e.clientX,y:e.clientY};transform();});map.addEventListener('pointerup',()=>drag=null);map.addEventListener('pointercancel',()=>drag=null);
map.addEventListener('keydown',e=>{if(['+','=','-','0'].includes(e.key)){e.preventDefault();if(e.key==='0')$('resetMap').click();else changeZoom(e.key==='-'?-.25:.25);}});
// Sparse water-like particles behind Thailand; respects reduced motion.
const canvas=$('waterParticles'),ctx=canvas.getContext('2d'),motion=matchMedia('(prefers-reduced-motion: reduce)');
let waterWidth=0,waterHeight=0,waterFrame=0,waterStart=performance.now();
function resizeWater(){waterWidth=map.clientWidth;waterHeight=map.clientHeight;const ratio=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(waterWidth*ratio);canvas.height=Math.round(waterHeight*ratio);ctx?.setTransform(ratio,0,0,ratio,0,0);}
function water(now){if(!ctx)return;const t=motion.matches?0:(now-waterStart)/1000;ctx.clearRect(0,0,waterWidth,waterHeight);for(let row=0;row<12;row++){for(let col=0;col<16;col++){const phase=col*.52+row*.65;const px=(col+.5)/16*waterWidth+Math.sin(t*.28+row)*5;const py=(row+.5)/12*waterHeight+Math.sin(phase+t*.55)*11;const alpha=.12+(Math.sin(phase+t*.45)+1)*.12;ctx.fillStyle=`rgba(118,202,207,${alpha})`;ctx.beginPath();ctx.arc(px,py,(row%3===0?.95:.65),0,Math.PI*2);ctx.fill();}}if(!motion.matches&&!document.hidden)waterFrame=requestAnimationFrame(water);}
function startWater(){cancelAnimationFrame(waterFrame);resizeWater();waterFrame=requestAnimationFrame(water);}
new ResizeObserver(startWater).observe(map);motion.addEventListener('change',startWater);document.addEventListener('visibilitychange',()=>{if(document.hidden)cancelAnimationFrame(waterFrame);else startWater();});startWater();
window.addEventListener('resize',transform);transform();$('refresh').onclick=load;load();setInterval(()=>{if(!document.hidden)load();},60000);
})();
