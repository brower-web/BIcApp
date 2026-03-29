// ── Data ──
const STORAGE_KEY = 'bicikl_data';
function loadData(){
  try{return JSON.parse(localStorage.getItem(STORAGE_KEY))} catch(e){return null}
}
function defaultData(){
  return {rides:[],profile:{name:'Biciklist',weight_kg:75,bike:'Gradski'},goals:{weekly_km:50,weekly_cal:2000}};
}
let DATA = loadData() || defaultData();
function save(){localStorage.setItem(STORAGE_KEY, JSON.stringify(DATA))}

// ── Checklist ──
const CHECKLIST=[
  ['🔧 Gume napumpane i bez oštećenja','tyres'],
  ['🔗 Lanac podmazan i napet','chain'],
  ['🛑 Prednja kočnica ispravna','front_brake'],
  ['🛑 Stražnja kočnica ispravna','rear_brake'],
  ['💡 Prednje svjetlo radi','front_light'],
  ['🔴 Stražnje svjetlo radi','rear_light'],
  ['🪖 Kaciga na glavi','helmet'],
  ['🔔 Zvono ispravno','bell'],
  ['🪞 Retrovizor čist','mirror'],
  ['💧 Boca vode napunjena','water'],
];

const CATEGORIES=[
  {value:'city',label:'Gradska'},
  {value:'road',label:'Cestovna'},
  {value:'mountain',label:'Planinska'},
  {value:'trail',label:'Trail'},
  {value:'commute',label:'Na posao'},
  {value:'leisure',label:'Rekreacija'},
];

// ── Helpers ──
function fmt(s){s=Math.floor(s);const h=Math.floor(s/3600),m=Math.floor(s%3600/60),ss=s%60;return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(ss).padStart(2,'0')}`}
function calcCal(km,mins,weight){const spd=mins>0?km/(mins/60):15;const met=4+(spd/30)*8;return Math.round(met*weight*(mins/60))}
function isThisWeek(d){try{const dt=new Date(d),now=new Date(),day=now.getDay()||7,start=new Date(now);start.setDate(now.getDate()-(day-1));start.setHours(0,0,0,0);return dt>=start}catch(e){return false}}
function $(id){return document.getElementById(id)}

// ── Nav ──
const TABS=[
  ['📊','Dashboard','showDashboard'],
  ['✅','Pred-vožnja','showChecklist'],
  ['🚴','Nova vožnja','showNewRide'],
  ['📜','Povijest','showHistory'],
  ['📈','Statistike','showStats'],
  ['👤','Profil','showProfile'],
];
let activeTab=0;
function buildNav(){
  const nav=$('nav');nav.innerHTML='';
  TABS.forEach(([icon,text,fn],i)=>{
    const b=document.createElement('button');
    b.innerHTML=`${icon} <span class="nav-text">${text}</span>`;
    if(i===activeTab)b.className='active';
    b.onclick=()=>{activeTab=i;buildNav();window[fn]()};
    nav.appendChild(b);
  });
}

// ── Dashboard ──
function showDashboard(){
  const m=$('main'),r=DATA.rides;
  const totalKm=r.reduce((a,x)=>a+x.distance_km,0);
  const totalCal=r.reduce((a,x)=>a+x.calories,0);
  const totalSec=r.reduce((a,x)=>a+x.duration_sec,0);
  const avgSpd=totalSec>0?(totalKm/(totalSec/3600)):0;
  const weekRides=r.filter(x=>isThisWeek(x.date));
  const weekKm=weekRides.reduce((a,x)=>a+x.distance_km,0);
  const weekCal=weekRides.reduce((a,x)=>a+x.calories,0);
  const gkm=DATA.goals.weekly_km,gcal=DATA.goals.weekly_cal;
  const pkm=gkm>0?Math.min(weekKm/gkm*100,100):0;
  const pcal=gcal>0?Math.min(weekCal/gcal*100,100):0;

  m.innerHTML=`
    <div class="page-title">📊 Dashboard</div>
    <div class="page-sub">Dobrodošli, ${DATA.profile.name}!</div>
    <div class="stat-row">
      ${statBox('🚴',totalKm.toFixed(1),'Ukupno km','var(--accent)')}
      ${statBox('🔥',Math.round(totalCal),'Kalorije','var(--warn)')}
      ${statBox('⏱️',fmt(totalSec),'Ukupno vrijeme','var(--info)')}
      ${statBox('📏',r.length,'Broj vožnji','var(--accent)')}
      ${statBox('⚡',avgSpd.toFixed(1),'Prosj. km/h','var(--danger)')}
    </div>
    <div class="card">
      <h3 style="margin-bottom:12px">🎯 Tjedni cilj</h3>
      <div class="goal-row">
        <div class="goal-label">Kilometri: ${weekKm.toFixed(1)} / ${gkm} (${pkm.toFixed(0)}%)</div>
        <div class="goal-bar-bg"><div class="goal-bar-fill" style="width:${pkm}%;background:var(--accent)"></div></div>
      </div>
      <div class="goal-row">
        <div class="goal-label">Kalorije: ${Math.round(weekCal)} / ${gcal} (${pcal.toFixed(0)}%)</div>
        <div class="goal-bar-bg"><div class="goal-bar-fill" style="width:${pcal}%;background:var(--warn)"></div></div>
      </div>
    </div>
    <div class="card">
      <h3 style="margin-bottom:12px">🕐 Zadnje vožnje</h3>
      ${r.length===0?'<div class="empty">Nema vožnji. Kreni voziti! 🚴</div>':
        r.slice(0,5).map(x=>`<div style="background:var(--card2);padding:10px 14px;border-radius:6px;margin-bottom:6px;font-size:.9rem">
          📅 ${x.date} &nbsp;|&nbsp; 🛣️ ${x.distance_km.toFixed(1)} km &nbsp;|&nbsp; ⏱️ ${fmt(x.duration_sec)} &nbsp;|&nbsp; 🔥 ${x.calories} kcal
        </div>`).join('')}
    </div>`;
}
function statBox(icon,val,lbl,color){
  return `<div class="stat-box"><div class="icon">${icon}</div><div class="val" style="color:${color}">${val}</div><div class="lbl">${lbl}</div></div>`;
}

// ── Checklist ──
function showChecklist(){
  const m=$('main');
  m.innerHTML=`
    <div class="page-title">✅ Pred-vožnja provjera</div>
    <div class="page-sub">Provjeri sve stavke prije polaska — sigurnost na prvom mjestu!</div>
    <div class="card">
      ${CHECKLIST.map(([label,key])=>`
        <div class="check-item">
          <input type="checkbox" id="ck_${key}" onchange="updateCheckStatus()">
          <label for="ck_${key}">${label}</label>
        </div>`).join('')}
      <div id="checkStatus" class="check-status" style="background:var(--card2);color:var(--warn)">⚠️ Provjereno 0/${CHECKLIST.length} stavki</div>
      <div class="actions">
        <button class="btn btn-green btn-sm" onclick="checkAll(true)">✅ Označi sve</button>
        <button class="btn btn-red btn-sm" onclick="checkAll(false)">❌ Poništi sve</button>
        <button class="btn btn-green" onclick="goToRideFromCheck()">🚴 Unesi vožnju →</button>
      </div>
    </div>`;
  updateCheckStatus();
}
function checkAll(v){CHECKLIST.forEach(([,k])=>{const c=$('ck_'+k);if(c)c.checked=v});updateCheckStatus()}
function updateCheckStatus(){
  const n=CHECKLIST.filter(([,k])=>{const c=$('ck_'+k);return c&&c.checked}).length;
  const el=$('checkStatus');
  if(n===CHECKLIST.length){el.textContent=`✅ Sve provjere gotove (${n}/${CHECKLIST.length}) — Spreman za vožnju!`;el.style.color='var(--accent)'}
  else{el.textContent=`⚠️ Provjereno ${n}/${CHECKLIST.length} stavki`;el.style.color='var(--warn)'}
}
function goToRideFromCheck(){
  const unchecked=CHECKLIST.filter(([,k])=>{const c=$('ck_'+k);return !c||!c.checked});
  if(unchecked.length>0&&!confirm('Niste provjerili:\n\n'+unchecked.map(x=>x[0]).join('\n')+'\n\nŽelite li ipak nastaviti?'))return;
  activeTab=2;buildNav();showNewRide();
}

// ── Nova vožnja (ručni unos) ──
function showNewRide(){
  const m=$('main');
  const now=new Date();
  const dateStr=now.toISOString().slice(0,10);
  const timeStr=now.toTimeString().slice(0,5);
  m.innerHTML=`
    <div class="page-title">🚴 Unesi novu vožnju</div>
    <div class="page-sub">Ručno upiši podatke o svojoj vožnji</div>
    <div class="card">
      <div class="form-grid">
        <div class="form-group">
          <label>📅 Datum</label>
          <input type="date" id="r_date" value="${dateStr}">
        </div>
        <div class="form-group">
          <label>🕐 Vrijeme polaska</label>
          <input type="time" id="r_time" value="${timeStr}">
        </div>
        <div class="form-group">
          <label>🛣️ Udaljenost (km)</label>
          <input type="number" id="r_km" step="0.1" min="0" placeholder="npr. 15.5">
        </div>
        <div class="form-group">
          <label>⏱️ Trajanje (minute)</label>
          <input type="number" id="r_min" step="1" min="0" placeholder="npr. 45">
        </div>
        <div class="form-group">
          <label>⚡ Prosječna brzina (km/h)</label>
          <input type="number" id="r_avg" step="0.1" min="0" placeholder="Automatski ili ručno">
        </div>
        <div class="form-group">
          <label>🏁 Max brzina (km/h)</label>
          <input type="number" id="r_max" step="0.1" min="0" placeholder="npr. 35.0">
        </div>
        <div class="form-group">
          <label>🔥 Kalorije (kcal)</label>
          <input type="number" id="r_cal" step="1" min="0" placeholder="Automatski ili ručno">
        </div>
        <div class="form-group">
          <label>🚲 Vrsta vožnje</label>
          <select id="r_cat">${CATEGORIES.map(c=>`<option value="${c.value}">${c.label}</option>`).join('')}</select>
        </div>
        <div class="form-group full">
          <label>📍 Ruta / Lokacija</label>
          <input type="text" id="r_route" placeholder="npr. Zagreb — Samobor — Zagreb">
        </div>
        <div class="form-group full">
          <label>📝 Bilješke</label>
          <textarea id="r_notes" rows="3" placeholder="Kako je bilo? Vrijeme, osjećaj, problemi..."></textarea>
        </div>
      </div>
      <div class="actions" style="margin-top:18px">
        <button class="btn btn-green" onclick="saveRide()">💾 Spremi vožnju</button>
        <button class="btn btn-blue btn-sm" onclick="autoCalc()">🔄 Izračunaj automatski</button>
      </div>
    </div>`;
}

function autoCalc(){
  const km=parseFloat($('r_km').value)||0;
  const mins=parseFloat($('r_min').value)||0;
  if(km>0&&mins>0){
    const avg=km/(mins/60);
    $('r_avg').value=avg.toFixed(1);
    const cal=calcCal(km,mins,DATA.profile.weight_kg);
    $('r_cal').value=cal;
  }else{alert('Upiši udaljenost i trajanje za automatski izračun.')}
}

function saveRide(){
  const km=parseFloat($('r_km').value);
  const mins=parseFloat($('r_min').value);
  if(!km||km<=0){alert('Upiši udaljenost!');return}
  if(!mins||mins<=0){alert('Upiši trajanje!');return}
  const date=$('r_date').value+' '+$('r_time').value;
  let avg=parseFloat($('r_avg').value);if(!avg)avg=km/(mins/60);
  let maxS=parseFloat($('r_max').value)||avg;
  let cal=parseInt($('r_cal').value);if(!cal)cal=calcCal(km,mins,DATA.profile.weight_kg);

  DATA.rides.unshift({
    date,distance_km:Math.round(km*100)/100,duration_sec:Math.round(mins*60),
    avg_speed:Math.round(avg*10)/10,max_speed:Math.round(maxS*10)/10,
    calories:cal,category:$('r_cat').value,
    route:$('r_route').value.trim(),notes:$('r_notes').value.trim()
  });
  save();
  alert(`🏁 Vožnja spremljena!\n\n🛣️ ${km} km\n⏱️ ${fmt(mins*60)}\n⚡ ${avg.toFixed(1)} km/h\n🔥 ${cal} kcal`);
  activeTab=0;buildNav();showDashboard();
}

// ── Povijest ──
function showHistory(){
  const m=$('main'),r=DATA.rides;
  m.innerHTML=`
    <div class="page-title">📜 Povijest vožnji</div>
    <div class="page-sub">${r.length} vožnji ukupno</div>
    ${r.length===0?'<div class="card"><div class="empty">Nema spremljenih vožnji.</div></div>':
    `<div class="card" style="overflow-x:auto">
      <table>
        <tr><th>Datum</th><th>Km</th><th>Vrijeme</th><th>Prosj.</th><th>Max</th><th>Kcal</th><th>Ruta</th><th></th></tr>
        ${r.map((x,i)=>`<tr>
          <td>${x.date}</td><td>${x.distance_km.toFixed(1)}</td><td>${fmt(x.duration_sec)}</td>
          <td>${x.avg_speed} km/h</td><td>${x.max_speed} km/h</td><td>${x.calories}</td>
          <td style="color:var(--text2);font-size:.85rem">${x.route||'—'}</td>
          <td><button class="btn btn-red btn-sm" onclick="delRide(${i})">🗑️</button></td>
        </tr>`).join('')}
      </table>
    </div>
    <div class="actions"><button class="btn btn-blue btn-sm" onclick="exportCSV()">📥 Izvezi CSV</button></div>`}`;
}
function delRide(i){if(confirm('Obrisati ovu vožnju?')){DATA.rides.splice(i,1);save();showHistory()}}
function exportCSV(){
  let csv='Datum,Km,Vrijeme_sec,Prosj_kmh,Max_kmh,Kalorije,Ruta\n';
  DATA.rides.forEach(r=>{csv+=`${r.date},${r.distance_km},${r.duration_sec},${r.avg_speed},${r.max_speed},${r.calories},"${r.route||''}"\n`});
  const blob=new Blob([csv],{type:'text/csv'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='bicikl_voznje.csv';a.click();
}

// ── Statistike ──
function showStats(){
  const m=$('main'),r=DATA.rides;
  if(!r.length){m.innerHTML='<div class="page-title">📈 Statistike</div><div class="card"><div class="empty">Nema podataka.</div></div>';return}
  const totalKm=r.reduce((a,x)=>a+x.distance_km,0);
  const totalCal=r.reduce((a,x)=>a+x.calories,0);
  const totalSec=r.reduce((a,x)=>a+x.duration_sec,0);
  const bestKm=Math.max(...r.map(x=>x.distance_km));
  const bestSpd=Math.max(...r.map(x=>x.max_speed));
  const longest=Math.max(...r.map(x=>x.duration_sec));

  const last10=[...r].slice(0,10).reverse();
  const maxBar=Math.max(...last10.map(x=>x.distance_km),1);

  m.innerHTML=`
    <div class="page-title">📈 Statistike</div>
    <div class="page-sub">Sveukupni pregled</div>
    <div class="card">
      <div class="stat-row">
        ${statBox('🛣️',totalKm.toFixed(1),'Ukupno km','var(--accent)')}
        ${statBox('🔥',Math.round(totalCal),'Ukupno kcal','var(--warn)')}
        ${statBox('⏱️',fmt(totalSec),'Ukupno vrijeme','var(--info)')}
        ${statBox('📏',(totalKm/r.length).toFixed(1)+'km','Prosj. udaljenost','var(--accent)')}
        ${statBox('🏆',bestKm.toFixed(1)+'km','Najdulja vožnja','var(--warn)')}
        ${statBox('🏁',bestSpd.toFixed(1),'Max brzina km/h','var(--danger)')}
        ${statBox('⏰',fmt(longest),'Najduže vrijeme','var(--info)')}
        ${statBox('📊',r.length,'Broj vožnji','var(--accent)')}
        ${statBox('🔥',Math.round(totalCal/r.length),'Prosj. kcal','var(--warn)')}
      </div>
    </div>
    <div class="card">
      <h3 style="margin-bottom:8px">📊 Zadnjih ${last10.length} vožnji (km)</h3>
      <div class="bar-chart">
        ${last10.map(x=>{
          const pct=Math.max((x.distance_km/maxBar)*100,3);
          return `<div class="bar-col"><div class="bar-val">${x.distance_km.toFixed(1)}</div><div class="bar" style="height:${pct}%"></div><div class="bar-lbl">${x.date.slice(5,10)}</div></div>`;
        }).join('')}
      </div>
    </div>`;
}

// ── Profil ──
function showProfile(){
  const m=$('main'),p=DATA.profile,g=DATA.goals;
  m.innerHTML=`
    <div class="page-title">👤 Profil</div>
    <div class="page-sub">Tvoji podaci i ciljevi</div>
    <div class="card">
      <div class="form-grid">
        <div class="form-group"><label>Ime</label><input id="p_name" value="${p.name}"></div>
        <div class="form-group"><label>Težina (kg)</label><input type="number" id="p_weight" value="${p.weight_kg}"></div>
        <div class="form-group full"><label>Bicikl</label><input id="p_bike" value="${p.bike}"></div>
      </div>
      <h3 style="margin:18px 0 10px">🎯 Tjedni ciljevi</h3>
      <div class="form-grid">
        <div class="form-group"><label>Km/tjedan</label><input type="number" id="g_km" value="${g.weekly_km}"></div>
        <div class="form-group"><label>Kalorije/tjedan</label><input type="number" id="g_cal" value="${g.weekly_cal}"></div>
      </div>
      <div class="actions" style="margin-top:16px">
        <button class="btn btn-green" onclick="saveProfile()">💾 Spremi</button>
      </div>
    </div>`;
}
function saveProfile(){
  DATA.profile.name=$('p_name').value.trim()||'Biciklist';
  DATA.profile.weight_kg=parseFloat($('p_weight').value)||75;
  DATA.profile.bike=$('p_bike').value.trim()||'Gradski';
  DATA.goals.weekly_km=parseFloat($('g_km').value)||50;
  DATA.goals.weekly_cal=parseFloat($('g_cal').value)||2000;
  save();alert('✅ Profil spremljen!');
}

// ── Init ──
buildNav();showDashboard();