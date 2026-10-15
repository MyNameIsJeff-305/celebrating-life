import {db} from '../lib/db.mjs';
import {json,sameOrigin,readBody,validate,visitId} from '../lib/core.mjs';
export default async req=>{
 if(req.method!=='POST')return json({ok:false},405);
 if(!sameOrigin(req))return json({ok:false},403);
 let data;
 try{const body=await readBody(req);if(body.website)return json({ok:false},400);data=validate(body);}catch{return json({ok:false},400);}
 try{
  const sql=db().sql;
  // Only attach a signed visit that still exists; attribution never grants read access.
  const candidate=visitId(req);
  const visit=candidate?(await sql`SELECT id FROM qr_visits WHERE id=${candidate}`)[0]?.id||null:null;
  const d=data;
  if(d.kind==='contact'){
   const rows=await sql`INSERT INTO contacts(id,name,phone,email,intent,message,contact_permission,updates_permission,language,visit_id) VALUES(${d.id},${d.name},${d.phone},${d.email},${d.intent},${d.message},${d.contactPermission},${d.updatesPermission},${d.lang},${visit}) ON CONFLICT(id) DO NOTHING RETURNING id`;
   return json({ok:true,created:rows.length===1},rows.length?201:200);
  }
  const code='CL-'+d.id.toUpperCase();
  const rows=await sql`INSERT INTO attendees(id,code,name,phone,email,age_range,updates_permission,language,visit_id) VALUES(${d.id},${code},${d.name},${d.phone},${d.email},${d.age},${d.updatesPermission},${d.lang},${visit}) ON CONFLICT(id) DO NOTHING RETURNING id`;
  return json({ok:true,created:rows.length===1,code},rows.length?201:200);
 }catch{console.error('Intake persistence failed');return json({ok:false},503);}
};
export const config={path:'/api/submit',rateLimit:{action:'rate_limit',aggregateBy:'ip',windowSize:60,windowLimit:40}};
