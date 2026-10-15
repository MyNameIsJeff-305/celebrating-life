import {db} from '../lib/db.mjs';
import {json,authenticated,csvCell} from '../lib/core.mjs';
export default async req=>{
 if(req.method!=='GET')return json({ok:false},405);
 if(!authenticated(req))return json({ok:false},401);
 const url=new URL(req.url),kind=url.searchParams.get('kind')==='contacts'?'contacts':'attendees';
 const page=Math.max(0,Math.min(100000,Number.parseInt(url.searchParams.get('page')||'0',10)||0));
 const search=(url.searchParams.get('q')||'').trim().slice(0,120),pattern='%'+search.replaceAll('\\','\\\\').replaceAll('%','\\%').replaceAll('_','\\_')+'%';
 try{
  const sql=db().sql,table=sql.identifier(kind);
  if(url.searchParams.get('export')==='csv'){
   const cols=kind==='contacts'?['id','created_at','language','name','phone','email','intent','message','contact_permission','updates_permission','consent_version','visit_id']:['id','code','created_at','arrived_at','language','name','phone','email','age_range','updates_permission','consent_version','visit_id'];
   // Export all rows, independent of UI pagination. Values are CSV-formula escaped.
   const stream=new ReadableStream({async start(controller){const enc=new TextEncoder();try{controller.enqueue(enc.encode('\uFEFF'+cols.map(csvCell).join(',')+'\r\n'));for await(const row of sql`SELECT * FROM ${table} ORDER BY created_at DESC`.stream())controller.enqueue(enc.encode(cols.map(c=>csvCell(row[c] instanceof Date?row[c].toISOString():row[c])).join(',')+'\r\n'));controller.close();}catch(e){controller.error(e);}}});
   return new Response(stream,{headers:{'Content-Type':'text/csv;charset=utf-8','Content-Disposition':`attachment; filename="celebrating-life-${kind}.csv"`,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
  }
  const stats=(await sql`SELECT
    (SELECT count(*)::int FROM qr_visits) AS qr,
    (SELECT count(*)::int FROM contacts) AS contacts,
    (SELECT count(*)::int FROM attendees) AS registrations,
    (SELECT count(*)::int FROM attendees WHERE arrived_at IS NOT NULL) AS arrivals,
    (SELECT count(DISTINCT visit_id)::int FROM contacts WHERE visit_id IS NOT NULL) AS converted_visits,
    (SELECT count(*)::int FROM contacts WHERE visit_id IS NOT NULL) AS qr_contacts,
    (SELECT count(*)::int FROM attendees WHERE arrived_at IS NOT NULL AND visit_id IS NOT NULL AND EXISTS(SELECT 1 FROM contacts c WHERE c.visit_id=attendees.visit_id)) AS attributed_arrivals`)[0];
  const language=await sql`SELECT language,count(*)::int AS total FROM qr_visits GROUP BY language`;
  const ages=await sql`SELECT age_range,count(*)::int AS total FROM attendees GROUP BY age_range ORDER BY age_range`;
  const clause=kind==='attendees'?sql`name ILIKE ${pattern} OR phone ILIKE ${pattern} OR email ILIKE ${pattern} OR code ILIKE ${pattern}`:sql`name ILIKE ${pattern} OR phone ILIKE ${pattern} OR email ILIKE ${pattern}`;
  const rows=await sql`SELECT * FROM ${table} WHERE (${clause}) ORDER BY created_at DESC,id LIMIT 50 OFFSET ${page*50}`;
  const total=(await sql`SELECT count(*)::int AS total FROM ${table} WHERE (${clause})`)[0].total;
  return json({ok:true,stats,language,ages,rows,total,page});
 }catch{console.error('Dashboard query failed');return json({ok:false},503);}
};
export const config={path:'/api/dashboard'};
