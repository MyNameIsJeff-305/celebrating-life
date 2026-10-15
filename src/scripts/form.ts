export {};
const form=document.querySelector<HTMLFormElement>('#intake');
if(form){
 const kind=form.dataset.kind||'contact';
 const spanish=form.dataset.lang==='es';
 const status=document.getElementById('form-status')!;
 const button=form.querySelector<HTMLButtonElement>('button[type=submit]')!;
 let id=crypto.randomUUID(),started=false;
 const field=(name:string)=>form.elements.namedItem(name) as HTMLInputElement;
 function requirements(){
  if(kind!=='contact'){
   field('email').setCustomValidity(field('updatesPermission').checked&&!field('phone').value.trim()&&!field('email').value.trim()?(spanish?'Indica un teléfono o correo para recibir novedades.':'Provide a phone number or email to receive updates.'):'');return;
  }
  const prayer=field('intent').value==='prayer';
  field('name').required=!prayer||field('contactPermission').checked;
  field('contactPermission').required=!prayer;
  field('message').required=prayer;
  const needsContact=!prayer||field('contactPermission').checked||field('updatesPermission').checked;
  field('email').setCustomValidity(needsContact&&!field('phone').value.trim()&&!field('email').value.trim()?(spanish?'Indica un teléfono o correo para que podamos contactarte.':'Provide a phone number or email so we can contact you.'):'');
 }
 form.addEventListener('input',requirements);form.addEventListener('change',requirements);requirements();
 form.addEventListener('input',()=>{if(!started){window.clTrack?.('form_start');started=true;}});
 form.addEventListener('submit',async e=>{
  e.preventDefault();if(button.disabled)return;
  const fields=new FormData(form),payload:Record<string,unknown>={id,kind,lang:form.dataset.lang};
  for(const [key,value] of fields)payload[key]=value;
  payload.contactPermission=fields.has('contactPermission');payload.updatesPermission=fields.has('updatesPermission');
  const text=button.textContent;button.disabled=true;button.textContent=form.dataset.saving||'';status.textContent='';
  try{
   const res=await fetch('/api/submit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
   const data=await res.json();
   if(!res.ok||!data.ok)throw new Error(res.status===400?'validation':res.status===429?'rate':'save');
   // Emit only after durable server confirmation; a reload never replays this event.
   if(data.created)window.clTrack?.(kind==='contact'?'generate_lead':'event_registration');
   form.hidden=true;
   const panel=document.getElementById('form-success')!;panel.hidden=false;
   if(kind==='attendee'){const code=document.getElementById('registration-code')!;code.hidden=false;code.textContent=data.code;}
   panel.focus();form.reset();id=crypto.randomUUID();
  }catch(err){status.textContent=err instanceof Error&&err.message==='validation'?form.dataset.validation!:err instanceof Error&&err.message==='rate'?form.dataset.rate!:form.dataset.error!;}
  finally{button.disabled=false;button.textContent=text;}
 });
}
