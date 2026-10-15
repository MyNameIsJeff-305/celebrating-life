import {json,sameOrigin,readBody,env,equal,sign,makeCookie,authenticated} from '../lib/core.mjs';
export default async req=>{
 if(req.method==='GET')return json({ok:authenticated(req)},authenticated(req)?200:401);
 if(!sameOrigin(req))return json({ok:false},403);
 if(req.method==='DELETE')return json({ok:true},200,{'Set-Cookie':makeCookie(req,'cl_admin','',0)});
 if(req.method!=='POST')return json({ok:false},405);
 const password=env('ADMIN_PASSWORD'),secret=env('SESSION_SECRET');
 if(password.length<20||secret.length<32)return json({ok:false},503);
 let body;try{body=await readBody(req);}catch{return json({ok:false},400);}
 if(typeof body.password!=='string'||!equal(body.password,password))return json({ok:false},401);
 const token=sign({type:'admin',exp:Date.now()+8*3600000},secret);
 return json({ok:true},200,{'Set-Cookie':makeCookie(req,'cl_admin',token,8*3600)});
};
export const config={path:'/api/auth',rateLimit:{action:'rate_limit',aggregateBy:'ip',windowSize:60,windowLimit:15}};
