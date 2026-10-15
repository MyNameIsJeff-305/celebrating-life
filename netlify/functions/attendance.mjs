import {db} from '../lib/db.mjs';
import {json,sameOrigin,authenticated,readBody,uuid} from '../lib/core.mjs';
export default async req=>{
 if(req.method!=='POST')return json({ok:false},405);
 if(!sameOrigin(req)||!authenticated(req))return json({ok:false},403);
 let body;try{body=await readBody(req);if(!uuid.test(body.id))throw new Error();}catch{return json({ok:false},400);}
 try{const rows=await db().sql`UPDATE attendees SET arrived_at=COALESCE(arrived_at,now()) WHERE id=${body.id} RETURNING arrived_at`;return json({ok:!!rows.length},rows.length?200:404);}catch{return json({ok:false},503);}
};
export const config={path:'/api/attendance'};
