import { createHmac, timingSafeEqual } from 'node:crypto';
export const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const env=name=>globalThis.Netlify?.env?.get(name)||process.env[name]||'';
export function json(data,status=200,headers={}){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex',...headers}});}
export function sameOrigin(req){const origin=req.headers.get('origin');return origin===new URL(req.url).origin;}
export function equal(a,b){const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&timingSafeEqual(x,y);}
export function sign(data,secret){const body=Buffer.from(JSON.stringify(data)).toString('base64url');return body+'.'+createHmac('sha256',secret).update(body).digest('base64url');}
export function verify(token,secret,type){
 if(!secret||secret.length<32||typeof token!=='string')return null;
 const [body,signature,...extra]=token.split('.');if(!body||!signature||extra.length)return null;
 if(!equal(createHmac('sha256',secret).update(body).digest('base64url'),signature))return null;
 try{const data=JSON.parse(Buffer.from(body,'base64url').toString());return data.type===type&&data.exp>Date.now()?data:null;}catch{return null;}
}
export function cookie(req,name){return (req.headers.get('cookie')||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(name+'='))?.slice(name.length+1)||'';}
export function makeCookie(req,name,value,age){return `${name}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${age}${new URL(req.url).protocol==='https:'?'; Secure':''}`;}
export function authenticated(req){return !!verify(cookie(req,'cl_admin'),env('SESSION_SECRET'),'admin');}
export function visitId(req){const v=verify(cookie(req,'cl_visit'),env('SESSION_SECRET'),'visit');return v&&uuid.test(v.id)?v.id:null;}
export async function readBody(req){if(!req.headers.get('content-type')?.includes('application/json'))throw new Error('invalid');const raw=await req.text();if(Buffer.byteLength(raw)>16000)throw new Error('invalid');return JSON.parse(raw);}
function field(body,key,max){const v=body[key]??'';if(typeof v!=='string'||v.length>max)throw new Error('invalid');return v.trim();}
export function validate(body){
 if(!body||typeof body!=='object'||!uuid.test(body.id)||!['contact','attendee'].includes(body.kind)||!['es','en'].includes(body.lang))throw new Error('invalid');
 const name=field(body,'name',120),phone=field(body,'phone',40),email=field(body,'email',254),message=field(body,'message',2000),age=field(body,'age',20);
 if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new Error('invalid');
 if(phone&&!/^[+()\d\s.-]{7,40}$/.test(phone))throw new Error('invalid');
 if(body.updatesPermission===true&&!(email||phone))throw new Error('invalid');
 if(body.kind==='attendee'&&(!name||!['','under13','13–17','18–24','25–34','35–44','45+'].includes(age)))throw new Error('invalid');
 if(body.kind==='contact'){
  if(!['prayer','faith','contact','visit'].includes(body.intent))throw new Error('invalid');
  if(body.intent==='prayer'&&!message)throw new Error('invalid');
  if((body.intent!=='prayer'||body.contactPermission===true)&&(!name||!(email||phone)||body.contactPermission!==true))throw new Error('invalid');
 }
 return {id:body.id,kind:body.kind,lang:body.lang,name,phone,email,message,age,intent:body.intent,contactPermission:body.contactPermission===true,updatesPermission:body.updatesPermission===true};
}
export function csvCell(value){let s=String(value??'');if(/^[\s]*[=+@\-]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';}
