import {test,before,after,mock} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';
import {getDatabase} from '@netlify/database';
import {sign,verify,csvCell,validate} from '../netlify/lib/core.mjs';

const database=new PGlite();
const nativeSql=getDatabase({connectionString:'postgres://test:test@127.0.0.1:1/test'}).sql;
const sql=(strings,...values)=>{
 const template=nativeSql(strings,...values);
 async function execute(){const q=template.toSQL();return (await database.query(q.sql,q.params)).rows;}
 return new Proxy(template,{get(target,key,receiver){if(key==='then')return (resolve,reject)=>execute().then(resolve,reject);if(key==='stream')return async function*(){for(const row of await execute())yield row;};return Reflect.get(target,key,receiver);}});
};
sql.identifier=nativeSql.identifier;
mock.module('../netlify/lib/db.mjs',{namedExports:{db:()=>({sql})}});
const {default:submit}=await import('../netlify/functions/submit.mjs');
const {default:auth}=await import('../netlify/functions/auth.mjs');
const {default:dashboard}=await import('../netlify/functions/dashboard.mjs');
const {default:attendance}=await import('../netlify/functions/attendance.mjs');
const {default:qr}=await import('../netlify/functions/qr.mjs');
process.env.ADMIN_PASSWORD='test-only-password-not-for-production';
process.env.SESSION_SECRET='test-only-session-secret-not-for-production';
const origin='https://celebratinglife.betesdachurchmiami.com';
function req(path,body,cookie='',method='POST'){return new Request(origin+path,{method,headers:{'Content-Type':'application/json',Origin:origin,Cookie:cookie},...(body?{body:JSON.stringify(body)}:{})});}
before(async()=>{await database.exec(await readFile(new URL('../netlify/database/migrations/20261015190000_initial.sql',import.meta.url),'utf8'));});
after(async()=>{await database.close();});

test('untrusted requests cannot read contacts or confirm attendance',async()=>{
 assert.equal((await dashboard(new Request(origin+'/api/dashboard'))).status,401);
 assert.equal((await attendance(req('/api/attendance',{id:randomUUID()}))).status,403);
 const unsafe=new Request(origin+'/api/submit',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://other.example'},body:'{}'});
 assert.equal((await submit(unsafe)).status,403);
});
test('anonymous prayer and individual registration remain distinct, retries are idempotent',async()=>{
 const p={id:randomUUID(),kind:'contact',lang:'es',intent:'prayer',message:'Test request'};
 assert.equal((await submit(req('/api/submit',p))).status,201);
 assert.equal((await (await submit(req('/api/submit',p))).json()).created,false);
 const a={id:randomUUID(),kind:'attendee',lang:'en',name:'Test person',age:'18–24'};
 assert.equal((await submit(req('/api/submit',a))).status,201);
 assert.equal((await (await submit(req('/api/submit',{...a,name:'Overwrite attempt'}))).json()).created,false);
 const rows=(await database.query('SELECT * FROM attendees WHERE id=$1',[a.id])).rows;
 assert.equal(rows.length,1);assert.equal(rows[0].name,'Test person');assert.equal(rows[0].arrived_at,null);
});
test('contact requests require permission and a usable contact method; malformed data rejected',async()=>{
 for(const data of [{intent:'contact',name:'Test'}, {intent:'prayer',message:''}, {intent:'faith',name:'Test',email:'bad',contactPermission:true}]){
  assert.equal((await submit(req('/api/submit',{id:randomUUID(),kind:'contact',lang:'en',...data}))).status,400);
 }
 assert.throws(()=>validate({id:randomUUID(),kind:'attendee',lang:'es',name:'Name',age:'999'}));
});
test('signed QR attribution, authenticated dashboard, pagination, export and arrival confirmation',async()=>{
 const redirect=await qr(new Request(origin+'/q/es'),{params:{lang:'es'}});
 assert.equal(redirect.status,302);assert.match(redirect.headers.get('location'),/utm_source=water_bottle/);
 const visitCookie=redirect.headers.get('set-cookie').split(';')[0];
 const contact={id:randomUUID(),kind:'contact',lang:'es',intent:'contact',name:'=danger',email:'test@example.test',contactPermission:true};
 await submit(req('/api/submit',contact,visitCookie));
 const a={id:randomUUID(),kind:'attendee',lang:'es',name:'Test arrival'};
 await submit(req('/api/submit',a,visitCookie));
 const denied=await auth(req('/api/auth',{password:'wrong'}));assert.equal(denied.status,401);
 const session=await auth(req('/api/auth',{password:process.env.ADMIN_PASSWORD}));assert.equal(session.status,200);
 const adminCookie=session.headers.get('set-cookie').split(';')[0];
 assert.match(session.headers.get('set-cookie'),/HttpOnly; SameSite=Strict/);
 assert.equal((await attendance(req('/api/attendance',{id:a.id},adminCookie))).status,200);
 const first=(await database.query('SELECT arrived_at FROM attendees WHERE id=$1',[a.id])).rows[0].arrived_at;
 await attendance(req('/api/attendance',{id:a.id},adminCookie));
 assert.deepEqual((await database.query('SELECT arrived_at FROM attendees WHERE id=$1',[a.id])).rows[0].arrived_at,first);
 const response=await dashboard(req('/api/dashboard?kind=attendees&q=Test',null,adminCookie,'GET'));assert.equal(response.status,200);
 const data=await response.json();assert.equal(data.stats.qr,1);assert.equal(data.stats.converted_visits,1);assert.equal(data.stats.attributed_arrivals,1);assert.equal(data.rows.length,2);
 const empty=await (await dashboard(req('/api/dashboard?page=1',null,adminCookie,'GET'))).json();assert.equal(empty.rows.length,0);
 const csv=await (await dashboard(req('/api/dashboard?kind=contacts&export=csv',null,adminCookie,'GET'))).text();assert.match(csv,/'=danger/);
 assert.equal((await auth(req('/api/auth',null,adminCookie,'DELETE'))).status,200);
});
test('tampered or expired credentials rejected and CSV formulas neutralized',()=>{
 const secret=process.env.SESSION_SECRET;
 const token=sign({type:'admin',exp:Date.now()+10000},secret);
 assert.ok(verify(token,secret,'admin'));assert.equal(verify(token+'x',secret,'admin'),null);
 assert.equal(verify(sign({type:'admin',exp:0},secret),secret,'admin'),null);
 assert.equal(verify(token,secret,'visit'),null);assert.equal(csvCell('+SUM(A1)'),"\"'+SUM(A1)\"");
});
