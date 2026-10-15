export {};
declare global {interface Window {dataLayer: unknown[];gtag?: (...args: unknown[])=>void;clTrack?: (event:string)=>void;}}
const key='cl-analytics-consent';
const ga=document.body.dataset.ga||'';
const banner=document.getElementById('consent');
let enabled=false;
const params=new URLSearchParams(location.search);
try{if(params.get('utm_source')==='water_bottle'&&params.get('utm_campaign')==='celebrating_life_2026')sessionStorage.setItem('cl-campaign','bottle');}catch{}
function pageLocation(){let source=false;try{source=sessionStorage.getItem('cl-campaign')==='bottle';}catch{}return location.origin+location.pathname+(source?`?utm_source=water_bottle&utm_medium=qr&utm_campaign=celebrating_life_2026&utm_content=${document.documentElement.lang}`:'');}
function choice(){try{return localStorage.getItem(key);}catch{return null;}}
function launch(){
 if(enabled||!/^G-[A-Z0-9]+$/.test(ga))return;
 enabled=true;window.dataLayer=window.dataLayer||[];
 window.gtag=function(){window.dataLayer.push(arguments);};
 window.gtag('js',new Date());
 // Never send query strings, form values, contact identifiers or request topics.
 window.gtag('config',ga,{send_page_view:false,allow_google_signals:false,allow_ad_personalization_signals:false});
 const script=document.createElement('script');script.async=true;script.src=`https://www.googletagmanager.com/gtag/js?id=${ga}`;document.head.append(script);
 window.gtag('event','page_view',{page_location:pageLocation(),page_title:document.title,page_referrer:'',language:document.documentElement.lang});
}
window.clTrack=(event)=>{
 if(!enabled||choice()!=='yes')return;
 if(!['form_start','generate_lead','event_registration'].includes(event))return;
 window.gtag?.('event',event,{page_location:pageLocation(),language:document.documentElement.lang});
};
function save(value:string){try{localStorage.setItem(key,value);}catch{}if(banner)banner.hidden=true;if(value==='yes')launch();else if(enabled)location.reload();}
if(choice()==='yes')launch();else if(!choice()&&ga&&banner)banner.hidden=false;
document.getElementById('consent-yes')?.addEventListener('click',()=>save('yes'));
document.getElementById('consent-no')?.addEventListener('click',()=>save('no'));
document.getElementById('analytics-settings')?.addEventListener('click',()=>{if(banner)banner.hidden=false;});
