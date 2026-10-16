export {};
const root=document.getElementById('admin');
if(root){
 const es=root.dataset.lang==='es',el=(id:string)=>document.getElementById(id)!;
 const login=el('admin-login') as HTMLFormElement,status=el('admin-status'),panel=el('admin-data');
 let kind='attendees',page=0,total=0,requestSequence=0;
 const labels=es?{error:'No se pudo completar la operación. Revisa tu conexión o inicia sesión de nuevo.',auth:'Contraseña incorrecta, demasiados intentos o acceso todavía sin configurar.',empty:'No hay registros.',name:'Nombre',contact:'Contacto',detail:'Detalles',source:'Origen',date:'Fecha',arrival:'Llegada',anonymous:'Anónimo',direct:'Directo',arrive:'Confirmar llegada',arrived:'Llegada confirmada',yes:'Sí',no:'No',updates:'Novedades',reply:'Respuesta autorizada'}:{error:'Unable to complete the operation. Check your connection or sign in again.',auth:'Incorrect password, too many attempts, or access is not configured yet.',empty:'No records found.',name:'Name',contact:'Contact',detail:'Details',source:'Source',date:'Date',arrival:'Arrival',anonymous:'Anonymous',direct:'Direct',arrive:'Confirm arrival',arrived:'Arrival confirmed',yes:'Yes',no:'No',updates:'Updates',reply:'Reply authorized'};
 const intent:Record<string,string>=es?{prayer:'Oración',faith:'Conocer a Jesús',contact:'Contacto',visit:'Visitar la iglesia'}:{prayer:'Prayer',faith:'Learn about Jesus',contact:'Contact',visit:'Visit church'};
 const date=(v:string)=>v?new Intl.DateTimeFormat(es?'es-US':'en-US',{dateStyle:'short',timeStyle:'short',timeZone:'America/New_York'}).format(new Date(v)):'—';
 function safeCell(row:HTMLTableRowElement,text:string){const cell=document.createElement('td');cell.textContent=text;row.append(cell);return cell;}
 async function load(){const sequence=++requestSequence;status.textContent='';try{
  const query=(el('search') as HTMLInputElement).value;
  const res=await fetch(`/api/dashboard?${new URLSearchParams({kind,page:String(page),q:query})}`);
  if(sequence!==requestSequence)return;
  if(res.status===401){panel.hidden=true;login.hidden=false;return;}
  if(!res.ok)throw new Error();const data=await res.json();
  if(sequence!==requestSequence)return;
  login.hidden=true;panel.hidden=false;total=data.total;
  for(const key of ['qr','contacts','registrations','arrivals'])el(`metric-${key}`).textContent=data.stats[key];
  const conversion=data.stats.qr?((data.stats.converted_visits/data.stats.qr)*100).toFixed(1):'0';
  const langs=data.language.map((r:{language:string,total:number})=>`${r.language.toUpperCase()}: ${r.total}`).join(' · ');
  el('funnel').textContent=es?`Conversión de QR a contacto: ${conversion}% (${data.stats.converted_visits} aperturas con solicitud / ${data.stats.qr} aperturas). Solicitudes desde QR: ${data.stats.qr_contacts}. Llegadas desde navegadores con contacto previo: ${data.stats.attributed_arrivals}. ${langs}`:`QR-to-contact conversion: ${conversion}% (${data.stats.converted_visits} openings with a request / ${data.stats.qr} openings). Requests from QR: ${data.stats.qr_contacts}. Arrivals from browsers with a prior contact: ${data.stats.attributed_arrivals}. ${langs}`;
  el('age-summary').textContent=(es?'Edades de registrados: ':'Registered age ranges: ')+data.ages.map((r:{age_range:string,total:number})=>`${r.age_range==='under13'?(es?'Menos de 13':'Under 13'):r.age_range||(es?'Sin especificar':'Unspecified')}: ${r.total}`).join(' · ');
  el('table-head').replaceChildren();const hr=document.createElement('tr');for(const text of [labels.name,labels.contact,labels.detail,labels.source,labels.date,...(kind==='attendees'?[labels.arrival]:[])]){const th=document.createElement('th');th.scope='col';th.textContent=text;hr.append(th);}el('table-head').append(hr);
  el('table-body').replaceChildren();
  for(const r of data.rows){const tr=document.createElement('tr');safeCell(tr,r.name||labels.anonymous);safeCell(tr,[r.phone,r.email].filter(Boolean).join('\n')||'—');
   safeCell(tr,kind==='contacts'?`${intent[r.intent]}\n${r.message}\n${labels.reply}: ${r.contact_permission?labels.yes:labels.no}\n${labels.updates}: ${r.updates_permission?labels.yes:labels.no}`:`${r.code}\n${r.age_range||'—'}\n${labels.updates}: ${r.updates_permission?labels.yes:labels.no}`);
   safeCell(tr,`${r.visit_id?'QR':labels.direct} · ${r.language.toUpperCase()}`);safeCell(tr,date(r.created_at));
   if(kind==='attendees'){const td=safeCell(tr,r.arrived_at?date(r.arrived_at):'');if(!r.arrived_at){const b=document.createElement('button');b.className='button secondary small';b.textContent=labels.arrive;b.addEventListener('click',async()=>{b.disabled=true;try{const res=await fetch('/api/attendance',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:r.id})});if(!res.ok)throw new Error();await load();}catch{status.textContent=labels.error;b.disabled=false;}});td.append(b);}}
   el('table-body').append(tr);
  }
  if(!data.rows.length){const tr=document.createElement('tr');safeCell(tr,labels.empty);el('table-body').append(tr);}
  el('page-info').textContent=`${page+1} / ${Math.max(1,Math.ceil(total/50))} · ${total}`;
  (el('previous') as HTMLButtonElement).disabled=page===0;(el('next') as HTMLButtonElement).disabled=(page+1)*50>=total;
  (el('export') as HTMLAnchorElement).href=`/api/dashboard?kind=${kind}&export=csv`;
 }catch{status.textContent=labels.error;}}
 login.addEventListener('submit',async e=>{e.preventDefault();const button=login.querySelector('button')!;button.disabled=true;try{const password=new FormData(login).get('password');const res=await fetch('/api/auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password})});if(!res.ok)throw new Error();login.reset();await load();}catch{status.textContent=labels.auth;}finally{button.disabled=false;}});
 el('logout').addEventListener('click',async()=>{try{const res=await fetch('/api/auth',{method:'DELETE'});if(!res.ok)throw new Error();panel.hidden=true;login.hidden=false;el('table-body').replaceChildren();}catch{status.textContent=labels.error;}});
 el('refresh').addEventListener('click',load);
 el('search-form').addEventListener('submit',e=>{e.preventDefault();page=0;load();});
 root.querySelectorAll<HTMLButtonElement>('[data-kind]').forEach(button=>button.addEventListener('click',()=>{kind=button.dataset.kind!;page=0;(el('search') as HTMLInputElement).value='';root.querySelectorAll('[data-kind]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));load();}));
 el('previous').addEventListener('click',()=>{if(page>0){page--;load();}});el('next').addEventListener('click',()=>{if((page+1)*50<total){page++;load();}});
 load();
}
