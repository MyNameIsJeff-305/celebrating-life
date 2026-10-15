import {randomUUID} from 'node:crypto';
import {db} from '../lib/db.mjs';
import {env,sign,makeCookie} from '../lib/core.mjs';
export default async(req,context)=>{
 const lang=context.params.lang;
 if(!['es','en'].includes(lang))return new Response('Not found',{status:404});
 const headers={'Location':`/${lang}/hope/?utm_source=water_bottle&utm_medium=qr&utm_campaign=celebrating_life_2026&utm_content=${lang}`,'Cache-Control':'no-store','X-Robots-Tag':'noindex'};
 if(req.method==='HEAD'||/prefetch|prerender/i.test(req.headers.get('purpose')||req.headers.get('sec-purpose')||'')||/bot|crawler|spider|preview/i.test(req.headers.get('user-agent')||''))return new Response(null,{status:302,headers});
 try{
  const secret=env('SESSION_SECRET');if(secret.length<32)throw new Error('configuration');
  const id=randomUUID();await db().sql`INSERT INTO qr_visits(id,language) VALUES(${id},${lang})`;
  headers['Set-Cookie']=makeCookie(req,'cl_visit',sign({type:'visit',id,exp:Date.now()+30*86400000},secret),30*86400);
 }catch{console.error('QR attribution unavailable');}
 // Message remains accessible even if measurement is temporarily unavailable.
 return new Response(null,{status:302,headers});
};
export const config={path:'/q/:lang',method:['GET','HEAD'],rateLimit:{action:'rate_limit',aggregateBy:'ip',windowSize:60,windowLimit:120}};
