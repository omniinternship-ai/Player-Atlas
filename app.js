(() => {
'use strict';
if(new URLSearchParams(location.search).get('embed')==='simulation')document.documentElement.classList.add('simulation-embed');
const $=id=>document.getElementById(id),fmt=n=>Number(n).toLocaleString('th-TH',{maximumFractionDigits:1});
let busy=false,hasData=false;
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
async function loadProfiles(){
 const container=$('publicProfiles'),status=$('publicProfileStatus');if(!container)return;
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);
 try{const c=window.SUPABASE_CONFIG;const response=await fetch(c.url.replace(/\/$/,'')+'/rest/v1/rpc/atlas_public_profiles',{method:'POST',headers:{apikey:c.publishableKey,'Content-Type':'application/json'},body:'{}',signal:controller.signal,cache:'no-store'});const data=await response.json();if(!response.ok)throw Error(data.message||'โหลดไม่ได้');if(!Array.isArray(data))throw Error('รูปแบบข้อมูลไม่ถูกต้อง');container.replaceChildren();for(const p of data){const row=document.createElement('article');row.className='public-profile';const name=document.createElement('strong');name.textContent=p.display_name;const location=document.createElement('small');location.textContent=[p.province,p.region].filter(Boolean).join(' · ')||'ไม่เผยแพร่พื้นที่';const score=document.createElement('span');score.textContent='อันดับ '+fmt(p.rank)+' · '+fmt(p.total_score)+' คะแนน';row.append(name,location,score);container.append(row);}status.textContent=data.length?'เฉพาะผู้ยินยอมแสดงชื่อและคะแนน สูงสุด 100 โปรไฟล์':'ยังไม่มีผู้ยินยอมเผยแพร่โปรไฟล์';}
 catch(_){container.replaceChildren();status.textContent='โปรไฟล์สาธารณะยังโหลดไม่ได้ • ตรวจการติดตั้ง player-profiles.sql';}
 finally{clearTimeout(timer);}
}
let mapRows=[];
function mapInfo(rows,label){const n=rows.reduce((a,r)=>a+Number(r.players),0),score=rows.reduce((a,r)=>a+Number(r.total_score),0),all=mapRows.reduce((a,r)=>a+Number(r.players),0);$('mapDetail').textContent=label+' · '+fmt(n)+' คน · รวม '+fmt(score)+' คะแนน · เฉลี่ย '+(n?fmt(score/n):'—')+' · '+(all?fmt(n/all*100):'0')+'% ของผู้เล่นที่เผยแพร่พื้นที่';}
function drawMap(){
 const layer=$('provinceMarkers');layer.replaceChildren();const ns='http://www.w3.org/2000/svg';
 for(const r of mapRows){const p=window.AtlasProvincePoints?.[r.province_code];if(!p)continue;
 const cx=(p.lon-97.3)/8.5*1051.164,cy=(20.5-p.lat)/15*1849.133;
 const dot=document.createElementNS(ns,'circle');dot.setAttribute('cx',cx);dot.setAttribute('cy',cy);dot.setAttribute('r',Math.min(24,10+Math.sqrt(Number(r.players))*2));dot.setAttribute('fill','#f4d391');dot.setAttribute('tabindex','0');dot.setAttribute('role','button');dot.setAttribute('aria-label',r.province_name+' '+r.players+' คน');const title=document.createElementNS(ns,'title');title.textContent=r.province_name+' · '+r.players+' คน';dot.append(title);dot.onclick=()=>mapInfo([r],r.province_name);dot.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();mapInfo([r],r.province_name);}};layer.append(dot);}
 mapInfo(mapRows,'ผู้เล่นที่เผยแพร่พื้นที่');
}
async function loadMap(){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);try{const c=window.SUPABASE_CONFIG;const response=await fetch(c.url.replace(/\/$/,'')+'/rest/v1/rpc/atlas_map_summary',{method:'POST',headers:{apikey:c.publishableKey,'Content-Type':'application/json'},body:'{}',signal:controller.signal,cache:'no-store'});const data=await response.json();if(!response.ok||!Array.isArray(data))throw Error();mapRows=data;drawMap();if(!data.length)$('mapDetail').textContent='ยังไม่มีผู้เล่นที่บันทึกคะแนนและยินยอมเผยแพร่จังหวัด';}catch(_){mapRows=[];$('provinceMarkers').replaceChildren();$('mapDetail').textContent='โหลดจุดผู้เล่นไม่ได้ • ต้องติดตั้ง supabase/map-regions.sql และมีผู้ยินยอมเผยแพร่จังหวัด';}finally{clearTimeout(timer);}}
async function load(){
 if(busy)return;busy=true;$('refresh').disabled=true;$('notice').textContent='กำลังอ่านสถิติรวมจาก Supabase…';
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),12000);
 try{
  const c=window.SUPABASE_CONFIG;if(!c?.url||!c.publishableKey)throw Error('ไม่พบการตั้งค่า Supabase');
  // This public aggregate needs no user session or shared authentication lock.
  const response=await fetch(c.url.replace(/\/$/,'')+'/rest/v1/rpc/atlas_global_summary',{method:'POST',headers:{apikey:c.publishableKey,'Content-Type':'application/json'},body:'{}',signal:controller.signal,cache:'no-store'});
  const data=await response.json();if(!response.ok){const error=new Error(data.message||'HTTP '+response.status);error.code=data.code;throw error;}
  render(data);hasData=true;loadProfiles();loadMap();$('modeLabel').textContent='ข้อมูลจริง · Supabase';$('notice').textContent='ข้อมูลจริงจาก v003_player_data · รวมผู้เล่นทุกพื้นที่โดยไม่ต้องเลือกจังหวัด · รีเฟรชทุก 60 วินาที';
 }catch(error){
  if(!hasData)clear();$('modeLabel').textContent=hasData?'ข้อมูลครั้งล่าสุด · อัปเดตไม่ได้':'เชื่อมต่อข้อมูลไม่ได้';
  const reason=error.name==='AbortError'?'Supabase ตอบกลับช้าเกิน 12 วินาที กรุณากดอัปเดตข้อมูลอีกครั้ง':error.code==='PGRST202'?'ยังไม่มี API คะแนน กรุณารัน Player-Atlas/supabase/global-stats.sql ใน SQL Editor':error.message;
  $('notice').textContent=reason+(hasData?' • ยังคงแสดงข้อมูลจริงที่โหลดสำเร็จครั้งล่าสุด':' • ยังยืนยันยอดคะแนนไม่ได้ ไม่ได้ลบหรือรีเซ็ตคะแนน');
 }finally{clearTimeout(timeout);busy=false;$('refresh').disabled=false;}
}
const map=$('thailandMap'),image=$('mapImage');let zoom=1,x=0,y=0,drag=null;
function transform(){const maxX=map.clientWidth*(zoom-1)/2,maxY=map.clientHeight*(zoom-1)/2;x=Math.max(-maxX,Math.min(maxX,x));y=Math.max(-maxY,Math.min(maxY,y));image.style.transform=`translate(${x}px,${y}px) scale(${zoom})`;$('provinceMarkers').style.transform=image.style.transform;$('zoomOut').disabled=zoom<=1;$('zoomIn').disabled=zoom>=3;}
function changeZoom(delta){zoom=Math.max(1,Math.min(3,zoom+delta));transform();}
$('zoomIn').onclick=()=>changeZoom(.25);$('zoomOut').onclick=()=>changeZoom(-.25);$('resetMap').onclick=()=>{zoom=1;x=y=0;transform();};
map.addEventListener('pointerdown',e=>{if(e.target.closest('circle'))return;drag={x:e.clientX,y:e.clientY};map.setPointerCapture(e.pointerId);});map.addEventListener('pointermove',e=>{if(!drag)return;x+=e.clientX-drag.x;y+=e.clientY-drag.y;drag={x:e.clientX,y:e.clientY};transform();});map.addEventListener('pointerup',()=>drag=null);map.addEventListener('pointercancel',()=>drag=null);
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
