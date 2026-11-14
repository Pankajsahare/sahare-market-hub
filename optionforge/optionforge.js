(function(){
'use strict';
/* ================= CONFIG (मॅन्युअल बदल इथेच) ================= */
var CONFIG={
  NSE_PROXY_URL:"",            // ← येथे बदला: Worker URL; रिकामं = NIFTY/BANKNIFTY SIMULATED
  NSE_MIN_GAP:30000,           // proxy ला 30s पेक्षा जास्त वेळा विनंती नाही
  NSE_CACHE_MS:60000,
  NSE_WEEKLY_DAY:2,            // ← येथे बदला: 0=Sun..6=Sat; weekly expiry दिवस तपासा
  LOTS:{NIFTY:65,BANKNIFTY:30},// ← येथे बदला: NSE ची सध्याची lot size (Jan 2026 पासून 65/30) — पुढच्या revision ला तपासा
  BRAND_LOGO:"",               // ← येथे बदला: logo URL; रिकामं = monogram
  REFRESH:20000,DEMO_TICK:1500,WS_APPLY:500,MAX_LEGS:8,HISTORY:40
};
// v3.2: CDN version साठी — page वर window.OPTIONFORGE_CONFIG={NSE_PROXY_URL:'…'} ठेवलं तर तेच वापरलं जातं
try{if(window.OPTIONFORGE_CONFIG)Object.assign(CONFIG,window.OPTIONFORGE_CONFIG);}catch(e){}
var YEAR=365*24*3600*1000,DERIBIT='https://www.deribit.com/api/v2/public',WS_URL='wss://www.deribit.com/ws/api/v2';
var MF='"JetBrains Mono",ui-monospace,monospace';
var MARKETS={
  BTC:{kind:'crypto',sym:'$',code:'BTC',seed:97150,step:1000,iv:.52,rate:0},
  ETH:{kind:'crypto',sym:'$',code:'ETH',seed:3412,step:50,iv:.62,rate:0},
  NIFTY:{kind:'index',sym:'₹',code:'NIFTY',seed:24800,step:50,iv:.13,rate:.065},
  BANKNIFTY:{kind:'index',sym:'₹',code:'BANKNIFTY',seed:53500,step:100,iv:.15,rate:.065}
};
var MON={JAN:0,FEB:1,MAR:2,APR:3,MAY:4,JUN:5,JUL:6,AUG:7,SEP:8,OCT:9,NOV:10,DEC:11};
var MONN=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
var RM=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
// सर्व आवश्यक nodes — init मध्ये एकदा तपासले जातात (console-only diagnostic)
var NEED=['nav','pill','statusTxt','streamTag','spot','ring','secs','navlinks','bmark','hero','ttrack','banner','bannerTxt',
'quick','qMarket','qExpiry','qPreset','qSide','qDays','qIv','qShock','qDaysV','qIvV','qShockV',
'curSeg','expiry','sideSeg','preset','denSeg','account','lotBox','lot','entryMode','slip','fee','risk',
'selAll','undoBtn','redoBtn','legCount','bulk','bulkCount','legs',
'scenPnl','scenSub','days','daysV','iv','ivV','shock','shockV','range','rangeV','t0','fill','cone','unpinBtn',
'saveName','savedSearch','savedSort','savedList','importFile',
'chartWrap','chartBase','chartOver','chartTip','chartSub','chartSummary',
'mMaxP','mMaxL','mRisk','mBE','mBEnote','mPremK','mPrem','mFees','mRR','mPOP','popBar','mMargin','mNotional','mLot',
'gD','gG','gT','gV','heatWrap','heatCv','heatTip','scaleMin','scaleMax','heatSummary',
'volSeg','volWrap','volCv','volInfo','volSummary','explain','note',
'lab','chain','playbook','faq','tabs','chainMode','winVal','filter','sortBtn','chainInfo','chainWrap','chainTable','chainHead','chainBody','chainEmpty','chainNote',
'scrim','drawer','drawerTitle','drawerClose','drawerBody','toasts','live'];

var roots=document.querySelectorAll('[data-of-root]');
for(var ri=0;ri<roots.length;ri++){try{boot(roots[ri]);}catch(e){if(window.console)console.error('[OptionForge] boot failed:',e);}}

function boot(root){
  if(root.__of&&root.__of.destroy)root.__of.destroy();
  var iid='of'+Math.random().toString(36).slice(2,8);
  var AC=new AbortController(),SIG={signal:AC.signal};
  var dead=false,raf=0,timers=[],obs=[],mq=null,mqHandler=null;
  var portal=null;
  var q=function(n){var s='[data-of="'+n+'"]';return root.querySelector(s)||(portal?portal.querySelector(s):null);};
  Array.prototype.slice.call(root.querySelectorAll('[data-of]')).forEach(function(el){el.id=iid+'-'+el.getAttribute('data-of');});
  var secId=function(k){return iid+'-sec-'+k;};
  ['lab','chain','playbook','faq'].forEach(function(k){var e=q(k);if(e)e.id=secId(k);});
  // v3.2: drawer/toasts body खाली — Elementor motion effects (transform) असले तरी fixed position बरोबर
  portal=document.createElement('div');portal.className='of-root of-portal';
  ['scrim','drawer','toasts'].forEach(function(n){var e=root.querySelector('[data-of="'+n+'"]');if(e)portal.appendChild(e);});
  document.body.appendChild(portal);
  Array.prototype.slice.call(root.querySelectorAll('[data-act="goto"]')).forEach(function(a){a.setAttribute('href','#'+secId(a.getAttribute('data-sec')));});
  var logo=CONFIG.BRAND_LOGO||root.getAttribute('data-brand-logo');
  if(logo&&q('bmark'))q('bmark').innerHTML='<img src="'+logo.replace(/"/g,'')+'" alt="Sahare Financial Services">';
  var missing=NEED.filter(function(n){return !q(n);});
  if(missing.length&&window.console)console.warn('[OptionForge] missing nodes (panels will skip safely):',missing);

  /* ---------- helpers ---------- */
  var clamp=function(v,a,b){return Math.min(b,Math.max(a,v));};
  var esc=function(s){return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});};
  var uid=function(){return Math.random().toString(36).slice(2,9);};
  var num=function(v,d){v=parseFloat(v);return isFinite(v)?v:d;};
  var MK=function(){return MARKETS[S.market];};
  var sym=function(){return MK().sym;};
  var isCoin=function(){return S.denom==='COIN'&&MK().kind==='crypto';};
  var lot=function(){return MK().kind==='index'?S.lot:1;};
  var money=function(v,d){d=d||0;if(!isFinite(v))return v>0?'∞':'-∞';
    return (v<0?'-':'')+sym()+Math.abs(v).toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d});};
  var sign=function(v,d){return !isFinite(v)?(v>0?'+∞':'-∞'):(v>=0?'+':'')+money(v,d);};
  var compact=function(v){if(!isFinite(v))return v>0?'∞':'-∞';var a=Math.abs(v);
    return (v<0?'-':'')+sym()+(a>=1e7?(a/1e7).toFixed(2)+'Cr':a>=1e5?(a/1e5).toFixed(2)+'L':a>=1e3?(a/1e3).toFixed(1)+'k':a.toFixed(0));};
  var kfmt=function(v){return v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'k':String(Math.round(v));};
  var dLeft=function(ms){return Math.max(0,(ms-Date.now())/86400000);};
  var parseExp=function(s){var m=/^(\d{1,2})([A-Z]{3})(\d{2})$/.exec(s);return m?Date.UTC(2000+ +m[3],MON[m[2]],+m[1],8,0,0):null;};
  var fmtExp=function(ms){var d=new Date(ms);return d.getUTCDate()+' '+MONN[d.getUTCMonth()]+' '+String(d.getUTCFullYear()).slice(2);};
  var leftTxt=function(ms){var h=(ms-Date.now())/3600000;if(h<=0)return 'expired';
    if(h<24)return Math.floor(h)+'h '+Math.floor((h%1)*60)+'m';return Math.round(h/24)+'d';};
  var expName=function(ms){var d=new Date(ms);return d.getUTCDate()+Object.keys(MON)[d.getUTCMonth()]+String(d.getUTCFullYear()).slice(2);};
  var later=function(ms,fn){var t=setTimeout(fn,ms);timers.push(t);return t;};
  var every=function(ms,fn){var t=setInterval(fn,ms);timers.push(t);return t;};
  var on=function(el,ev,fn,opt){if(!el)return;el.addEventListener(ev,fn,opt?Object.assign({signal:AC.signal},opt):SIG);};
  var track=function(name,params){try{var p=params||{};
    if(typeof window.gtag==='function')window.gtag('event',name,p);
    else if(window.dataLayer&&window.dataLayer.push)window.dataLayer.push(Object.assign({event:'optionforge_'+name},p));
    if(window._paq&&window._paq.push)window._paq.push(['trackEvent','OptionForge',name,p.market||S.market]);
    root.dispatchEvent(new CustomEvent('optionforge:'+name,{detail:p,bubbles:true}));}catch(e){}};
  // प्रत्येक render स्वतंत्र — एक बिघडला तरी बाकी चालू (v3.1 चा मुख्य fix)
  var faults={};
  var safe=function(label,fn){try{fn();delete faults[label];}catch(e){faults[label]=1;if(window.console)console.error('[OptionForge] '+label+' render failed:',e);}};

  /* ---------- Black-76 ---------- */
  function ncdf(x){var t=1/(1+0.2316419*Math.abs(x)),d=0.3989422804014327*Math.exp(-x*x/2);
    var p=d*t*(0.319381530+t*(-0.356563782+t*(1.781477937+t*(-1.821255978+t*1.330274429))));return x>=0?1-p:p;}
  var npdf=function(x){return 0.3989422804014327*Math.exp(-x*x/2);};
  function bs(Sp,K,T,sg,type,r){
    var intr=type==='C'?Math.max(Sp-K,0):Math.max(K-Sp,0);
    if(Sp<=0||T<=1e-9||sg<=0.005)return{price:intr,delta:type==='C'?(Sp>K?1:0):(Sp<K?-1:0),gamma:0,theta:0,vega:0};
    var F=Sp*Math.exp(r*T),df=Math.exp(-r*T),sq=sg*Math.sqrt(T);
    var d1=(Math.log(F/K)+sg*sg*T/2)/sq,d2=d1-sq;
    var price=type==='C'?df*(F*ncdf(d1)-K*ncdf(d2)):df*(K*ncdf(-d2)-F*ncdf(-d1));
    var th=-Sp*npdf(d1)*sg/(2*Math.sqrt(T))-(type==='C'?r*K*df*ncdf(d2):-r*K*df*ncdf(-d2));
    return{price:Math.max(price,0),delta:type==='C'?ncdf(d1):ncdf(d1)-1,gamma:npdf(d1)/(Sp*sq),theta:th/365,vega:Sp*npdf(d1)*Math.sqrt(T)*0.01};
  }
  function impliedVol(target,Sp,K,T,type,r){
    var intr=type==='C'?Math.max(Sp-K,0):Math.max(K-Sp,0);
    if(target<=intr+1e-9||T<=0||Sp<=0)return null;
    var sg=0.4,i,v;
    for(i=0;i<8;i++){var o=bs(Sp,K,T,sg,type,r);v=o.price-target;
      if(Math.abs(v)<1e-7)break;var ve=o.vega*100;if(ve<1e-8)break;sg=clamp(sg-v/ve,0.01,4);}
    if(!(sg>0.01&&sg<4)||Math.abs(bs(Sp,K,T,sg,type,r).price-target)>Math.max(0.02,target*0.01)){
      var lo=0.01,hi=4;for(i=0;i<40;i++){var m=(lo+hi)/2;(bs(Sp,K,T,m,type,r).price>target)?hi=m:lo=m;}sg=(lo+hi)/2;}
    return (sg>0.012&&sg<3.9)?sg:null;
  }
  var smile=function(Sp,K,base){var m=Math.log(Math.max(K,1)/Math.max(Sp,1));
    return clamp(base*(1+2.2*m*m)+Math.max(0,-m)*0.3,0.05,2.5);};

  /* ---------- Presets ---------- */
  var PRESETS=[
   {id:'longCall',name:'Long Call',b:function(k,E){return[{t:'C',s:1,q:1,k:k(0),e:E}];}},
   {id:'longPut',name:'Long Put',b:function(k,E){return[{t:'P',s:1,q:1,k:k(0),e:E}];}},
   {id:'bullCall',name:'Bull Call Spread',b:function(k,E){return[{t:'C',s:1,q:1,k:k(-1),e:E},{t:'C',s:-1,q:1,k:k(4),e:E}];}},
   {id:'bearPut',name:'Bear Put Spread',b:function(k,E){return[{t:'P',s:1,q:1,k:k(1),e:E},{t:'P',s:-1,q:1,k:k(-4),e:E}];}},
   {id:'straddle',name:'Long Straddle',b:function(k,E){return[{t:'C',s:1,q:1,k:k(0),e:E},{t:'P',s:1,q:1,k:k(0),e:E}];}},
   {id:'strangle',name:'Long Strangle',b:function(k,E){return[{t:'C',s:1,q:1,k:k(4),e:E},{t:'P',s:1,q:1,k:k(-4),e:E}];}},
   {id:'ironCondor',name:'Iron Condor',b:function(k,E){return[{t:'P',s:1,q:1,k:k(-7),e:E},{t:'P',s:-1,q:1,k:k(-3),e:E},{t:'C',s:-1,q:1,k:k(3),e:E},{t:'C',s:1,q:1,k:k(7),e:E}];}},
   {id:'ironFly',name:'Iron Butterfly',b:function(k,E){return[{t:'P',s:1,q:1,k:k(-5),e:E},{t:'P',s:-1,q:1,k:k(0),e:E},{t:'C',s:-1,q:1,k:k(0),e:E},{t:'C',s:1,q:1,k:k(5),e:E}];}},
   {id:'butterfly',name:'Call Butterfly',b:function(k,E){return[{t:'C',s:1,q:1,k:k(-4),e:E},{t:'C',s:-1,q:2,k:k(0),e:E},{t:'C',s:1,q:1,k:k(4),e:E}];}},
   {id:'calendar',name:'Calendar Call',b:function(k,E,E2){return[{t:'C',s:-1,q:1,k:k(0),e:E},{t:'C',s:1,q:1,k:k(0),e:E2}];}},
   {id:'jadeLizard',name:'Jade Lizard',b:function(k,E){return[{t:'P',s:-1,q:1,k:k(-4),e:E},{t:'C',s:-1,q:1,k:k(4),e:E},{t:'C',s:1,q:1,k:k(8),e:E}];}},
   {id:'ratio',name:'Call Ratio 1×2',b:function(k,E){return[{t:'C',s:1,q:1,k:k(-1),e:E},{t:'C',s:-1,q:2,k:k(5),e:E}];}}
  ];
  var SCEN={flat:{d:0,v:0,s:0},rally:{d:3,v:-2,s:8},crash:{d:3,v:8,s:-10},vol:{d:0,v:12,s:0},theta:{d:7,v:0,s:0},crush:{d:2,v:-10,s:0}};

  /* ---------- State ---------- */
  var S={market:'BTC',denom:'USD',data:{},status:'sync',legs:[],store:{},expiry:{},sel:{},
    sideMode:1,presetName:'',saved:[],account:100000,lot:65,fee:2,slip:1,entryMode:'mark',risk:2,
    volMode:'smile',pinned:null,onScreen:true,compact:false,
    ui:{days:0,iv:0,shock:0,range:18,win:8,t0:true,fill:true,cone:true,sortAsc:true,filter:''},
    spots:{},hist:[],future:[],savedSearch:'',savedSort:'new',editing:null};
  var KEY='optionforge_v3';
  var MKd=function(){return S.data[S.market];};
  var spotOf=function(m){var d=S.data[m];return d?d.spot:(S.spots[m]||MARKETS[m].seed);};
  var selExp=function(){return S.expiry[S.market];};
  var persistT=null;
  function persist(){clearTimeout(persistT);persistT=later(300,function(){try{
    localStorage.setItem(KEY,JSON.stringify({v:3,market:S.market,denom:S.denom,legs:S.legs,store:S.store,expiry:S.expiry,
      ui:S.ui,saved:S.saved,presetName:S.presetName,account:S.account,lot:S.lot,fee:S.fee,slip:S.slip,
      entryMode:S.entryMode,risk:S.risk,volMode:S.volMode,spots:S.spots}));}catch(e){}});}
  function validLeg(l){return l&&(l.type==='C'||l.type==='P')&&(l.side===1||l.side===-1)&&isFinite(l.strike)&&l.strike>0
    &&isFinite(l.expiry)&&isFinite(l.qty)&&l.qty>=1&&isFinite(l.premium)&&isFinite(l.iv)&&MARKETS[l.market||S.market];}
  function normLeg(l,mkt){var m=mkt||l.market||S.market,sp=isFinite(l.entrySpot)?l.entrySpot:spotOf(m);
    return{id:l.id||uid(),market:m,type:l.type,side:l.side,strike:+l.strike,expiry:+l.expiry,qty:clamp(+l.qty,1,99),
      premium:+l.premium,premiumCoin:isFinite(l.premiumCoin)?+l.premiumCoin:(+l.premium)/Math.max(sp,1e-6),
      entrySpot:sp,iv:+l.iv,ivOverride:isFinite(l.ivOverride)?+l.ivOverride:null,
      liveMark:isFinite(l.liveMark)?+l.liveMark:+l.premium,synthetic:!!l.synthetic};}
  function load(){
    var got=false;
    try{var s=JSON.parse(localStorage.getItem(KEY)||'null');
      if(s){if(MARKETS[s.market])S.market=s.market;if(s.denom==='COIN'||s.denom==='USD')S.denom=s.denom;
        Object.assign(S.ui,s.ui||{});S.ui.filter='';
        ['account','lot','fee','slip','risk'].forEach(function(k){if(isFinite(s[k]))S[k]=+s[k];});
        if(s.entryMode)S.entryMode=s.entryMode;if(s.volMode)S.volMode=s.volMode;
        if(Array.isArray(s.saved))S.saved=s.saved.filter(function(x){return x&&Array.isArray(x.legs);}).slice(0,40);
        if(s.store)S.store=s.store;if(s.expiry)S.expiry=s.expiry;if(s.spots)S.spots=s.spots;
        S.presetName=s.presetName||'';
        S.legs=(Array.isArray(s.legs)?s.legs:[]).filter(validLeg).map(function(l){return normLeg(l);});
        got=S.legs.length>0;}
    }catch(e){}
    ['optionforge_wp_v2','optionforge_wp_v1','optionforge_v1'].forEach(function(k){
      try{var o=JSON.parse(localStorage.getItem(k)||'null');if(!o)return;
        if(Array.isArray(o.saved))o.saved.forEach(function(sv){
          if(sv&&Array.isArray(sv.legs)&&!S.saved.some(function(x){return x.name===sv.name&&x.ts===sv.ts;}))
            S.saved.push({name:sv.name,market:sv.currency||sv.market||'BTC',ts:sv.ts||Date.now(),
              legs:sv.legs.filter(validLeg).map(function(l){return normLeg(l,sv.currency||sv.market);})});});
        if(!got&&Array.isArray(o.legs)){var lg=o.legs.filter(validLeg);
          if(lg.length){S.legs=lg.map(function(l){return normLeg(l,o.currency||o.market);});S.market=S.legs[0].market;got=true;}}
      }catch(e){}});
    S.saved=S.saved.slice(0,40);
    if(MARKETS[S.market].kind==='index')S.lot=CONFIG.LOTS[S.market]||S.lot;
    return got;
  }
  function ensureExpiry(){var d=MKd();if(!d)return;
    var e=S.expiry[S.market];
    if(!e||d.expiries.indexOf(e)<0){e=d.expiries.filter(function(x){return dLeft(x)>=2;})[0]||d.expiries[0]||null;S.expiry[S.market]=e;}}

  /* ---------- Data ---------- */
  function pack(inst,spot,demo,src){
    inst.sort(function(a,b){return a.expiry-b.expiry||a.strike-b.strike||(a.type<b.type?-1:1);});
    var byKey={},byName={},exps=[];
    inst.forEach(function(i){byKey[i.expiry+'|'+i.strike+'|'+i.type]=i;byName[i.name]=i;if(exps.indexOf(i.expiry)<0)exps.push(i.expiry);});
    exps.sort(function(a,b){return a-b;});
    return{spot:spot,instruments:inst,byKey:byKey,byName:byName,expiries:exps,at:Date.now(),demo:!!demo,src:src||''};
  }
  function demoData(m){
    var C=MARKETS[m],spot=S.spots[m]||C.seed,inst=[],now=Date.now(),exps=[],i;
    // v3.2: weekly expiry फक्त NIFTY + crypto ला; BANKNIFTY = फक्त monthly
    var wd=C.kind==='index'?CONFIG.NSE_WEEKLY_DAY:5,hr=C.kind==='index'?10:8,weekly=C.kind==='crypto'||m==='NIFTY';
    var day=(wd-new Date().getUTCDay()+7)%7;if(day<1)day+=7;
    if(weekly)for(i=0;i<3;i++)exps.push(Date.UTC(new Date().getUTCFullYear(),new Date().getUTCMonth(),new Date().getUTCDate()+day+i*7,hr));
    for(i=0;i<(weekly?3:4);i++){var n=new Date(),y=n.getUTCFullYear(),mo=n.getUTCMonth()+i;
      var last=new Date(Date.UTC(y,mo+1,0,hr));var back=(last.getUTCDay()-wd+7)%7;
      exps.push(Date.UTC(y,mo+1,0-back,hr));}
    exps=exps.filter(function(t,ix,arr){return t>now+3600000&&arr.indexOf(t)===ix;}).sort(function(a,b){return a-b;}).slice(0,6);
    var lo=Math.round(spot*0.78/C.step)*C.step,hi=Math.round(spot*1.22/C.step)*C.step;
    exps.forEach(function(e){var T=Math.max((e-now)/YEAR,1e-6),F=spot*Math.exp(C.rate*T);
      for(var k=lo;k<=hi;k+=C.step)['C','P'].forEach(function(t){
        var iv=smile(F,k,C.iv*(1+0.08*Math.exp(-T*20))),oi=Math.round(Math.exp(3.5+Math.random()*4));
        var px=bs(F,k,T,iv,t,C.rate).price;
        inst.push({name:m+'-'+expName(e)+'-'+k+'-'+t,market:m,expiry:e,strike:k,type:t,base:iv,iv:iv,
          mark:px,oi:oi,vol:oi*spot*0.02*Math.random(),fwd:F,bid:px*0.985,ask:px*1.015});});});
    return pack(inst,spot,true,'Simulated '+m+' chain');
  }
  function demoTick(){var d=MKd();if(!d||!d.demo)return;var C=MK(),now=Date.now();
    d.spot*=1+(Math.random()-0.5)*(C.kind==='index'?0.0012:0.003);
    d.instruments.forEach(function(i){var T=Math.max((i.expiry-now)/YEAR,1e-6);
      i.fwd=d.spot*Math.exp(C.rate*T);i.iv=clamp(i.base+(Math.random()-0.5)*0.01,0.05,2.5);
      i.mark=bs(i.fwd,i.strike,T,i.iv,i.type,C.rate).price;i.bid=i.mark*0.985;i.ask=i.mark*1.015;});
    d.at=now;}
  function fetchJSON(url,ms){var c=new AbortController(),t=setTimeout(function(){c.abort();},ms||12000);
    return fetch(url,{signal:c.signal}).then(function(r){clearTimeout(t);if(!r.ok)throw new Error('HTTP '+r.status);return r.json();})
      .then(function(j){if(!j.result)throw new Error('Bad payload');return j.result;});}
  function parseDeribit(m,arr,spot){
    var C=MARKETS[m],now=Date.now(),inst=[];
    arr.forEach(function(it){var p=String(it.instrument_name).split('-');if(p.length!==4)return;
      var e=parseExp(p[1]);if(!e||e<=now)return;
      var T=Math.max((e-now)/YEAR,1/(365*1440)),K=parseFloat(p[2]),t=p[3];
      if(!isFinite(K)||(t!=='C'&&t!=='P'))return;
      var F=it.underlying_price||spot;
      var iv=(typeof it.mark_iv==='number'&&it.mark_iv>0)?it.mark_iv/100:impliedVol((it.mark_price||0)*spot,F,K,T,t,0);
      if(!iv)iv=smile(spot,K,C.iv);
      var mk=(it.mark_price||0)*spot;if(mk<spot*1e-7)mk=bs(F,K,T,iv,t,0).price;
      inst.push({name:it.instrument_name,market:m,expiry:e,strike:K,type:t,iv:iv,mark:mk,oi:it.open_interest||0,
        vol:it.volume_usd||(it.volume||0)*spot,fwd:F,bid:(it.bid_price||0)*spot,ask:(it.ask_price||0)*spot});});
    return pack(inst,spot,false,'Deribit live');
  }
  var nseAt=0,nseCache={};
  function fetchNSE(m){
    if(!CONFIG.NSE_PROXY_URL)return Promise.reject(new Error('NSE proxy not configured'));
    var now=Date.now();
    if(nseCache[m]&&now-nseCache[m].at<CONFIG.NSE_CACHE_MS)return Promise.resolve(nseCache[m].data);
    if(now-nseAt<CONFIG.NSE_MIN_GAP)return Promise.reject(new Error('NSE rate-limit: cached snapshot in use'));
    nseAt=now;
    var url=CONFIG.NSE_PROXY_URL+(CONFIG.NSE_PROXY_URL.indexOf('?')>=0?'&':'?')+'symbol='+encodeURIComponent(m);
    var ctl=new AbortController(),to=setTimeout(function(){ctl.abort();},12000);
    return fetch(url,{signal:ctl.signal}).then(function(r){clearTimeout(to);
      if(!r.ok)throw new Error('HTTP '+r.status);return r.json();}).then(function(j){
      var rec=j.records||j,rows=rec.data||[],spot=num(rec.underlyingValue,MARKETS[m].seed),inst=[],C=MARKETS[m];
      rows.forEach(function(row){
        var K=num(row.strikePrice,NaN);if(!isFinite(K))return;
        ['CE','PE'].forEach(function(side){var o=row[side];if(!o||!o.expiryDate)return;
          var dm=/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/.exec(o.expiryDate);if(!dm)return;
          var e=Date.UTC(+dm[3],MON[dm[2].toUpperCase()],+dm[1],10,0,0);if(e<=Date.now())return;
          var T=Math.max((e-Date.now())/YEAR,1/(365*1440)),t=side==='CE'?'C':'P';
          var px=num(o.lastPrice,0),iv=num(o.impliedVolatility,0)/100;
          if(!iv)iv=impliedVol(px,spot,K,T,t,C.rate)||smile(spot,K,C.iv);
          if(px<=0)px=bs(spot,K,T,iv,t,C.rate).price;
          inst.push({name:m+'-'+expName(e)+'-'+K+'-'+t,market:m,expiry:e,strike:K,type:t,iv:iv,mark:px,
            oi:num(o.openInterest,0),vol:num(o.totalTradedVolume,0)*spot,fwd:spot*Math.exp(C.rate*T),
            bid:num(o.bidprice,px*0.99),ask:num(o.askPrice,px*1.01)});});});
      if(!inst.length)throw new Error('Empty NSE chain');
      var d=pack(inst,spot,false,'NSE via proxy');nseCache[m]={at:Date.now(),data:d};return d;});
  }
  var fetching=false,nextAt=0,refreshT=null,prevSpot=null;
  function setStatus(s){S.status=s;var p=q('pill');if(!p)return;
    p.className='pill '+s;q('statusTxt').textContent={live:'LIVE',demo:'DEMO',sync:'SYNC',stale:'STALE'}[s];streamTag();}
  function banner(kind,msg){var b=q('banner');if(!b)return;b.style.display='block';
    b.querySelector('.bin').className='bin'+(kind==='err'?' err':'');q('bannerTxt').textContent=msg;}
  function refresh(){
    if(fetching||dead)return Promise.resolve();fetching=true;
    var m=S.market,wasDemo=S.status==='demo',full=false;
    if(!MKd())setStatus('sync');
    var job=MK().kind==='crypto'
      ? Promise.all([fetchJSON(DERIBIT+'/get_book_summary_by_currency?currency='+m+'&kind=option'),
                     fetchJSON(DERIBIT+'/get_index_price?index_name='+m.toLowerCase()+'_usd')])
          .then(function(r){return parseDeribit(m,r[0],r[1].index_price);})
      : fetchNSE(m);
    return job.then(function(d){
      if(dead)return;
      full=!S.data[m]||S.data[m].demo;
      S.data[m]=d;S.spots[m]=d.spot;setStatus('live');q('banner').style.display='none';
      if(wasDemo)toast('Live '+m+' feed connected.');
      afterData(full);live.tries=0;wsConnect();
    }).catch(function(e){
      if(dead)return;
      // इथे फक्त खरे feed errors येतात — render errors आता safe() मध्ये अडकतात
      if(!S.data[m]){S.data[m]=demoData(m);setStatus('demo');
        banner('warn',MK().kind==='index'
          ? m+' chain is SIMULATED — '+(e.message||'feed unavailable')+'. Configure the proxy for live NSE data. Never trade on these numbers.'
          : 'Simulated preview — live feed unreachable ('+e.message+'). Auto-retrying. Do not trade on these numbers.');
        afterData(true);}
      else if(S.data[m].demo){setStatus('demo');}
      else{setStatus('stale');banner('err','Live feed hiccup ('+e.message+') — showing snapshot from '+new Date(S.data[m].at).toLocaleTimeString()+'. Retrying…');}
      wsClose();
    }).then(function(){fetching=false;});
  }
  function schedule(ms){clearTimeout(refreshT);nextAt=Date.now()+(ms||CONFIG.REFRESH);refreshT=later(ms||CONFIG.REFRESH,tick);}
  function tick(){if(dead)return;
    if(document.hidden||!S.onScreen){schedule(CONFIG.REFRESH);return;}
    refresh().then(function(){if(!dead)schedule(CONFIG.REFRESH);});}
  function afterData(full){
    var d=MKd();if(!d)return;
    ensureExpiry();
    S.legs.forEach(function(l){if(l.market!==S.market)return;var i=d.byKey[l.expiry+'|'+l.strike+'|'+l.type];
      if(i){l.iv=i.iv;l.liveMark=i.mark;l.synthetic=false;}});
    // v3.2: auto-preset फक्त user ने काहीच बदललं नसेल तर, live data आल्यावर एकदाच नव्या strikes वर बसवतो.
    // Clear केल्यावर legs परत येत नाहीत.
    if(S.autoLeg&&!d.demo){loadPreset('ironCondor',true);S.autoLeg=false;full=true;}
    if(full)renderAll();else softRender();
    persist();syncSubs();
  }

  /* ---------- WebSocket ---------- */
  var live={ws:null,on:false,tries:0,subs:{},reT:null,syT:null,id:1,to:null};
  var pend={spot:null,inst:{},dirty:false};
  function wsSend(m,p){if(live.ws&&live.ws.readyState===1){try{live.ws.send(JSON.stringify({jsonrpc:'2.0',id:live.id++,method:m,params:p}));}catch(e){}}}
  function wantChannels(){
    var out=['deribit_price_index.'+S.market.toLowerCase()+'_usd'],names={};
    S.legs.forEach(function(l){if(l.market!==S.market)return;var i=instAt(l.expiry,l.strike,l.type);if(i)names[i.name]=1;});
    visibleStrikes().forEach(function(k){['C','P'].forEach(function(t){var i=instAt(selExp(),k,t);if(i)names[i.name]=1;});});
    Object.keys(names).slice(0,30).forEach(function(n){out.push('ticker.'+n+'.100ms');});
    return out;
  }
  function syncSubs(now){
    clearTimeout(live.syT);
    var run=function(){if(!live.on||dead)return;
      var want=wantChannels(),rem=[],add=[];
      Object.keys(live.subs).forEach(function(c){if(want.indexOf(c)<0)rem.push(c);});
      want.forEach(function(c){if(!live.subs[c])add.push(c);});
      if(rem.length){wsSend('public/unsubscribe',{channels:rem});rem.forEach(function(c){delete live.subs[c];});}
      if(add.length){wsSend('public/subscribe',{channels:add});add.forEach(function(c){live.subs[c]=1;});}};
    if(now)run();else live.syT=later(450,run);
  }
  function streamTag(){var t=q('streamTag');if(t)t.style.display=(live.on&&S.status==='live')?'inline':'none';}
  function wsClose(){clearTimeout(live.reT);clearTimeout(live.to);live.on=false;live.subs={};
    if(live.ws){live.ws.onclose=null;live.ws.onmessage=null;live.ws.onerror=null;live.ws.onopen=null;
      try{live.ws.close();}catch(e){}live.ws=null;}streamTag();}
  function wsConnect(){
    if(dead||live.ws||S.status!=='live'||MK().kind!=='crypto'||!MKd()||typeof WebSocket==='undefined')return;
    var ws;try{ws=new WebSocket(WS_URL);}catch(e){return;}
    live.ws=ws;
    live.to=later(8000,function(){if(ws.readyState!==1){try{ws.close();}catch(e){}}});
    ws.onopen=function(){if(dead){try{ws.close();}catch(e){}return;}
      clearTimeout(live.to);live.on=true;live.tries=0;live.subs={};wsSend('public/test',{heartbeat:30});syncSubs(true);streamTag();};
    ws.onmessage=function(ev){var m;try{m=JSON.parse(ev.data);}catch(e){return;}
      if(m.method==='public/test'){wsSend('public/test',{});return;}
      if(m.method!=='subscription'||!m.params)return;
      var ch=m.params.channel||'',dt=m.params.data||{};
      if(ch.indexOf('deribit_price_index.')===0){if(isFinite(dt.index_price))pend.spot=dt.index_price;pend.dirty=true;}
      else if(ch.indexOf('ticker.')===0&&dt.instrument_name){pend.inst[dt.instrument_name]=dt;pend.dirty=true;}};
    ws.onerror=function(){try{ws.close();}catch(e){}};
    ws.onclose=function(){clearTimeout(live.to);live.on=false;live.ws=null;live.subs={};streamTag();
      if(dead||S.status!=='live')return;
      if(live.tries<8){live.tries++;live.reT=later(Math.min(30000,1500*live.tries),wsConnect);}};
  }
  function applyLive(){
    if(dead||!pend.dirty)return;pend.dirty=false;
    var d=MKd();if(!d||d.demo||document.hidden||!S.onScreen){pend.inst={};pend.spot=null;return;}
    var changed=false;
    if(pend.spot&&isFinite(pend.spot)){d.spot=pend.spot;changed=true;}pend.spot=null;
    Object.keys(pend.inst).forEach(function(n){var t=pend.inst[n],i=d.byName[n];if(!i)return;
      if(isFinite(t.mark_price))i.mark=t.mark_price*d.spot;
      if(isFinite(t.mark_iv)&&t.mark_iv>0)i.iv=t.mark_iv/100;
      if(isFinite(t.open_interest))i.oi=t.open_interest;
      if(isFinite(t.underlying_price))i.fwd=t.underlying_price;
      if(isFinite(t.bid_price))i.bid=t.bid_price*d.spot;
      if(isFinite(t.ask_price))i.ask=t.ask_price*d.spot;
      S.legs.forEach(function(l){if(l.market===S.market&&l.expiry===i.expiry&&l.strike===i.strike&&l.type===i.type){l.iv=i.iv;l.liveMark=i.mark;}});
      safe('chain-patch',function(){patchChainCell(i);});changed=true;});
    pend.inst={};
    if(changed){d.at=Date.now();renderDynamic();safe('ticker',renderTicker);safe('leg-marks',renderLegMarks);safe('vol',drawVol);}
  }

  /* ---------- Legs ---------- */
  function instAt(e,k,t){var d=MKd();return d?d.byKey[e+'|'+k+'|'+t]||null:null;}
  function strikesAt(e){var d=MKd();if(!d)return[];var o={},out=[];
    d.instruments.forEach(function(i){if(i.expiry===e&&!o[i.strike]){o[i.strike]=1;out.push(i.strike);}});
    return out.sort(function(a,b){return a-b;});}
  function nearest(e,target){var ks=strikesAt(e);if(!ks.length)return Math.round(target);
    return ks.reduce(function(b,k){return Math.abs(k-target)<Math.abs(b-target)?k:b;},ks[0]);}
  function atmIvAt(e){var d=MKd();if(d&&e){var k=nearest(e,d.spot),c=instAt(e,k,'C'),p=instAt(e,k,'P');
    var a=[c,p].filter(Boolean).map(function(i){return i.iv;});if(a.length)return a.reduce(function(x,y){return x+y;},0)/a.length;}
    if(S.legs.length)return S.legs.reduce(function(a,l){return a+legIv(l)*l.qty;},0)/S.legs.reduce(function(a,l){return a+l.qty;},0);
    return MK().iv;}
  function legIv(l){return l.ivOverride!=null?l.ivOverride/100:l.iv;}
  function fillPrice(i,side){
    if(!i)return null;
    if(S.entryMode==='mid'&&i.bid>0&&i.ask>0)return (i.bid+i.ask)/2;
    if(S.entryMode==='ba'){var p=side===1?i.ask:i.bid;if(p>0)return p;}
    return i.mark;
  }
  function makeLeg(type,side,strike,expiry,qty){
    var i=instAt(expiry,strike,type),sp=spotOf(S.market),C=MK();
    var T=Math.max((expiry-Date.now())/YEAR,1/(365*1440));
    var iv=i?i.iv:smile(sp,strike,atmIvAt(expiry));
    var px=i?fillPrice(i,side):bs(sp,strike,T,iv,type,C.rate).price;
    px=px*(1+(side===1?1:-1)*S.slip/100);px=Math.max(px,0.0001);
    return{id:uid(),market:S.market,type:type,side:side,strike:strike,expiry:expiry,qty:clamp(qty,1,99),
      premium:px,premiumCoin:px/Math.max(sp,1e-6),entrySpot:sp,iv:iv,ivOverride:null,liveMark:i?i.mark:px,synthetic:!i};
  }
  function feesTotal(){return S.legs.reduce(function(a,l){return a+l.qty;},0)*S.fee*2;}
  function pushHist(){S.autoLeg=false;S.hist.push(JSON.stringify({legs:S.legs,presetName:S.presetName}));
    if(S.hist.length>CONFIG.HISTORY)S.hist.shift();S.future.length=0;histBtns();}
  function histBtns(){var u=q('undoBtn'),r=q('redoBtn');if(u)u.disabled=!S.hist.length;if(r)r.disabled=!S.future.length;}
  function applyHist(str){var o=JSON.parse(str);S.legs=o.legs.map(function(l){return normLeg(l);});
    S.presetName=o.presetName;S.sel={};persist();renderLegs();renderDynamic();syncSubs();histBtns();}
  function undo(){if(!S.hist.length)return;S.future.push(JSON.stringify({legs:S.legs,presetName:S.presetName}));
    applyHist(S.hist.pop());toast('Undone.');}
  function redo(){if(!S.future.length)return;S.hist.push(JSON.stringify({legs:S.legs,presetName:S.presetName}));
    applyHist(S.future.pop());toast('Redone.');}
  function addLeg(type,side,strike,expiry,qty,silent){
    if(S.legs.length>=CONFIG.MAX_LEGS){toast('Max '+CONFIG.MAX_LEGS+' legs — remove one first.');return;}
    pushHist();var l=makeLeg(type,side,strike,expiry,qty);S.legs.push(l);S.presetName='Custom';
    persist();renderLegs(l.id);renderDynamic();syncSubs();track('leg_add',{market:S.market,type:type});
    if(!silent)toast('Added '+(side===1?'BUY':'SELL')+' '+qty+' × '+kfmt(strike)+type+' · '+fmtExp(expiry));
    announce('Leg added: '+(side===1?'buy':'sell')+' '+qty+' '+kfmt(strike)+' '+type);
  }
  function loadPreset(id,silent){
    var d=MKd();if(!d){if(!silent)toast('Market data not ready yet.');return;}
    var p=null;PRESETS.forEach(function(x){if(x.id===id)p=x;});if(!p)return;
    ensureExpiry();
    var e=selExp()||d.expiries[0],e2=d.expiries.filter(function(x){return x>e;})[0]||e;
    var specs=p.b(function(pct){return nearest(e,d.spot*(1+pct/100));},e,e2);
    if(!silent)pushHist();
    S.legs=specs.map(function(s){return makeLeg(s.t,s.s,s.k,s.e,s.q);});S.sel={};S.autoLeg=!!silent;
    S.presetName=p.name;persist();
    safe('legs',renderLegs);renderDynamic();syncSubs();
    if(!silent){track('preset_load',{preset:id,market:S.market});
      if(id==='calendar'&&e2===e)toast('Only one expiry available — calendar became a same-expiry position.');
      toast('Loaded '+p.name+' — '+S.legs.length+' legs.',undo);}
  }
  function setMarket(m){
    if(m===S.market||!MARKETS[m])return;
    S.store[S.market]=S.legs;S.legs=(S.store[m]||[]).map(function(l){return normLeg(l,m);});
    S.market=m;S.sel={};S.pinned=null;S.hist=[];S.future=[];
    if(MARKETS[m].kind==='index'){S.denom='USD';S.lot=CONFIG.LOTS[m]||S.lot;}
    S.presetName=S.legs.length?'Custom':'';prevSpot=null;wsClose();
    if(!S.data[m])S.data[m]=demoData(m);
    ensureExpiry();
    if(!S.legs.length)loadPreset('ironCondor',true);
    renderAll();persist();histBtns();track('market_switch',{market:m});
    toast('Switched to '+m+'. Other market legs are parked — switch back to restore.');
    refresh().then(function(){schedule(CONFIG.REFRESH);});
  }

  /* ---------- P&L ---------- */
  function intrinsic(l,Sp){return l.type==='C'?Math.max(Sp-l.strike,0):Math.max(l.strike-Sp,0);}
  function horizon(){return S.legs.length?Math.min.apply(null,S.legs.map(function(l){return l.expiry;})):null;}
  function rawAt(Sp,days){
    var C=MK(),H=horizon(),now=Date.now(),v=0;
    for(var i=0;i<S.legs.length;i++){var l=S.legs[i],T,val,sg=Math.max(legIv(l)+S.ui.iv/100,0.02);
      if(days==null){T=(l.expiry-H)/YEAR;val=T<=1e-9?intrinsic(l,Sp):bs(Sp,l.strike,T,legIv(l),l.type,C.rate).price;}
      else{T=Math.max((l.expiry-now)/YEAR-days/365,0);val=T<=1e-9?intrinsic(l,Sp):bs(Sp,l.strike,T,sg,l.type,C.rate).price;}
      v+=l.side*l.qty*(val-l.premium);}
    return v;
  }
  function pnlAt(Sp,days){
    var L=lot(),f=feesTotal();
    if(isCoin()){var sf=Math.max(Sp,1e-6),H=horizon(),C=MK(),now=Date.now(),v=0;
      for(var i=0;i<S.legs.length;i++){var l=S.legs[i],T,val,sg=Math.max(legIv(l)+S.ui.iv/100,0.02);
        if(days==null){T=(l.expiry-H)/YEAR;val=T<=1e-9?intrinsic(l,Sp):bs(Sp,l.strike,T,legIv(l),l.type,C.rate).price;}
        else{T=Math.max((l.expiry-now)/YEAR-days/365,0);val=T<=1e-9?intrinsic(l,Sp):bs(Sp,l.strike,T,sg,l.type,C.rate).price;}
        v+=l.side*l.qty*(val/sf-l.premiumCoin);}
      return v-f/sf;}
    return rawAt(Sp,days)*L-f;
  }
  var pnlExp=function(Sp){return pnlAt(Sp,null);};
  var pnlNow=function(Sp){return pnlAt(Sp,S.ui.days);};
  function range(){var sp=spotOf(S.market),r=S.ui.range/100,lo=sp*(1-r),hi=sp*(1+r);
    if(S.legs.length){var ks=S.legs.map(function(l){return l.strike;});
      lo=Math.min(lo,Math.min.apply(null,ks)*0.96);hi=Math.max(hi,Math.max.apply(null,ks)*1.04);}
    return{lo:Math.max(lo,sp*0.05),hi:hi};}
  function sameExpiry(){var e={};S.legs.forEach(function(l){e[l.expiry]=1;});return Object.keys(e).length===1;}
  function exactBE(){
    var ks=S.legs.map(function(l){return l.strike;}).filter(function(v,i,a){return a.indexOf(v)===i;}).sort(function(a,b){return a-b;});
    if(!ks.length)return[];
    var sp=spotOf(S.market),pts=[0].concat(ks,[Math.max(ks[ks.length-1]*3,sp*3)]),out=[];
    for(var i=0;i<pts.length-1;i++){var a=pts[i],b=pts[i+1],fa=pnlExp(Math.max(a,1e-6)),fb=pnlExp(b);
      if((fa<0&&fb>=0)||(fa>0&&fb<=0)){var t=Math.abs(fa)/(Math.abs(fa)+Math.abs(fb)||1);out.push(a+(b-a)*t);}
      else if(Math.abs(fb)<1e-9&&i<pts.length-2)out.push(b);}
    return out.filter(function(v,i,a){return i===0||Math.abs(v-a[i-1])>1e-6;});
  }
  function scanBE(lo,hi){var out=[],N=900,px=lo,pv=pnlExp(lo);
    for(var i=1;i<=N;i++){var x=lo+(hi-lo)*i/N,v=pnlExp(x);
      if((pv<0&&v>=0)||(pv>0&&v<=0)){var a=px,b=x,fa=pv;
        for(var j=0;j<40;j++){var m=(a+b)/2,f=pnlExp(m);if((fa<0)===(f<0)){a=m;fa=f;}else b=m;}
        out.push((a+b)/2);}px=x;pv=v;}
    return out.filter(function(v,i,a){return i===0||Math.abs(v-a[i-1])>(hi-lo)*1e-5;});}
  var aCache={sig:null,val:null};
  function getAnalytics(){
    if(!S.legs.length)return null;
    var sp=spotOf(S.market),rg=range(),H=horizon();
    var sig=[S.market,S.denom,S.lot,S.fee,S.slip,Math.round(sp*100),Math.floor(Date.now()/60000),
      S.ui.iv,S.ui.days,S.ui.shock,Math.round(rg.lo),Math.round(rg.hi),
      S.legs.map(function(l){return [l.type,l.side,l.strike,l.expiry,l.qty,l.premium.toFixed(4),legIv(l).toFixed(4)].join(':');}).join('|')].join('~');
    if(aCache.sig===sig)return aCache.val;
    var linear=!isCoin()&&sameExpiry(),ks=S.legs.map(function(l){return l.strike;}).sort(function(a,b){return a-b;});
    var lo=Math.max(sp*0.02,Math.min(rg.lo,ks[0]*0.4)),hi=Math.max(rg.hi,ks[ks.length-1]*2.4);
    var maxP=-Infinity,maxL=Infinity,test=function(x){var p=pnlExp(x);if(p>maxP)maxP=p;if(p<maxL)maxL=p;};
    test(Math.max(lo,1e-6));ks.forEach(function(k){test(k);});
    for(var i=0;i<=(linear?0:700);i++)test(lo+(hi-lo)*i/700);
    var slope=S.legs.filter(function(l){return l.type==='C';}).reduce(function(a,l){return a+l.side*l.qty;},0);
    if(!isCoin()){if(slope>0)maxP=Infinity;if(slope<0)maxL=-Infinity;}
    var bes=linear?exactBE():scanBE(lo,hi);
    var T=Math.max((H-Date.now())/YEAR,1e-6),sg=atmIvAt(H),r=MK().rate;
    var z=function(x){return x<=0?-Infinity:!isFinite(x)?Infinity:(Math.log(x/sp)-(r-sg*sg/2)*T)/(sg*Math.sqrt(T));};
    var bnd=[0].concat(bes,[Infinity]),pop=0;
    for(i=0;i<bnd.length-1;i++){var a=bnd[i],b=bnd[i+1],mid=isFinite(b)?(a+b)/2:Math.max(a*1.3,a+sp*0.3);
      if(pnlExp(Math.max(mid,1e-6))>0)pop+=ncdf(z(b))-ncdf(z(a));}
    var Sx=sp*(1+S.ui.shock/100),g={d:0,g:0,t:0,v:0},L=lot();
    S.legs.forEach(function(l){var Te=Math.max((l.expiry-Date.now())/YEAR-S.ui.days/365,0),s2=Math.max(legIv(l)+S.ui.iv/100,0.02);
      var o=Te<=1e-9?{delta:l.type==='C'?(Sx>l.strike?1:0):(Sx<l.strike?-1:0),gamma:0,theta:0,vega:0}:bs(Sx,l.strike,Te,s2,l.type,MK().rate);
      var w=l.side*l.qty*L;g.d+=w*o.delta;g.g+=w*o.gamma;g.t+=w*o.theta;g.v+=w*o.vega;});
    var netPrem=S.legs.reduce(function(a,l){return a+l.side*l.qty*l.premium;},0)*(isCoin()?1/sp:L);
    var margin=0,notional=0;
    S.legs.forEach(function(l){var w=l.qty*L;notional+=w*sp;
      if(l.side===-1){var otm=l.type==='C'?Math.max(l.strike-sp,0):Math.max(sp-l.strike,0);
        margin+=w*Math.max(0.15*sp-otm,0.10*sp);}});
    if(isCoin()){margin/=sp;notional/=sp;}
    var sigT=Math.max((H-Date.now())/YEAR,1e-6),sigIv=atmIvAt(H);
    var cone={s1l:sp*Math.exp(-sigIv*Math.sqrt(sigT)),s1h:sp*Math.exp(sigIv*Math.sqrt(sigT)),
      s2l:sp*Math.exp(-2*sigIv*Math.sqrt(sigT)),s2h:sp*Math.exp(2*sigIv*Math.sqrt(sigT)),iv:sigIv,T:sigT};
    var out={maxP:maxP,maxL:maxL,bes:bes,exact:linear,pop:clamp(pop,0,1),
      rr:(!isFinite(maxP)||maxL>=0)?Infinity:maxP/Math.abs(maxL),netPrem:netPrem,g:g,Sx:Sx,
      scenNow:pnlNow(Sx),scenExp:pnlExp(Sx),multi:!sameExpiry(),H:H,fees:feesTotal()*(isCoin()?1/sp:1),
      margin:margin,notional:notional,cone:cone,lot:L};
    aCache={sig:sig,val:out};return out;
  }

  /* ---------- Canvas ---------- */
  function cv(name,wrapName){var c=q(name),w=q(wrapName);return{c:c,w:w,x:c?c.getContext('2d'):null,W:0,H:0,dpr:1};}
  var chart=cv('chartBase','chartWrap'),over=cv('chartOver','chartWrap'),heat=cv('heatCv','heatWrap'),vol=cv('volCv','volWrap');
  chart.curves=null;chart.view=null;chart.hover=null;
  heat.grid=null;heat.box=null;heat.hover=null;heat.dirty=false;heat.sig='';heat.last=0;heat.off=document.createElement('canvas');heat.cursor=null;
  var resizePending=false;
  function sizeOne(o){if(!o.c||!o.w)return;var w=o.w.clientWidth,h=o.w.clientHeight;if(!w||!h)return;
    o.dpr=Math.min(window.devicePixelRatio||1,2);o.W=w;o.H=h;
    o.c.width=Math.round(w*o.dpr);o.c.height=Math.round(h*o.dpr);o.x.setTransform(o.dpr,0,0,o.dpr,0,0);}
  function sizeAll(){if(dead)return;
    sizeOne(chart);sizeOne(over);sizeOne(heat);sizeOne(vol);
    safe('curves',buildCurves);   // v3.1: resize नंतरही chart भरलेला राहतो
    safe('chart',drawBase);safe('heat-build',function(){buildHeat(true);});safe('heat',drawHeat);safe('vol',drawVol);frameQ.over=true;kick();}
  function queueResize(){if(resizePending)return;resizePending=true;requestAnimationFrame(function(){resizePending=false;sizeAll();});}
  function ticksOf(min,max,n){var span=max-min;if(span<=0)return[min];
    var s0=span/Math.max(1,n),mag=Math.pow(10,Math.floor(Math.log10(s0))),nm=s0/mag;
    var step=(nm<1.5?1:nm<3?2:nm<7?5:10)*mag,out=[];
    for(var v=Math.ceil(min/step)*step;v<=max+1e-9;v+=step)out.push(v);return out;}
  function buildCurves(){
    if(!S.legs.length){chart.curves=null;return;}
    var rg=range(),N=320,xs=[],ex=[],nw=[],i,x;
    for(i=0;i<=N;i++){x=rg.lo+(rg.hi-rg.lo)*i/N;xs.push(x);ex.push(pnlExp(x));nw.push(pnlNow(x));}
    var pin=null;
    if(S.pinned){pin=[];for(i=0;i<=N;i++)pin.push(pinnedPnl(xs[i]));}
    chart.curves={xs:xs,ex:ex,nw:nw,pin:pin,lo:rg.lo,hi:rg.hi};
  }
  function pinnedPnl(Sp){var p=S.pinned;if(!p||!p.legs.length)return 0;
    var H=Math.min.apply(null,p.legs.map(function(l){return l.expiry;})),v=0,r=MK().rate;
    p.legs.forEach(function(l){var T=(l.expiry-H)/YEAR;
      var val=T<=1e-9?intrinsic(l,Sp):bs(Sp,l.strike,T,legIv(l),l.type,r).price;
      v+=l.side*l.qty*(val-l.premium);});
    return isCoin()?v/Math.max(Sp,1e-6):v*lot();}
  function drawBase(){
    var x=chart.x,W=chart.W,H=chart.H;if(!x||!W)return;x.clearRect(0,0,W,H);
    var L=64,R=14,T=18,B=30,pw=W-L-R,ph=H-T-B,a=getAnalytics();chart.view=null;
    x.font='11px '+MF;x.textBaseline='alphabetic';
    if(!chart.curves){x.fillStyle='#5d6c92';x.textAlign='center';
      x.fillText(MKd()?'Load a playbook strategy — or click premiums in the chain.':'Preparing market data…',W/2,H/2-6);
      x.fillStyle='#3b4a70';x.fillText('Payoff, breakevens, cone and Greeks render here.',W/2,H/2+14);return;}
    var c=chart.curves,yMin=0,yMax=0,i;
    for(i=0;i<c.ex.length;i++){if(isFinite(c.ex[i])){yMin=Math.min(yMin,c.ex[i]);yMax=Math.max(yMax,c.ex[i]);}}
    if(S.ui.t0)for(i=0;i<c.nw.length;i++){if(isFinite(c.nw[i])){yMin=Math.min(yMin,c.nw[i]);yMax=Math.max(yMax,c.nw[i]);}}
    if(c.pin)for(i=0;i<c.pin.length;i++){if(isFinite(c.pin[i])){yMin=Math.min(yMin,c.pin[i]);yMax=Math.max(yMax,c.pin[i]);}}
    var span=yMax-yMin;if(span<1){span=1;yMin-=0.5;yMax+=0.5;}yMin-=span*0.14;yMax+=span*0.14;
    var X=function(v){return L+(v-c.lo)/(c.hi-c.lo)*pw;},Y=function(v){return T+(yMax-v)/(yMax-yMin)*ph;},y0=clamp(Y(0),T,T+ph);
    chart.view={L:L,T:T,pw:pw,ph:ph,X:X,Y:Y,y0:y0,lo:c.lo,hi:c.hi,a:a};
    if(S.ui.cone&&a){var bands=[[a.cone.s2l,a.cone.s2h,'rgba(59,130,246,.07)'],[a.cone.s1l,a.cone.s1h,'rgba(34,211,238,.09)']];
      bands.forEach(function(bd){var x1=clamp(X(bd[0]),L,L+pw),x2=clamp(X(bd[1]),L,L+pw);
        if(x2>x1){x.fillStyle=bd[2];x.fillRect(x1,T,x2-x1,ph);}});
      x.font='9px '+MF;x.fillStyle='#4a6296';x.textAlign='center';x.textBaseline='top';
      [['1σ',a.cone.s1l],['1σ',a.cone.s1h],['2σ',a.cone.s2l],['2σ',a.cone.s2h]].forEach(function(p){
        var px=X(p[1]);if(px>L+8&&px<L+pw-8)x.fillText(p[0],px,T+2);});}
    x.font='11px '+MF;x.textAlign='right';x.textBaseline='middle';
    ticksOf(yMin,yMax,6).forEach(function(v){var y=Y(v);
      x.strokeStyle=Math.abs(v)<1e-9?'rgba(139,155,192,.4)':'rgba(30,42,69,.7)';x.lineWidth=1;
      x.beginPath();x.moveTo(L,y);x.lineTo(L+pw,y);x.stroke();x.fillStyle='#5d6c92';x.fillText(compact(v),L-7,y);});
    x.textAlign='center';x.textBaseline='top';
    ticksOf(c.lo,c.hi,7).forEach(function(v){var px=X(v);
      x.strokeStyle='rgba(30,42,69,.45)';x.beginPath();x.moveTo(px,T);x.lineTo(px,T+ph);x.stroke();
      x.fillStyle='#5d6c92';x.fillText(compact(v),px,T+ph+7);});
    if(S.ui.fill){
      var area=function(){x.beginPath();x.moveTo(X(c.xs[0]),y0);
        for(var j=0;j<c.xs.length;j++)x.lineTo(X(c.xs[j]),Y(c.ex[j]));
        x.lineTo(X(c.xs[c.xs.length-1]),y0);x.closePath();};
      x.save();x.beginPath();x.rect(L,T,pw,Math.max(0,y0-T));x.clip();
      var g1=x.createLinearGradient(0,T,0,y0);g1.addColorStop(0,'rgba(34,197,94,.34)');g1.addColorStop(1,'rgba(34,197,94,.04)');
      area();x.fillStyle=g1;x.fill();x.restore();
      x.save();x.beginPath();x.rect(L,y0,pw,Math.max(0,T+ph-y0));x.clip();
      var g2=x.createLinearGradient(0,y0,0,T+ph);g2.addColorStop(0,'rgba(244,63,94,.05)');g2.addColorStop(1,'rgba(244,63,94,.32)');
      area();x.fillStyle=g2;x.fill();x.restore();}
    x.strokeStyle='rgba(139,155,192,.5)';
    S.legs.forEach(function(l){if(l.strike<c.lo||l.strike>c.hi)return;var px=X(l.strike);
      x.beginPath();x.moveTo(px,T+ph-5);x.lineTo(px,T+ph);x.stroke();});
    if(c.pin){x.save();x.strokeStyle='#8b5cf6';x.lineWidth=1.8;x.setLineDash([6,4]);x.beginPath();
      for(i=0;i<c.xs.length;i++){var ppx=X(c.xs[i]),py=Y(c.pin[i]);i?x.lineTo(ppx,py):x.moveTo(ppx,py);}x.stroke();x.restore();}
    x.strokeStyle='#e8eefc';x.lineWidth=2.4;x.lineJoin='round';x.beginPath();
    for(i=0;i<c.xs.length;i++){var ex1=X(c.xs[i]),ey=Y(c.ex[i]);i?x.lineTo(ex1,ey):x.moveTo(ex1,ey);}x.stroke();
    if(S.ui.t0){x.save();x.strokeStyle='#22d3ee';x.lineWidth=2;x.shadowColor='rgba(34,211,238,.55)';x.shadowBlur=10;x.beginPath();
      for(i=0;i<c.xs.length;i++){var nx=X(c.xs[i]),ny=Y(c.nw[i]);i?x.lineTo(nx,ny):x.moveTo(nx,ny);}x.stroke();x.restore();}
    var sp=spotOf(S.market);
    if(sp>=c.lo&&sp<=c.hi){var sx=X(sp);x.save();x.strokeStyle='#fbbf24';x.lineWidth=1.4;x.setLineDash([5,4]);
      x.beginPath();x.moveTo(sx,T);x.lineTo(sx,T+ph);x.stroke();x.restore();
      var lbl='SPOT '+compact(sp);x.font='700 10px '+MF;var tw=x.measureText(lbl).width+13,bx=clamp(sx-tw/2,L,L+pw-tw);
      x.fillStyle='rgba(251,191,36,.15)';x.strokeStyle='rgba(251,191,36,.6)';
      x.beginPath();(x.roundRect?x.roundRect(bx,T+2,tw,16,5):x.rect(bx,T+2,tw,16));x.fill();x.stroke();
      x.fillStyle='#fbbf24';x.textAlign='center';x.textBaseline='middle';x.fillText(lbl,bx+tw/2,T+10);}
    if(a){x.font='700 10px '+MF;a.bes.forEach(function(b,ix){if(b<c.lo||b>c.hi)return;var px=X(b);
      x.fillStyle='#e879f9';x.save();x.translate(px,y0);x.rotate(Math.PI/4);x.fillRect(-3.5,-3.5,7,7);x.restore();
      x.textAlign='center';x.textBaseline=ix%2?'top':'bottom';x.fillText(compact(b),px,y0+(ix%2?8:-8));});}
  }
  function drawOverlay(ts){
    var x=over.x,W=over.W,H=over.H;if(!x||!W)return;x.clearRect(0,0,W,H);var v=chart.view;if(!v)return;
    if(S.ui.t0&&v.a){var px=v.X(v.a.Sx),py=clamp(v.Y(v.a.scenNow),v.T,v.T+v.ph);
      if(px>=v.L&&px<=v.L+v.pw){var col=v.a.scenNow>=0?'#34d399':'#fb4d6d',r=7;
        x.beginPath();x.arc(px,py,r+4,0,7);x.fillStyle=col+'33';x.fill();
        x.beginPath();x.arc(px,py,4.5,0,7);x.fillStyle=col;x.fill();x.lineWidth=1.5;x.strokeStyle='#e8eefc';x.stroke();}}
    if(chart.hover!=null&&chart.curves){var c=chart.curves,hx=clamp(chart.hover,v.L,v.L+v.pw),price=c.lo+(hx-v.L)/v.pw*(c.hi-c.lo);
      x.strokeStyle='rgba(232,238,252,.25)';x.lineWidth=1;x.setLineDash([3,3]);
      x.beginPath();x.moveTo(hx,v.T);x.lineTo(hx,v.T+v.ph);x.stroke();x.setLineDash([]);
      x.beginPath();x.arc(hx,clamp(v.Y(pnlExp(price)),v.T,v.T+v.ph),4,0,7);x.fillStyle='#e8eefc';x.fill();
      if(S.ui.t0){x.beginPath();x.arc(hx,clamp(v.Y(pnlNow(price)),v.T,v.T+v.ph),4,0,7);x.fillStyle='#22d3ee';x.fill();}}
  }
  function chartTip(){
    var v=chart.view,tip=q('chartTip');if(!tip)return;
    if(chart.hover==null||!v||!chart.curves){tip.style.display='none';return;}
    var c=chart.curves,px=clamp(chart.hover,v.L,v.L+v.pw),price=c.lo+(px-v.L)/v.pw*(c.hi-c.lo),sp=spotOf(S.market);
    var pe=pnlExp(price),pn=pnlNow(price),pct=(price/sp-1)*100;
    tip.innerHTML='<div class="tp">'+money(price)+'<small>'+(pct>=0?'+':'')+pct.toFixed(1)+'%</small></div>'+
      '<div class="tr"><span><i style="background:#e8eefc"></i>Expiry</span><b class="'+(pe>=0?'up':'dn')+'">'+sign(pe)+'</b></div>'+
      (S.ui.t0?'<div class="tr"><span><i style="background:#22d3ee"></i>T+'+S.ui.days+'d</span><b class="'+(pn>=0?'up':'dn')+'">'+sign(pn)+'</b></div>':'')+
      (S.pinned?'<div class="tr"><span><i style="background:#8b5cf6"></i>Pinned</span><b>'+sign(pinnedPnl(price))+'</b></div>':'');
    tip.style.display='block';tip.style.left=clamp(px+15,6,chart.W-(tip.offsetWidth||170)-6)+'px';tip.style.top='12px';
  }

  /* ---------- Heatmap ---------- */
  function heatColor(t){var st=[[-1,[244,63,94]],[-0.5,[127,29,58]],[0,[14,21,38]],[0.5,[20,83,45]],[1,[34,197,94]]];
    for(var i=0;i<st.length-1;i++){if(t>=st[i][0]&&t<=st[i+1][0]){var k=(t-st[i][0])/((st[i+1][0]-st[i][0])||1);
      return[Math.round(st[i][1][0]+(st[i+1][1][0]-st[i][1][0])*k),Math.round(st[i][1][1]+(st[i+1][1][1]-st[i][1][1])*k),Math.round(st[i][1][2]+(st[i+1][1][2]-st[i][1][2])*k)];}}
    return t<0?st[0][1]:st[4][1];}
  function maxDays(){if(!S.legs.length)return 30;
    return Math.max(1,Math.min(120,Math.ceil(Math.max.apply(null,S.legs.map(function(l){return dLeft(l.expiry);})))));}
  function buildHeat(force){
    if(!S.legs.length){heat.grid=null;q('scaleMin').textContent='—';q('scaleMax').textContent='—';return;}
    var rg=range(),md=maxDays(),sp=spotOf(S.market);
    var sig=[S.market,S.denom,S.lot,S.fee,S.ui.iv,Math.round(rg.lo),Math.round(rg.hi),md,
      S.legs.map(function(l){return l.id+l.qty+l.strike+l.expiry+legIv(l).toFixed(3)+l.premium.toFixed(3);}).join('|')].join('~');
    var now=Date.now();
    if(!force&&heat.sig===sig)return;
    if(!force&&now-heat.last<800)return;
    heat.sig=sig;heat.last=now;
    var cols=54,rows=22,vals=new Float64Array(cols*rows),mx=1e-9,r,c;
    for(r=0;r<rows;r++){var days=md*r/(rows-1);
      for(c=0;c<cols;c++){var Sp=rg.lo+(rg.hi-rg.lo)*c/(cols-1),v=pnlAt(Sp,days);
        vals[r*cols+c]=v;if(Math.abs(v)>mx)mx=Math.abs(v);}}
    heat.grid={lo:rg.lo,hi:rg.hi,md:md,cols:cols,rows:rows,vals:vals,mx:mx};
    heat.off.width=cols;heat.off.height=rows;
    var ox=heat.off.getContext('2d'),img=ox.createImageData(cols,rows);
    for(var i=0;i<cols*rows;i++){var col=heatColor(clamp(vals[i]/mx,-1,1));
      img.data[i*4]=col[0];img.data[i*4+1]=col[1];img.data[i*4+2]=col[2];img.data[i*4+3]=255;}
    ox.putImageData(img,0,0);
    q('scaleMin').textContent=sign(-mx);q('scaleMax').textContent=sign(mx);
  }
  function drawHeat(){
    var x=heat.x,W=heat.W,H=heat.H;if(!x||!W)return;x.clearRect(0,0,W,H);x.font='10px '+MF;
    var L=56,R=12,T=14,B=24,pw=W-L-R,ph=H-T-B;heat.box={L:L,T:T,pw:pw,ph:ph};
    if(!heat.grid){x.fillStyle='#5d6c92';x.textAlign='center';x.textBaseline='middle';
      x.fillText('Add legs to see the P&L surface.',W/2,H/2);q('heatTip').style.display='none';return;}
    var g=heat.grid,r,c;x.imageSmoothingEnabled=true;x.drawImage(heat.off,L,T,pw,ph);
    x.fillStyle='rgba(232,238,252,.85)';
    for(r=0;r<g.rows;r++)for(c=0;c<g.cols-1;c++){var v1=g.vals[r*g.cols+c],v2=g.vals[r*g.cols+c+1];
      if((v1<0&&v2>=0)||(v1>0&&v2<=0)){var k=Math.abs(v1)/((Math.abs(v1)+Math.abs(v2))||1);
        x.beginPath();x.arc(L+(c+k)/(g.cols-1)*pw,T+r/(g.rows-1)*ph,1.2,0,7);x.fill();}}
    var a=getAnalytics(),sp=spotOf(S.market);
    if(S.ui.cone&&a){x.save();x.setLineDash([3,3]);x.lineWidth=1;
      [[a.cone.s1l,'rgba(34,211,238,.55)'],[a.cone.s1h,'rgba(34,211,238,.55)'],[a.cone.s2l,'rgba(59,130,246,.45)'],[a.cone.s2h,'rgba(59,130,246,.45)']].forEach(function(p){
        var px=L+(p[0]-g.lo)/(g.hi-g.lo)*pw;if(px<L||px>L+pw)return;x.strokeStyle=p[1];
        x.beginPath();x.moveTo(px,T);x.lineTo(px,T+ph);x.stroke();});x.restore();}
    x.fillStyle='#8b9bc0';x.textAlign='right';x.textBaseline='middle';
    for(var i=0;i<=4;i++)x.fillText('T+'+Math.round(g.md*i/4)+'d',L-7,T+ph*i/4);
    x.textAlign='center';x.textBaseline='top';x.fillStyle='#5d6c92';
    ticksOf(g.lo,g.hi,5).forEach(function(v){var px=L+(v-g.lo)/(g.hi-g.lo)*pw;if(px<L-2||px>L+pw+2)return;x.fillText(compact(v),px,T+ph+6);});
    var sx=L+(sp-g.lo)/(g.hi-g.lo)*pw;
    if(sx>=L&&sx<=L+pw){x.save();x.strokeStyle='rgba(251,191,36,.9)';x.setLineDash([4,4]);x.lineWidth=1.2;
      x.beginPath();x.moveTo(sx,T);x.lineTo(sx,T+ph);x.stroke();x.restore();}
    var Sx=sp*(1+S.ui.shock/100),mx2=L+(Sx-g.lo)/(g.hi-g.lo)*pw,my=T+clamp(S.ui.days/g.md,0,1)*ph;
    if(mx2>=L&&mx2<=L+pw){x.strokeStyle='#e8eefc';x.lineWidth=1.6;x.beginPath();x.arc(mx2,my,5.5,0,7);x.stroke();
      x.fillStyle='rgba(232,238,252,.95)';x.beginPath();x.arc(mx2,my,2,0,7);x.fill();}
    x.strokeStyle='rgba(30,42,69,.9)';x.lineWidth=1;x.strokeRect(L,T,pw,ph);
    var hv=heat.hover||heat.cursor;
    if(hv){var hx=L+hv.c/(g.cols-1)*pw,hy=T+hv.r/(g.rows-1)*ph;
      x.strokeStyle='rgba(232,238,252,.7)';x.lineWidth=1;x.beginPath();
      x.moveTo(L,hy);x.lineTo(L+pw,hy);x.moveTo(hx,T);x.lineTo(hx,T+ph);x.stroke();
      x.beginPath();x.arc(hx,hy,3.4,0,7);x.fillStyle='#e8eefc';x.fill();
      var price=g.lo+(g.hi-g.lo)*hv.c/(g.cols-1),days=g.md*hv.r/(g.rows-1),v=g.vals[hv.r*g.cols+hv.c];
      var tip=q('heatTip');
      tip.innerHTML='<div class="tp">'+money(price)+'<small>T+'+Math.round(days)+'d</small></div>'+
        '<div class="tr"><span>Model P&L</span><b class="'+(v>=0?'up':'dn')+'">'+sign(v)+'</b></div>'+
        '<div class="tr"><span style="color:#5d6c92">click / Enter to apply</span></div>';
      tip.style.display='block';tip.style.left=clamp(hx+13,6,W-(tip.offsetWidth||165)-6)+'px';tip.style.top=clamp(hy-54,6,H-66)+'px';
      q('heatSummary').textContent='Price '+money(price)+', '+Math.round(days)+' days forward, model profit and loss '+sign(v)+'.';
    }else q('heatTip').style.display='none';
  }
  function heatCell(ev){var b=heat.box,g=heat.grid;if(!b||!g||!heat.c)return null;
    var r=heat.c.getBoundingClientRect(),px=ev.clientX-r.left,py=ev.clientY-r.top;
    if(px<b.L||px>b.L+b.pw||py<b.T||py>b.T+b.ph)return null;
    return{c:clamp(Math.round((px-b.L)/b.pw*(g.cols-1)),0,g.cols-1),r:clamp(Math.round((py-b.T)/b.ph*(g.rows-1)),0,g.rows-1)};}
  function applyHeatCell(cell){var g=heat.grid;if(!cell||!g)return;
    var price=g.lo+(g.hi-g.lo)*cell.c/(g.cols-1),days=g.md*cell.r/(g.rows-1),sp=spotOf(S.market);
    S.ui.shock=clamp(Math.round(((price/sp-1)*100)*2)/2,-S.ui.range,S.ui.range);
    S.ui.days=clamp(Math.round(days),0,maxDays());
    safe('deck',renderDeck);renderDynamic();persist();announce('Scenario applied.');
    toast('Scenario: spot '+(S.ui.shock>=0?'+':'')+S.ui.shock+'% · T+'+S.ui.days+'d');}

  /* ---------- Volatility ---------- */
  function drawVol(){
    var x=vol.x,W=vol.W,H=vol.H;if(!x||!W)return;x.clearRect(0,0,W,H);x.font='10px '+MF;
    var d=MKd(),L=46,R=16,T=18,B=26,pw=W-L-R,ph=H-T-B;
    var hint=function(t){x.fillStyle='#5d6c92';x.textAlign='center';x.textBaseline='middle';x.fillText(t,W/2,H/2);q('volInfo').textContent='—';};
    if(!d){hint('Preparing market data…');return;}
    var grid=function(yMin,yMax,xt){x.textAlign='right';x.textBaseline='middle';
      ticksOf(yMin,yMax,4).forEach(function(v){var y=T+(yMax-v)/(yMax-yMin)*ph;
        x.strokeStyle='rgba(30,42,69,.7)';x.lineWidth=1;x.beginPath();x.moveTo(L,y);x.lineTo(L+pw,y);x.stroke();
        x.fillStyle='#5d6c92';x.fillText(v.toFixed(0)+'%',L-6,y);});
      x.textAlign='center';x.textBaseline='top';xt.forEach(function(t){x.fillStyle='#5d6c92';x.fillText(t.l,t.x,T+ph+6);});};
    if(S.volMode==='smile'){
      var e=selExp();if(!e){hint('No expiry selected.');return;}
      var sp=d.spot,arr=d.instruments.filter(function(i){return i.expiry===e&&i.strike>=sp*0.82&&i.strike<=sp*1.18;});
      var cs=arr.filter(function(i){return i.type==='C';}).sort(function(a,b){return a.strike-b.strike;});
      var ps=arr.filter(function(i){return i.type==='P';}).sort(function(a,b){return a.strike-b.strike;});
      if(!cs.length&&!ps.length){hint('No strikes near spot.');return;}
      var all=cs.concat(ps),xs=all.map(function(i){return i.strike;}),lo=Math.min.apply(null,xs),hi=Math.max.apply(null,xs);
      var ivs=all.map(function(i){return i.iv*100;}),yMin=Math.min.apply(null,ivs),yMax=Math.max.apply(null,ivs);
      var pad=Math.max((yMax-yMin)*0.18,1);yMin=Math.max(0,yMin-pad);yMax+=pad;
      var X=function(k){return L+(k-lo)/((hi-lo)||1)*pw;},Y=function(v){return T+(yMax-v)/((yMax-yMin)||1)*ph;};
      grid(yMin,yMax,ticksOf(lo,hi,4).map(function(v){return{x:X(v),l:kfmt(v)};}));
      var line=function(list,col,lbl){if(list.length<2)return;
        x.save();x.strokeStyle=col;x.lineWidth=2;x.shadowColor=col+'88';x.shadowBlur=8;x.beginPath();
        list.forEach(function(i,n){var px=X(i.strike),py=Y(i.iv*100);n?x.lineTo(px,py):x.moveTo(px,py);});x.stroke();x.restore();
        x.fillStyle=col;list.forEach(function(i){x.beginPath();x.arc(X(i.strike),Y(i.iv*100),1.9,0,7);x.fill();});
        var last=list[list.length-1];x.textAlign='right';x.textBaseline='bottom';x.fillText(lbl,X(last.strike),Y(last.iv*100)-6);};
      line(cs,'#22d3ee','CALL IV');line(ps,'#e879f9','PUT IV');
      var sx=X(sp);if(sx>=L&&sx<=L+pw){x.save();x.strokeStyle='rgba(251,191,36,.9)';x.setLineDash([4,4]);x.lineWidth=1.2;
        x.beginPath();x.moveTo(sx,T);x.lineTo(sx,T+ph);x.stroke();x.restore();
        x.fillStyle='#fbbf24';x.textAlign='center';x.textBaseline='top';x.fillText('SPOT',sx,T+2);}
      var k=nearest(e,sp),ci=instAt(e,k,'C'),pi=instAt(e,k,'P'),sk=(ci&&pi)?((pi.iv-ci.iv)*100):null;
      var txt=fmtExp(e)+' · ATM '+(atmIvAt(e)*100).toFixed(1)+'%'+(sk!=null?' · put-call skew '+(sk>=0?'+':'')+sk.toFixed(1)+' pts':'');
      q('volInfo').textContent=txt;q('volSummary').textContent='Volatility smile. '+txt;
    }else{
      var pts=d.expiries.map(function(e2){var k2=nearest(e2,d.spot),c2=instAt(e2,k2,'C'),p2=instAt(e2,k2,'P');
        var a2=[c2,p2].filter(Boolean).map(function(i){return i.iv*100;});
        return a2.length?{x:dLeft(e2),y:a2.reduce(function(u,v){return u+v;},0)/a2.length,e:e2}:null;}).filter(Boolean);
      if(pts.length<2){hint('Not enough expiries for a term curve.');return;}
      var hi2=Math.max.apply(null,pts.map(function(p){return p.x;}))*1.05,ys=pts.map(function(p){return p.y;});
      var yMn=Math.min.apply(null,ys),yMx=Math.max.apply(null,ys),pd=Math.max((yMx-yMn)*0.25,1);
      yMn=Math.max(0,yMn-pd);yMx+=pd;
      var X2=function(v){return L+v/(hi2||1)*pw;},Y2=function(v){return T+(yMx-v)/((yMx-yMn)||1)*ph;};
      grid(yMn,yMx,ticksOf(0,hi2,4).map(function(v){return{x:X2(v),l:Math.round(v)+'d'};}));
      x.save();x.strokeStyle='#fbbf24';x.lineWidth=2.2;x.shadowColor='rgba(251,191,36,.5)';x.shadowBlur=9;x.beginPath();
      pts.forEach(function(p,n){var px=X2(p.x),py=Y2(p.y);n?x.lineTo(px,py):x.moveTo(px,py);});x.stroke();x.restore();
      pts.forEach(function(p,n){var px=X2(p.x),py=Y2(p.y);x.fillStyle='#fbbf24';x.beginPath();x.arc(px,py,3,0,7);x.fill();
        if(n===0||n===pts.length-1||pts.length<7){x.fillStyle='#e8eefc';x.textAlign='center';x.textBaseline='bottom';x.fillText(p.y.toFixed(0)+'%',px,py-7);}});
      var t2=pts.length+' expiries · front '+pts[0].y.toFixed(1)+'% · back '+pts[pts.length-1].y.toFixed(1)+'% · '+(pts[pts.length-1].y>pts[0].y?'contango':'backwardation');
      q('volInfo').textContent=t2;q('volSummary').textContent='Volatility term structure. '+t2;
    }
  }

  /* ---------- Renders ---------- */
  function sliderFill(el){if(!el)return;var p=(el.value-el.min)/(el.max-el.min)*100;
    el.style.background='linear-gradient(90deg,#22d3ee '+p+'%,#1e2a45 '+p+'%)';}
  function renderDeck(){
    var d=MKd(),opts=(d&&d.expiries.length)?d.expiries.map(function(e){
      return '<option value="'+e+'"'+(e===selExp()?' selected':'')+'>'+fmtExp(e)+' · '+leftTxt(e)+(dLeft(e)<1?' · 0DTE':'')+'</option>';}).join(''):'<option>loading…</option>';
    q('expiry').innerHTML=opts;
    if(q('qExpiry'))q('qExpiry').innerHTML=opts;
    var popts='<option value="">Load a strategy…</option>'+PRESETS.map(function(p){return '<option value="'+p.id+'">'+p.name+'</option>';}).join('');
    q('preset').innerHTML=popts;
    if(q('qPreset'))q('qPreset').innerHTML=popts;
    var cur=null;PRESETS.forEach(function(p){if(p.name===S.presetName)cur=p;});
    q('preset').value=cur?cur.id:'';if(q('qPreset'))q('qPreset').value=cur?cur.id:'';
    Array.prototype.slice.call(q('curSeg').children).forEach(function(b){b.classList.toggle('on',b.getAttribute('data-cur')===S.market);});
    if(q('qMarket'))q('qMarket').value=S.market;
    Array.prototype.slice.call(q('sideSeg').children).forEach(function(b){b.classList.toggle('on',+b.getAttribute('data-side')===S.sideMode);});
    q('sideSeg').classList.toggle('sell',S.sideMode===-1);
    q('qSide').textContent=S.sideMode===1?'BUY':'SELL';
    q('chainMode').className='mode '+(S.sideMode===1?'b':'s');q('chainMode').textContent='MODE: '+(S.sideMode===1?'BUY':'SELL');
    q('chainWrap').classList.toggle('sellmode',S.sideMode===-1);
    var denBtns=Array.prototype.slice.call(q('denSeg').children);
    denBtns.forEach(function(b){b.classList.toggle('on',b.getAttribute('data-den')===S.denom);
      b.disabled=MK().kind==='index'&&b.getAttribute('data-den')==='COIN';});
    if(denBtns[0])denBtns[0].textContent=MK().kind==='index'?'Cash (INR)':'Cash (USD)';
    if(denBtns[1])denBtns[1].textContent=MK().kind==='index'?'Coin n/a':'Coin ('+S.market+')';
    Array.prototype.slice.call(q('volSeg').children).forEach(function(b){b.classList.toggle('on',b.getAttribute('data-vol')===S.volMode);});
    q('lotBox').style.display=MK().kind==='index'?'block':'none';
    q('account').value=String(S.account);q('lot').value=String(S.lot);
    q('fee').value=String(S.fee);q('slip').value=String(S.slip);q('risk').value=String(S.risk);
    q('entryMode').value=S.entryMode;
    var md=maxDays();
    ['days','qDays'].forEach(function(n){var el=q(n);if(!el)return;el.max=String(md);el.value=String(clamp(S.ui.days,0,md));sliderFill(el);});
    ['shock','qShock'].forEach(function(n){var el=q(n);if(!el)return;el.min=String(-S.ui.range);el.max=String(S.ui.range);el.value=String(clamp(S.ui.shock,-S.ui.range,S.ui.range));sliderFill(el);});
    ['iv','qIv'].forEach(function(n){var el=q(n);if(!el)return;el.value=String(S.ui.iv);sliderFill(el);});
    q('range').value=String(S.ui.range);sliderFill(q('range'));
    q('t0').checked=S.ui.t0;q('fill').checked=S.ui.fill;q('cone').checked=S.ui.cone;
    q('winVal').textContent='±'+S.ui.win;q('sortBtn').textContent=(S.ui.sortAsc?'↑':'↓')+' Strikes';
    q('daysV').textContent='T+'+S.ui.days+'d';q('ivV').textContent=(S.ui.iv>=0?'+':'')+S.ui.iv;
    q('shockV').textContent=(S.ui.shock>=0?'+':'')+S.ui.shock+'%';q('rangeV').textContent=S.ui.range+'%';
    q('qDaysV').textContent=S.ui.days;q('qIvV').textContent=S.ui.iv;q('qShockV').textContent=S.ui.shock;
    q('unpinBtn').disabled=!S.pinned;histBtns();
  }
  function renderLegs(flashId){
    var ids={};S.legs.forEach(function(l){ids[l.id]=1;});Object.keys(S.sel).forEach(function(k){if(!ids[k])delete S.sel[k];});
    var box=q('legs'),n=Object.keys(S.sel).length;
    q('legCount').textContent=S.legs.length+' / '+CONFIG.MAX_LEGS;
    q('selAll').checked=S.legs.length>0&&n===S.legs.length;
    q('bulk').style.display=n?'flex':'none';q('bulkCount').textContent=n+' selected';
    if(!S.legs.length){box.innerHTML='<div class="empty">No legs yet. Load a preset above,<br>or click premiums in the chain.</div>';return;}
    var d=MKd();
    box.innerHTML=S.legs.map(function(l,ix){
      var ks=strikesAt(l.expiry),ko=ks.length?ks:[l.strike];
      var ex=d?d.expiries:[],eo=ex.indexOf(l.expiry)>=0?ex:[l.expiry].concat(ex);
      var expired=l.expiry<=Date.now();
      return '<div class="leg'+(l.id===flashId?' flash':'')+(S.sel[l.id]?' sel':'')+'" data-leg="'+l.id+'">'+
        '<div class="ltop">'+
        '<input type="checkbox" class="chk" data-in="legSel" data-leg="'+l.id+'"'+(S.sel[l.id]?' checked':'')+' aria-label="Select leg">'+
        '<span class="drag" draggable="true" title="Drag to reorder">⠿</span>'+
        '<span class="mini"><button type="button" data-act="leg-move" data-leg="'+l.id+'" data-d="-1"'+(ix===0?' disabled':'')+' aria-label="Move up">▲</button>'+
        '<button type="button" data-act="leg-move" data-leg="'+l.id+'" data-d="1"'+(ix===S.legs.length-1?' disabled':'')+' aria-label="Move down">▼</button></span>'+
        '<button type="button" class="tside '+(l.side===1?'b':'s')+'" data-act="leg-side" data-leg="'+l.id+'">'+(l.side===1?'BUY':'SELL')+'</button>'+
        '<button type="button" class="ttype '+(l.type==='P'?'p':'')+'" data-act="leg-type" data-leg="'+l.id+'">'+(l.type==='C'?'CALL':'PUT')+'</button>'+
        '<div class="qty"><button type="button" data-act="leg-qty" data-leg="'+l.id+'" data-d="-1">−</button><span>'+l.qty+'</span><button type="button" data-act="leg-qty" data-leg="'+l.id+'" data-d="1">+</button></div>'+
        '<button type="button" class="lx" data-act="leg-rm" data-leg="'+l.id+'" aria-label="Remove leg">✕</button></div>'+
        '<div class="lsel"><select data-in="legStrike" data-leg="'+l.id+'" aria-label="Strike">'+ko.map(function(k){return '<option value="'+k+'"'+(k===l.strike?' selected':'')+'>K '+kfmt(k)+'</option>';}).join('')+'</select>'+
        '<select data-in="legExpiry" data-leg="'+l.id+'" aria-label="Expiry">'+eo.map(function(e){return '<option value="'+e+'"'+(e===l.expiry?' selected':'')+'>'+fmtExp(e)+'</option>';}).join('')+'</select>'+
        '<input type="text" inputmode="decimal" data-in="legIv" data-leg="'+l.id+'" value="'+(l.ivOverride!=null?l.ivOverride:'')+'" placeholder="IV%" title="Optional IV override in percent" aria-label="IV override percent"></div>'+
        '<div class="lmeta"><span>entry '+money(l.premium,2)+'</span><span class="lm">mark '+money(l.liveMark,2)+'</span>'+
        '<span class="iv l_iv">IV '+(legIv(l)*100).toFixed(1)+'%</span>'+(l.ivOverride!=null?'<span class="ovr">IV override</span>':'')+
        (l.synthetic?'<span class="ovr">model px</span>':'')+(expired?'<span class="ex">EXPIRED</span>':'')+'</div></div>';}).join('');
  }
  function renderLegMarks(){S.legs.forEach(function(l){
    var row=q('legs').querySelector('[data-leg="'+l.id+'"].leg');if(!row)return;
    var m=row.querySelector('.lm'),i=row.querySelector('.l_iv');
    if(m)m.textContent='mark '+money(l.liveMark,2);if(i)i.textContent='IV '+(legIv(l)*100).toFixed(1)+'%';});}
  function setTxt(n,t,cls){var el=q(n);if(!el)return;el.textContent=t;el.classList.remove('up','dn');if(cls)el.classList.add(cls);}
  function renderMetrics(){
    var a=getAnalytics();
    if(!a){['mMaxP','mMaxL','mPrem','mRR','mPOP','gD','gG','gT','gV','scenPnl','mMargin','mNotional'].forEach(function(n){var e=q(n);if(e)e.textContent='—';});
      q('mBE').textContent='—';q('popBar').style.width='0%';q('mPremK').textContent='Net Premium';
      q('mRisk').textContent='capital at risk';q('scenSub').textContent='P&L under your scenario';q('mFees').textContent='fees included';return;}
    setTxt('mMaxP',sign(a.maxP),'up');setTxt('mMaxL',sign(a.maxL),'dn');
    q('mRisk').textContent=!isFinite(a.maxL)?'unbounded risk':(Math.abs(a.maxL)/S.account*100).toFixed(1)+'% of account';
    q('mBE').innerHTML=a.bes.length?a.bes.map(function(b){return '<span class="be">'+compact(b)+'</span>';}).join(''):'<span style="color:#5d6c92">none in range</span>';
    q('mBEnote').textContent=a.exact?'exact (piecewise)':'numeric (multi-expiry / coin)';
    q('mPremK').textContent=a.netPrem>=0?'Net Credit':'Net Debit';
    setTxt('mPrem',money(Math.abs(a.netPrem),2),a.netPrem>=0?'up':'');
    q('mFees').textContent='round-trip fees '+money(a.fees,2);
    q('mRR').textContent=!isFinite(a.rr)?'∞':a.rr.toFixed(2)+'×';
    q('mPOP').textContent=(a.pop*100).toFixed(1)+'%';q('popBar').style.width=(a.pop*100).toFixed(1)+'%';
    q('mMargin').textContent=money(a.margin,0);q('mNotional').textContent=compact(a.notional);
    q('mLot').textContent=(MK().kind==='index'?S.lot+' × lot':'1 coin / contract');
    q('gD').textContent=(a.g.d>=0?'+':'')+a.g.d.toFixed(3);
    q('gG').textContent=(a.g.g>=0?'+':'')+a.g.g.toFixed(6);
    q('gT').textContent=sign(a.g.t,2);q('gT').className='gv '+(a.g.t>=0?'up':'dn');
    q('gV').textContent=sign(a.g.v,2);
    var sp=q('scenPnl');sp.textContent=sign(a.scenNow);sp.className='sbig '+(a.scenNow>=0?'up':'dn');
    q('scenSub').textContent='T+'+S.ui.days+'d · IV '+(S.ui.iv>=0?'+':'')+S.ui.iv+'pt · spot '+(S.ui.shock>=0?'+':'')+S.ui.shock+'% → '+money(a.Sx)+' (expiry: '+sign(a.scenExp)+')';
    q('chartSummary').textContent='Payoff chart. '+(S.presetName||'Custom')+' with '+S.legs.length+' legs on '+S.market+
      '. Maximum profit '+sign(a.maxP)+', maximum loss '+sign(a.maxL)+', breakevens '+(a.bes.map(function(b){return money(b);}).join(' and ')||'none')+
      ', probability of profit '+(a.pop*100).toFixed(0)+' percent.';
  }
  function renderExplain(){
    var a=getAnalytics(),box=q('explain');
    if(!a){box.textContent='Load a preset or add legs to see a plain-English explanation.';return;}
    var sp=spotOf(S.market),H=a.H,legs=S.legs.map(function(l){
      return (l.side===1?'buy':'sell')+' '+l.qty+' '+kfmt(l.strike)+' '+(l.type==='C'?'call':'put')+' ('+fmtExp(l.expiry)+')';}).join('; ');
    var beTxt=a.bes.length?a.bes.map(function(b){return money(b);}).join(' and '):'no breakeven inside the modelled range';
    var zone='';
    if(a.bes.length===2)zone='The position is profitable between '+money(a.bes[0])+' and '+money(a.bes[1])+' at the horizon.';
    else if(a.bes.length===1)zone=(pnlExp(sp*1.2)>0?'Above ':'Below ')+money(a.bes[0])+' the position is profitable at the horizon.';
    else zone=a.pop>0.5?'The modelled payoff stays positive across most of the range.':'The modelled payoff stays negative across most of the range.';
    var theta=a.g.t>=0?'Time decay works in your favour (positive theta).':'Time decay works against you (negative theta).';
    var vol=a.g.v>=0?'Rising implied volatility helps this position.':'Rising implied volatility hurts this position.';
    box.innerHTML='<b>'+esc(S.presetName||'Custom structure')+' on '+S.market+'</b> — you '+legs+'. '+
      (a.netPrem>=0?'It is entered for a net credit of <b>'+money(a.netPrem,2)+'</b>.':'It costs a net debit of <b>'+money(Math.abs(a.netPrem),2)+'</b>.')+
      ' Including round-trip fees of '+money(a.fees,2)+', the best case at the '+fmtExp(H)+' horizon is <b>'+sign(a.maxP)+'</b> and the worst case is <b>'+sign(a.maxL)+'</b>. '+
      'Breakeven: '+beTxt+'. '+zone+' '+theta+' '+vol+
      ' A one-standard-deviation move by that horizon is about '+money(Math.abs(a.cone.s1h-sp))+' ('+((a.cone.s1h/sp-1)*100).toFixed(1)+'%), which is why the model puts the probability of profit near <b>'+(a.pop*100).toFixed(0)+'%</b>. '+
      'At the current spot of '+money(sp)+', notional exposure is '+compact(a.notional)+' and the rough margin requirement is '+money(a.margin,0)+'.';
  }
  function renderChartSub(){
    var d=MKd(),a=getAnalytics(),el=q('chartSub');
    if(!d){el.textContent='Preparing market…';return;}
    el.textContent=S.market+' · spot '+money(d.spot)+' · '+(S.presetName||'Custom')+' · '+S.legs.length+' legs · '+
      (isCoin()?'coin-settled':sym()+'-settled')+' · '+(d.demo?'SIMULATED':(live.on?'streaming':'live'))+' '+new Date(d.at).toLocaleTimeString()+
      (a&&S.ui.cone?' · 1σ ±'+money(Math.abs(a.cone.s1h-d.spot))+' by '+fmtExp(a.H):'');
  }
  function renderNote(){
    var a=getAnalytics(),el=q('note');if(!el)return;
    var fk=Object.keys(faults);
    if(fk.length){el.textContent='Some panels could not render ('+fk.join(', ')+'). Market data is unaffected — adjust a control to retry.';return;}
    if(!a){el.textContent='Educational estimates only.';return;}
    el.textContent=(a.multi?'Multi-expiry: the expiry curve marks far legs to model at the '+fmtExp(a.H)+' horizon. ':'')+
      (isCoin()?'Coin denomination: inverse settlement, fees converted at spot. ':'')+
      'Greeks are in '+sym()+'. POP uses ATM IV of the payoff horizon. Margin is a conservative naked-rule estimate without spread offsets. Educational only.';
  }
  // v3.2: on-demand rendering — अनेक बदल एकाच frame मध्ये; काही बदललं नसेल तर canvas पुन्हा काढत नाही
  var frameQ={dyn:false,over:false};
  function kick(){if(dead||raf)return;raf=requestAnimationFrame(frame);}
  function frame(){raf=0;if(dead)return;
    if(frameQ.dyn){frameQ.dyn=false;doDynamic();}
    if(frameQ.over){frameQ.over=false;safe('overlay',drawOverlay);}
    if(heat.dirty){heat.dirty=false;safe('heat',drawHeat);}}
  function renderDynamic(){frameQ.dyn=true;frameQ.over=true;kick();}
  function doDynamic(){
    safe('curves',buildCurves);safe('chart',drawBase);safe('metrics',renderMetrics);
    safe('chart-sub',renderChartSub);safe('chart-tip',chartTip);
    safe('heat-build',function(){buildHeat(false);});safe('heat',drawHeat);safe('explain',renderExplain);
    renderNote();
  }
  function visibleStrikes(){
    var d=MKd(),e=selExp();if(!d||!e)return[];
    var rows={},ks=[];d.instruments.forEach(function(i){if(i.expiry===e&&!rows[i.strike]){rows[i.strike]=1;ks.push(i.strike);}});
    ks.sort(function(a,b){return a-b;});if(!ks.length)return[];
    var atm=ks.reduce(function(b,k){return Math.abs(k-d.spot)<Math.abs(b-d.spot)?k:b;},ks[0]),f=S.ui.filter.trim();
    if(f)ks=ks.filter(function(k){return String(k).indexOf(f)>=0;}).slice(0,80);
    else{var ai=ks.indexOf(atm);ks=ks.slice(Math.max(0,ai-S.ui.win),ai+S.ui.win+1);}
    if(!S.ui.sortAsc)ks=ks.slice().reverse();
    return ks;
  }
  var chainCells={};
  function renderChain(){
    var d=MKd(),body=q('chainBody'),head=q('chainHead'),tabs=q('tabs'),empty=q('chainEmpty'),tbl=q('chainTable');
    chainCells={};
    if(!d||!selExp()){body.innerHTML='';head.innerHTML='';tabs.innerHTML='';empty.style.display='block';
      empty.textContent=d?'No expiries available.':'Preparing market…';q('chainInfo').textContent='—';return;}
    tabs.innerHTML=d.expiries.map(function(e){return '<button type="button" class="tab'+(e===selExp()?' on':'')+'" data-act="tab" data-exp="'+e+'">'+
      fmtExp(e)+' · '+leftTxt(e)+(dLeft(e)<1?' 0DTE':'')+'</button>';}).join('');
    var e=selExp(),sp=d.spot,rows={};
    d.instruments.forEach(function(i){if(i.expiry!==e)return;if(!rows[i.strike])rows[i.strike]={};rows[i.strike][i.type]=i;});
    var ks=visibleStrikes();
    tbl.classList.toggle('compact',S.compact);
    head.innerHTML=S.compact
      ? '<tr><th class="c" colspan="2" style="text-align:right">CALLS</th><th class="sth" rowspan="2" style="text-align:center;vertical-align:bottom">STRIKE</th><th class="p" colspan="2" style="text-align:left">PUTS</th></tr><tr><th>IV</th><th style="text-align:right">Mark</th><th style="text-align:left">Mark</th><th>IV</th></tr>'
      : '<tr><th class="c" colspan="3" style="text-align:right">CALLS</th><th rowspan="2" style="text-align:center;vertical-align:bottom">STRIKE</th><th class="p" colspan="3" style="text-align:left">PUTS</th></tr><tr><th scope="col">OI</th><th scope="col">IV</th><th scope="col" style="text-align:right">Mark</th><th scope="col" style="text-align:left">Mark</th><th scope="col">IV</th><th scope="col">OI</th></tr>';
    if(!ks.length){body.innerHTML='';empty.style.display='block';empty.textContent='No strikes match this filter.';return;}
    empty.style.display='none';
    var ivs=[],oiMax=1,all={};
    d.instruments.forEach(function(i){if(i.expiry===e){all[i.strike]=1;ivs.push(i.iv);oiMax=Math.max(oiMax,i.oi);}});
    var atm=Object.keys(all).map(Number).reduce(function(b,k){return Math.abs(k-sp)<Math.abs(b-sp)?k:b;},Number(Object.keys(all)[0]));
    var ivMin=ivs.length?Math.min.apply(null,ivs):0,ivMax=ivs.length?Math.max.apply(null,ivs):1,ivSpan=Math.max(ivMax-ivMin,0.01);
    var cell=function(i,side){
      if(!i)return S.compact?'<td colspan="2" style="color:#3b4a70;text-align:center">—</td>':'<td colspan="3" style="color:#3b4a70;text-align:center">—</td>';
      var heatA=(0.03+0.22*clamp((i.iv-ivMin)/ivSpan,0,1)).toFixed(3);
      var itm=side==='C'?i.strike<sp:i.strike>sp,oiW=Math.round(i.oi/oiMax*100);
      var mk='<td class="'+(itm?'itm':'')+'"><button type="button" class="prem" data-act="chain-add" data-strike="'+i.strike+'" data-type="'+i.type+'" data-inst="'+esc(i.name)+'">'+money(i.mark,2)+'</button></td>';
      var iv='<td class="civ" style="background:rgba(232,121,249,'+heatA+');color:#f0abfc">'+(i.iv*100).toFixed(1)+'</td>';
      var oi='<td><div class="oi"><i style="width:'+oiW+'%"></i><span>'+kfmt(i.oi)+'</span></div></td>';
      return S.compact?(side==='C'?iv+mk:mk+iv):(side==='C'?oi+iv+mk:mk+iv+oi);};
    body.innerHTML=ks.map(function(k){var r=rows[k]||{};
      return '<tr class="'+(k===atm?'atm':'')+'">'+cell(r.C,'C')+
        '<td class="st"><button type="button" data-act="drawer-open" data-strike="'+k+'">'+kfmt(k)+
        (k===atm?'<span class="atmc">ATM</span>':'')+(dLeft(e)<1?'<span class="zd">0D</span>':'')+'</button></td>'+cell(r.P,'P')+'</tr>';}).join('');
    Array.prototype.slice.call(body.querySelectorAll('.prem')).forEach(function(btn){
      var nm=btn.getAttribute('data-inst');if(!nm)return;
      var td=btn.parentNode,tr=td.parentNode,ix=Array.prototype.indexOf.call(tr.children,td);
      chainCells[nm]={btn:btn,iv:tr.children[ix+(btn.getAttribute('data-type')==='C'?-1:1)]};});
    q('chainInfo').textContent=fmtExp(e)+' · '+leftTxt(e)+' · ATM IV '+(atmIvAt(e)*100).toFixed(1)+'%';
    q('chainNote').textContent='Prices in '+sym()+(MK().kind==='crypto'?' (Deribit coin quotes converted at index)':' (per unit; multiply by lot for position value)')+
      '. Magenta = IV heat · cyan bar = open interest. '+(d.demo?'SIMULATED DATA — not tradable.':'Source: '+d.src+'.');
  }
  function patchChainCell(i){var c=chainCells[i.name];if(!c)return;
    c.btn.textContent=money(i.mark,2);
    if(c.iv&&c.iv.classList&&c.iv.classList.contains('civ'))c.iv.textContent=(i.iv*100).toFixed(1);
    if(!RM){c.btn.classList.remove('tick');void c.btn.offsetWidth;c.btn.classList.add('tick');}}
  var tkBuilt=false;
  function renderTicker(){
    var items=[['st','STATUS'],['btc','BTC'],['eth','ETH'],['idx',S.market],['iv','ATM IV'],['exp','NEXT EXPIRY'],['oi','OI'],['vol','VOL'],['acc','ACCOUNT']];
    if(!tkBuilt){var html='<span class="tgroup">'+items.map(function(it){return '<span>'+it[1]+' <b data-tk="'+it[0]+'">—</b></span>';}).join('')+'</span>';
      q('ttrack').innerHTML=html+html;tkBuilt=true;}
    var d=MKd(),oi=0,vl=0;if(d)d.instruments.forEach(function(i){oi+=i.oi;vl+=i.vol;});
    var vals={st:(S.status==='live'?(live.on?'● LIVE ⚡':'● LIVE'):S.status==='demo'?'● DEMO':'● '+S.status.toUpperCase()),
      btc:money(spotOf('BTC')),eth:money(spotOf('ETH')),idx:money(spotOf(S.market)),
      iv:(atmIvAt(selExp())*100).toFixed(1)+'%',exp:selExp()?fmtExp(selExp())+' ('+leftTxt(selExp())+')':'—',
      oi:kfmt(oi),vol:compact(vl),acc:money(S.account)};
    Array.prototype.slice.call(q('ttrack').querySelectorAll('[data-tk]')).forEach(function(el){
      var v=vals[el.getAttribute('data-tk')];if(v!=null&&el.textContent!==v)el.textContent=v;});
    var sp=spotOf(S.market),el=q('spot');el.textContent=S.market+' '+money(sp);
    if(prevSpot!=null&&sp!==prevSpot&&!RM){el.classList.remove('fu','fd');void el.offsetWidth;
      el.classList.add(sp>prevSpot?'fu':'fd');later(600,function(){el.classList.remove('fu','fd');});}
    prevSpot=sp;
  }
  function renderSaved(){
    var box=q('savedList'),list=S.saved.slice();
    if(S.savedSearch){var f=S.savedSearch.toLowerCase();list=list.filter(function(s){return s.name.toLowerCase().indexOf(f)>=0;});}
    if(S.savedSort==='name')list.sort(function(a,b){return a.name.localeCompare(b.name);});
    else if(S.savedSort==='legs')list.sort(function(a,b){return b.legs.length-a.legs.length;});
    else list.sort(function(a,b){return b.ts-a.ts;});
    if(!list.length){box.innerHTML='<div class="empty">'+(S.saved.length?'No saved strategy matches.':'Nothing saved yet — strategies persist in this browser.')+'</div>';return;}
    box.innerHTML=list.map(function(s){var ix=S.saved.indexOf(s);
      var nm=S.editing===ix?'<input type="text" data-in="rename" data-idx="'+ix+'" value="'+esc(s.name)+'" maxlength="40">'
        :'<div class="nm">'+esc(s.name)+'</div>';
      return '<div class="savedrow"><div style="min-width:0;flex:1">'+nm+'<div class="mt">'+esc(s.market)+' · '+s.legs.length+' legs · '+new Date(s.ts).toLocaleDateString()+'</div></div>'+
        '<div class="row"><button class="btn sm" type="button" data-act="saved-load" data-idx="'+ix+'">Load</button>'+
        '<button class="btn sm" type="button" data-act="saved-rename" data-idx="'+ix+'" aria-label="Rename">✎</button>'+
        '<button class="lx" type="button" data-act="saved-del" data-idx="'+ix+'" aria-label="Delete">✕</button></div></div>';}).join('');
    var inp=box.querySelector('[data-in="rename"]');if(inp){inp.focus();inp.select();}
  }
  // v3.2: live refresh वर हलका render — user टाईप करत असेल तर deck/legs ला हात लावत नाही
  function softRender(){
    var ae=document.activeElement,typing=ae&&(root.contains(ae)||portal.contains(ae))&&/INPUT|SELECT|TEXTAREA/.test(ae.tagName);
    if(!typing)safe('deck',renderDeck);
    safe('chain',renderChain);safe('leg-marks',renderLegMarks);renderDynamic();
    safe('ticker',renderTicker);safe('vol',drawVol);
  }
  function renderAll(){
    safe('deck',renderDeck);safe('legs',renderLegs);safe('chain',renderChain);
    renderDynamic();
    safe('ticker',renderTicker);safe('saved',renderSaved);safe('vol',drawVol);
    renderNote();
  }

  /* ---------- Drawer ---------- */
  var drawerStrike=null,lastFocus=null;
  function openDrawer(k){
    drawerStrike=k;var e=selExp(),d=MKd();if(!d||!e)return;
    lastFocus=document.activeElement;
    q('drawerTitle').textContent=S.market+' '+kfmt(k)+' · '+fmtExp(e);
    var block=function(t){
      var i=instAt(e,k,t),sp=d.spot,T=Math.max((e-Date.now())/YEAR,1/(365*1440)),syn=!i;
      if(syn){var iv=smile(sp,k,atmIvAt(e));i={name:S.market+'-'+expName(e)+'-'+k+'-'+t,mark:bs(sp,k,T,iv,t,MK().rate).price,iv:iv,oi:0,vol:0,bid:0,ask:0,fwd:sp};}
      var g=bs(i.fwd||sp,k,T,i.iv,t,MK().rate);
      return '<div class="dinst"><h5 style="color:'+(t==='C'?'#34d399':'#fb4d6d')+'">'+esc(i.name)+(syn?' <span style="color:#fbbf24;font-size:10px">· model estimate</span>':'')+'</h5>'+
        '<div class="dst"><div>Mark <b>'+money(i.mark,2)+'</b></div><div>IV <b style="color:#e879f9">'+(i.iv*100).toFixed(1)+'%</b></div>'+
        '<div>Delta <b>'+g.delta.toFixed(3)+'</b></div><div>Theta/day <b>'+sign(g.theta*lot(),2)+'</b></div>'+
        '<div>Bid <b>'+(i.bid?money(i.bid,2):'—')+'</b></div><div>Ask <b>'+(i.ask?money(i.ask,2):'—')+'</b></div>'+
        '<div>OI <b>'+kfmt(i.oi)+'</b></div><div>Volume <b>'+compact(i.vol)+'</b></div></div>'+
        '<div class="dbtn"><button class="btn dbuy" type="button" data-act="drawer-add" data-side="1" data-type="'+t+'">Buy '+(t==='C'?'Call':'Put')+'</button>'+
        '<button class="btn dsell" type="button" data-act="drawer-add" data-side="-1" data-type="'+t+'">Sell '+(t==='C'?'Call':'Put')+'</button></div></div>';};
    q('drawerBody').innerHTML=block('C')+block('P');
    q('drawer').classList.add('open');q('drawer').setAttribute('aria-hidden','false');q('scrim').classList.add('open');
    q('drawerClose').focus();
  }
  function closeDrawer(){q('drawer').classList.remove('open');q('drawer').setAttribute('aria-hidden','true');
    q('scrim').classList.remove('open');drawerStrike=null;if(lastFocus&&lastFocus.focus)lastFocus.focus();}
  function trapFocus(ev){
    if(ev.key!=='Tab'||!q('drawer').classList.contains('open'))return;
    var f=Array.prototype.slice.call(q('drawer').querySelectorAll('button,input,select,[tabindex]:not([tabindex="-1"])')).filter(function(e){return !e.disabled;});
    if(!f.length)return;var first=f[0],last=f[f.length-1];
    if(ev.shiftKey&&document.activeElement===first){ev.preventDefault();last.focus();}
    else if(!ev.shiftKey&&document.activeElement===last){ev.preventDefault();first.focus();}}

  /* ---------- Toast ---------- */
  function toast(msg,undoFn){
    var box=q('toasts');if(!box)return;while(box.children.length>=3)box.removeChild(box.firstChild);
    var t=document.createElement('div');t.className='toast';t.innerHTML='<span>'+esc(msg)+'</span>';
    var kill=function(){t.classList.add('bye');later(320,function(){if(t.parentNode)t.parentNode.removeChild(t);});};
    if(undoFn){var b=document.createElement('button');b.type='button';b.textContent='UNDO';
      b.onclick=function(){undoFn();kill();};t.appendChild(b);}
    box.appendChild(t);later(6500,kill);}
  function announce(t){var el=q('live');if(el)el.textContent=t;}

  /* ---------- Save / export / share / report ---------- */
  function saveCurrent(){
    if(!S.legs.length){toast('Add some legs first.');return;}
    var name=(q('saveName').value.trim()||((S.presetName||'Custom')+' · '+S.market)).slice(0,40);
    S.saved.unshift({name:name,market:S.market,ts:Date.now(),legs:JSON.parse(JSON.stringify(S.legs))});
    S.saved=S.saved.slice(0,40);q('saveName').value='';persist();renderSaved();track('save',{market:S.market});
    toast('Saved "'+name+'" in this browser.');}
  function exportJSON(){
    if(!S.legs.length){toast('No legs to export.');return;}
    var payload={app:'OptionForge',v:3,name:S.presetName||'Custom',market:S.market,denom:S.denom,
      spot:spotOf(S.market),account:S.account,lot:S.lot,fee:S.fee,created:new Date().toISOString(),legs:S.legs};
    var blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
    var a=document.createElement('a');a.download='optionforge-'+S.market+'-strategy.json';a.href=URL.createObjectURL(blob);a.click();
    later(2000,function(){URL.revokeObjectURL(a.href);});track('export_json',{market:S.market});toast('Strategy exported as JSON.');}
  function importFile(file){
    var r=new FileReader();
    r.onload=function(){try{
      var o=JSON.parse(r.result);
      if(!o||o.app!=='OptionForge')throw new Error('Not an OptionForge strategy file');
      if(!isFinite(o.v)||o.v>3)throw new Error('Unsupported file version '+o.v+' — export it again from v3');
      if(!Array.isArray(o.legs))throw new Error('No legs array in file');
      var m=MARKETS[o.market]?o.market:(MARKETS[o.currency]?o.currency:'BTC');
      var legs=o.legs.filter(validLeg).slice(0,CONFIG.MAX_LEGS).map(function(l){return normLeg(l,m);});
      if(!legs.length)throw new Error('No valid legs found');
      if(m!==S.market)setMarket(m);pushHist();
      S.legs=legs;S.sel={};S.presetName=o.name||'Imported';
      if(isFinite(o.account))S.account=+o.account;if(isFinite(o.fee))S.fee=+o.fee;
      persist();renderAll();syncSubs();track('import',{market:m});
      toast('Imported '+legs.length+' legs (file v'+o.v+').',undo);
    }catch(e){toast('Import failed: '+e.message);}};
    r.onerror=function(){toast('Import failed: could not read file.');};r.readAsText(file);}
  function encodeLink(){
    var p={m:S.market,d:S.denom,n:S.presetName,l:S.legs.map(function(l){
      return [l.type,l.side,l.strike,l.expiry,l.qty,+l.premium.toFixed(4),+l.iv.toFixed(4),l.ivOverride,+l.entrySpot.toFixed(2)];})};
    var b=btoa(encodeURIComponent(JSON.stringify(p)).replace(/%([0-9A-F]{2})/g,function(_,h){return String.fromCharCode(parseInt(h,16));}));
    return b.replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
  function decodeLink(code){
    try{var b=code.replace(/-/g,'+').replace(/_/g,'/');while(b.length%4)b+='=';
      var json=decodeURIComponent(atob(b).split('').map(function(c){return '%'+('00'+c.charCodeAt(0).toString(16)).slice(-2);}).join(''));
      var p=JSON.parse(json);if(!p||!MARKETS[p.m]||!Array.isArray(p.l))return null;
      var legs=p.l.map(function(a){return normLeg({type:a[0],side:a[1],strike:a[2],expiry:a[3],qty:a[4],premium:a[5],iv:a[6],ivOverride:a[7],entrySpot:a[8]},p.m);});
      return{market:p.m,denom:p.d==='COIN'?'COIN':'USD',name:p.n||'Shared setup',legs:legs};
    }catch(e){return null;}}
  function shareURL(){return location.href.split('#')[0]+'#of='+encodeLink();}
  function summaryText(){
    var a=getAnalytics();if(!a)return 'OptionForge strategy on '+S.market;
    return 'OptionForge — '+(S.presetName||'Custom')+' on '+S.market+'\n'+
      S.legs.map(function(l){return (l.side===1?'BUY':'SELL')+' '+l.qty+' × '+kfmt(l.strike)+(l.type)+' '+fmtExp(l.expiry);}).join('\n')+
      '\nSpot: '+money(spotOf(S.market))+' | Net '+(a.netPrem>=0?'credit ':'debit ')+money(Math.abs(a.netPrem),2)+
      '\nMax profit: '+sign(a.maxP)+' | Max loss: '+sign(a.maxL)+
      '\nBreakevens: '+(a.bes.map(function(b){return money(b);}).join(', ')||'—')+' | POP: '+(a.pop*100).toFixed(0)+'%'+
      '\nEducational estimate by Sahare Financial Services (advisor4u.in). Not investment advice.';}
  function copyLink(){
    var url=shareURL();
    try{history.replaceState(null,'','#of='+encodeLink());}catch(e){}
    var done=function(){toast('Shareable link copied.');track('copy_link',{market:S.market});};
    if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(url).then(done,function(){fallbackCopy(url,done);});
    else fallbackCopy(url,done);}
  function fallbackCopy(txt,cb){var ta=document.createElement('textarea');ta.value=txt;ta.style.position='fixed';ta.style.left='-9999px';
    document.body.appendChild(ta);ta.select();try{document.execCommand('copy');cb();}catch(e){toast('Copy failed — link is in the address bar.');}
    document.body.removeChild(ta);}
  function shareWA(){
    if(!S.legs.length){toast('Add legs first.');return;}
    var txt=summaryText()+'\n\nOpen and edit this setup: '+shareURL();
    window.open('https://wa.me/919405908605?text='+encodeURIComponent(txt),'_blank','noopener');
    track('share_whatsapp',{market:S.market});}
  function reportPDF(){
    var a=getAnalytics();if(!a){toast('Add legs first.');return;}
    var img='';try{img=chart.c.toDataURL('image/png');}catch(e){}
    var rows=S.legs.map(function(l){return '<tr><td>'+(l.side===1?'BUY':'SELL')+'</td><td>'+l.qty+'</td><td>'+kfmt(l.strike)+l.type+'</td><td>'+fmtExp(l.expiry)+
      '</td><td>'+money(l.premium,2)+'</td><td>'+(legIv(l)*100).toFixed(1)+'%</td></tr>';}).join('');
    var html='<!DOCTYPE html><html><head><meta charset="utf-8"><title>OptionForge Report — '+esc(S.presetName||'Custom')+'</title>'+
      '<style>body{font-family:Inter,Arial,sans-serif;color:#111;margin:26px;font-size:12px}h1{font-size:20px;margin:0 0 4px}h2{font-size:13px;margin:16px 0 6px;border-bottom:1px solid #ccc;padding-bottom:3px}'+
      'table{width:100%;border-collapse:collapse;font-size:11px}td,th{border:1px solid #ddd;padding:5px;text-align:left}th{background:#f2f5fa}'+
      '.m{display:flex;flex-wrap:wrap;gap:8px}.m div{border:1px solid #ddd;border-radius:6px;padding:6px 9px;min-width:150px}.m b{display:block;font-size:14px}'+
      '.f{margin-top:16px;font-size:9.5px;color:#555;border-top:1px solid #ccc;padding-top:8px}img{width:100%;border:1px solid #ddd;border-radius:6px;margin-top:6px}</style></head><body>'+
      '<h1>OptionForge — '+esc(S.presetName||'Custom strategy')+'</h1>'+
      '<div>Sahare Financial Services · advisor4u.in · '+esc(S.market)+' · '+new Date().toLocaleString()+' · '+(MKd()&&MKd().demo?'SIMULATED DATA':'Source: '+esc(MKd()?MKd().src:''))+'</div>'+
      '<h2>Key figures ('+(isCoin()?'coin-settled':sym()+'-settled')+')</h2><div class="m">'+
      '<div>Spot<b>'+money(spotOf(S.market))+'</b></div><div>Max profit<b>'+sign(a.maxP)+'</b></div><div>Max loss<b>'+sign(a.maxL)+'</b></div>'+
      '<div>Net '+(a.netPrem>=0?'credit':'debit')+'<b>'+money(Math.abs(a.netPrem),2)+'</b></div><div>Round-trip fees<b>'+money(a.fees,2)+'</b></div>'+
      '<div>Breakevens<b>'+(a.bes.map(function(b){return money(b);}).join(' / ')||'—')+'</b></div>'+
      '<div>Probability of profit<b>'+(a.pop*100).toFixed(1)+'%</b></div><div>Est. margin<b>'+money(a.margin,0)+'</b></div>'+
      '<div>Notional<b>'+compact(a.notional)+'</b></div><div>Delta / Theta<b>'+a.g.d.toFixed(3)+' / '+sign(a.g.t,2)+'</b></div></div>'+
      '<h2>Legs</h2><table><tr><th>Side</th><th>Qty</th><th>Strike</th><th>Expiry</th><th>Entry</th><th>IV</th></tr>'+rows+'</table>'+
      (img?'<h2>Payoff</h2><img src="'+img+'" alt="Payoff chart">':'')+
      '<h2>Explanation</h2><p>'+q('explain').innerHTML+'</p>'+
      '<div class="f"><b>Disclaimer:</b> Educational analytics only — not investment advice, not a solicitation, and not affiliated with Deribit, NSE or BSE. '+
      'Options and crypto derivatives carry substantial risk of loss; crypto derivatives are unregulated in India. Margin, fees and probability are estimates. '+
      'Simulated data must never be used for trading decisions. Verify all quotes with your broker.<br>'+
      'Sahare Financial Services · www.advisor4u.in · info@advisor4u.in · WhatsApp 9405908605</div></body></html>';
    var f=document.createElement('iframe');f.style.cssText='position:fixed;left:-9999px;top:0;width:900px;height:1200px;border:0';
    document.body.appendChild(f);
    var doc=f.contentWindow.document;doc.open();doc.write(html);doc.close();
    later(700,function(){try{f.contentWindow.focus();f.contentWindow.print();track('report_pdf',{market:S.market});}
      catch(e){toast('Print blocked by browser — use PNG export instead.');}
      later(2500,function(){if(f.parentNode)f.parentNode.removeChild(f);});});}
  function exportPNG(){
    if(!chart.W){toast('Chart not ready yet.');return;}
    var d=chart.dpr,head=54,c=document.createElement('canvas');
    c.width=chart.c.width;c.height=chart.c.height+head*d;
    var x=c.getContext('2d');x.fillStyle='#0a0f1c';x.fillRect(0,0,c.width,c.height);x.drawImage(chart.c,0,head*d);
    x.scale(d,d);x.fillStyle='#e8eefc';x.font='700 16px Inter, sans-serif';
    x.fillText('OptionForge — '+(S.presetName||'Custom strategy'),16,24);
    x.fillStyle='#8b9bc0';x.font='11px '+MF;
    x.fillText(S.market+' spot '+money(spotOf(S.market))+' · '+(MKd()&&MKd().demo?'SIMULATED':(MKd()?MKd().src:''))+' · advisor4u.in · '+new Date().toUTCString(),16,42);
    var a=document.createElement('a');a.download='optionforge-'+S.market+'-payoff.png';a.href=c.toDataURL('image/png');a.click();
    track('export_png',{market:S.market});toast('Chart exported as PNG.');}
  function sizeToRisk(){
    var a=getAnalytics();if(!a){toast('Add legs first.');return;}
    if(!isFinite(a.maxL)||a.maxL>=0){toast('This position has no finite loss to size against.');return;}
    var qs=S.legs.map(function(l){return l.qty;}),g=qs.reduce(function(x,y){while(y){var t=y;y=x%y;x=t;}return x;},qs[0]);
    var perUnit=Math.abs(a.maxL)/g,target=S.account*S.risk/100,factor=Math.max(1,Math.floor(target/perUnit));
    pushHist();S.legs.forEach(function(l){l.qty=clamp(Math.round(l.qty/g*factor),1,99);});
    S.presetName='Custom';persist();renderLegs();renderDynamic();syncSubs();
    toast('Sized to ~'+S.risk+'% risk: base quantity ×'+factor+'.');}
  function bulk(act){
    if(act==='none'){S.sel={};renderLegs();return;}
    var chosen=S.legs.filter(function(l){return S.sel[l.id];});if(!chosen.length)return;
    pushHist();
    if(act==='flip'){chosen.forEach(function(l){l.side*=-1;});toast('Flipped '+chosen.length+' legs.',undo);}
    if(act==='dup'){if(S.legs.length+chosen.length>CONFIG.MAX_LEGS){S.hist.pop();histBtns();toast('Max '+CONFIG.MAX_LEGS+' legs — duplicate would exceed it.');return;}
      chosen.forEach(function(l){var c=JSON.parse(JSON.stringify(l));c.id=uid();S.legs.push(c);});S.sel={};toast('Duplicated '+chosen.length+' legs.',undo);}
    if(act==='del'){S.legs=S.legs.filter(function(l){return !S.sel[l.id];});S.sel={};toast('Deleted '+chosen.length+' legs.',undo);}
    S.presetName='Custom';persist();renderLegs();renderDynamic();syncSubs();}
  function moveLeg(id,to){var from=-1;S.legs.forEach(function(l,i){if(l.id===id)from=i;});
    if(from<0||to<0||to>=S.legs.length||from===to)return;
    pushHist();var m=S.legs.splice(from,1)[0];S.legs.splice(to,0,m);persist();renderLegs();renderDynamic();}

  /* ---------- Events ---------- */
  var dragId=null;
  function bind(){
    var onClick=function(ev){
      var el=ev.target.closest?ev.target.closest('[data-act]'):null;if(!el||!(root.contains(el)||portal.contains(el)))return;
      var act=el.getAttribute('data-act');
      if(act==='tip'){var was=el.classList.contains('show');
        Array.prototype.slice.call(root.querySelectorAll('.info.show')).forEach(function(b){b.classList.remove('show');});
        if(!was)el.classList.add('show');return;}
      if(act==='hero-more'){el.classList.toggle('open');return;}
      if(act==='goto'){ev.preventDefault();var t=document.getElementById(secId(el.getAttribute('data-sec')));
        if(t)t.scrollIntoView({behavior:RM?'auto':'smooth',block:'start'});
        q('navlinks').classList.remove('open');return;}
      if(act==='home'){ev.preventDefault();q('hero').scrollIntoView({behavior:RM?'auto':'smooth',block:'start'});return;}
      if(act==='menu'){var nl=q('navlinks');nl.classList.toggle('open');el.setAttribute('aria-expanded',nl.classList.contains('open')?'true':'false');return;}
      if(act==='refresh'){refresh().then(function(){schedule(CONFIG.REFRESH);});return;}
      if(act==='market'){setMarket(el.getAttribute('data-cur'));return;}
      if(act==='side'){S.sideMode=+el.getAttribute('data-side');safe('deck',renderDeck);return;}
      if(act==='qside'){S.sideMode*=-1;safe('deck',renderDeck);return;}
      if(act==='den'){var dn=el.getAttribute('data-den');if(MK().kind==='index'&&dn==='COIN'){toast('Index options are cash-settled — coin mode is not available.');return;}
        S.denom=dn;aCache.sig=null;heat.sig='';safe('deck',renderDeck);renderDynamic();persist();return;}
      if(act==='vol'){S.volMode=el.getAttribute('data-vol');safe('deck',renderDeck);safe('vol',drawVol);persist();return;}
      if(act==='shuffle'){loadPreset(PRESETS[Math.floor(Math.random()*PRESETS.length)].id);return;}
      if(act==='preset-load'){loadPreset(el.getAttribute('data-preset'));
        var lb=document.getElementById(secId('lab'));if(lb)lb.scrollIntoView({behavior:RM?'auto':'smooth',block:'start'});return;}
      if(act==='scen'){var sc=SCEN[el.getAttribute('data-scen')];if(!sc)return;
        S.ui.days=clamp(sc.d,0,maxDays());S.ui.iv=sc.v;S.ui.shock=clamp(sc.s,-S.ui.range,S.ui.range);
        safe('deck',renderDeck);renderDynamic();persist();announce('Scenario applied.');return;}
      if(act==='reset-scen'){S.ui.days=0;S.ui.iv=0;S.ui.shock=0;S.ui.range=18;safe('deck',renderDeck);renderDynamic();persist();return;}
      if(act==='pin'){if(!S.legs.length){toast('Add legs first.');return;}
        S.pinned={name:S.presetName||'Custom',legs:JSON.parse(JSON.stringify(S.legs))};safe('deck',renderDeck);renderDynamic();
        toast('Pinned "'+S.pinned.name+'" for comparison.');return;}
      if(act==='unpin'){S.pinned=null;safe('deck',renderDeck);renderDynamic();return;}
      if(act==='undo'){undo();return;} if(act==='redo'){redo();return;}
      if(act==='clear'){if(!S.legs.length)return;pushHist();S.legs=[];S.sel={};S.presetName='';
        persist();renderLegs();renderDynamic();syncSubs();toast('All legs cleared.',undo);return;}
      if(act==='bulk'){bulk(el.getAttribute('data-bulk'));return;}
      if(act==='leg-rm'||act==='leg-side'||act==='leg-type'||act==='leg-qty'||act==='leg-move'){
        var id=el.getAttribute('data-leg'),l=null,ix=-1;
        S.legs.forEach(function(x,i){if(x.id===id){l=x;ix=i;}});if(!l)return;
        if(act==='leg-move'){moveLeg(id,ix+ +el.getAttribute('data-d'));return;}
        pushHist();
        if(act==='leg-rm'){S.legs.splice(ix,1);toast('Leg removed.',undo);}
        if(act==='leg-side')l.side*=-1;
        if(act==='leg-qty')l.qty=clamp(l.qty+ +el.getAttribute('data-d'),1,99);
        if(act==='leg-type'){var nl2=makeLeg(l.type==='C'?'P':'C',l.side,l.strike,l.expiry,l.qty);nl2.id=l.id;nl2.ivOverride=l.ivOverride;S.legs[ix]=nl2;}
        S.presetName='Custom';persist();renderLegs();renderDynamic();syncSubs();return;}
      if(act==='tab'){S.expiry[S.market]=+el.getAttribute('data-exp');persist();safe('deck',renderDeck);safe('chain',renderChain);renderDynamic();safe('vol',drawVol);syncSubs();return;}
      if(act==='win'){S.ui.win=clamp(S.ui.win+ +el.getAttribute('data-d'),3,25);safe('deck',renderDeck);safe('chain',renderChain);persist();syncSubs();return;}
      if(act==='sort'){S.ui.sortAsc=!S.ui.sortAsc;safe('deck',renderDeck);safe('chain',renderChain);persist();return;}
      if(act==='chain-add'){addLeg(el.getAttribute('data-type'),S.sideMode,+el.getAttribute('data-strike'),selExp(),1,true);return;}
      if(act==='drawer-open'){openDrawer(+el.getAttribute('data-strike'));return;}
      if(act==='drawer-close'){closeDrawer();return;}
      if(act==='drawer-add'){if(drawerStrike!=null){addLeg(el.getAttribute('data-type'),+el.getAttribute('data-side'),drawerStrike,selExp(),1);closeDrawer();}return;}
      if(act==='save'){saveCurrent();return;}
      if(act==='saved-load'){var s=S.saved[+el.getAttribute('data-idx')];if(!s)return;
        if(s.market!==S.market)setMarket(s.market);
        pushHist();S.legs=s.legs.map(function(l){return normLeg(l,s.market);});S.sel={};S.presetName=s.name;
        persist();renderLegs();renderDynamic();syncSubs();toast('Loaded "'+s.name+'".',undo);
        var lb2=document.getElementById(secId('lab'));if(lb2)lb2.scrollIntoView({behavior:RM?'auto':'smooth',block:'start'});return;}
      if(act==='saved-rename'){S.editing=+el.getAttribute('data-idx');renderSaved();return;}
      if(act==='saved-del'){var i2=+el.getAttribute('data-idx'),sv=S.saved[i2];if(!sv)return;
        S.saved.splice(i2,1);persist();renderSaved();
        toast('Deleted "'+sv.name+'".',function(){S.saved.splice(i2,0,sv);persist();renderSaved();});return;}
      if(act==='size'){sizeToRisk();return;}
      if(act==='export-png'){exportPNG();return;}
      if(act==='export-json'){exportJSON();return;}
      if(act==='import'){q('importFile').click();return;}
      if(act==='report'){reportPDF();return;}
      if(act==='share'){shareWA();return;}
      if(act==='copylink'){copyLink();return;}
    };
    on(root,'click',onClick);on(portal,'click',onClick);
    on(root,'input',function(ev){
      var el=ev.target,key=el.getAttribute&&el.getAttribute('data-in');if(!key)return;
      if(key==='days'||key==='qDays'){S.ui.days=clamp(num(el.value,0),0,maxDays());safe('deck',renderDeck);renderDynamic();persist();return;}
      if(key==='iv'||key==='qIv'){S.ui.iv=num(el.value,0);safe('deck',renderDeck);renderDynamic();persist();return;}
      if(key==='shock'||key==='qShock'){S.ui.shock=num(el.value,0);safe('deck',renderDeck);renderDynamic();persist();return;}
      if(key==='range'){S.ui.range=num(el.value,18);S.ui.shock=clamp(S.ui.shock,-S.ui.range,S.ui.range);safe('deck',renderDeck);renderDynamic();persist();return;}
      if(key==='account'){S.account=clamp(num(String(el.value).replace(/[^\d.]/g,''),100),100,1e12);safe('metrics',renderMetrics);safe('ticker',renderTicker);persist();return;}
      if(key==='lot'){S.lot=clamp(num(String(el.value).replace(/[^\d]/g,''),1),1,10000);aCache.sig=null;heat.sig='';renderDynamic();persist();return;}
      if(key==='fee'){S.fee=Math.max(0,num(el.value,0));aCache.sig=null;heat.sig='';renderDynamic();persist();return;}
      if(key==='slip'){S.slip=clamp(num(el.value,0),0,20);persist();return;}
      if(key==='risk'){S.risk=clamp(num(el.value,2),0.1,100);persist();return;}
      if(key==='filter'){S.ui.filter=el.value.replace(/[^\d]/g,'');safe('chain',renderChain);syncSubs();return;}
      if(key==='savedSearch'){S.savedSearch=el.value;renderSaved();return;}
      if(key==='legIv'){S.autoLeg=false;var id=el.getAttribute('data-leg');S.legs.forEach(function(l){if(l.id!==id)return;
        var v=String(el.value).trim();l.ivOverride=v===''?null:clamp(num(v,0),1,300);});
        aCache.sig=null;heat.sig='';renderDynamic();persist();return;}
    });
    on(root,'change',function(ev){
      var el=ev.target,key=el.getAttribute&&el.getAttribute('data-in');if(!key)return;
      if(key==='expiry'||key==='qExpiry'){S.expiry[S.market]=+el.value;persist();safe('deck',renderDeck);safe('chain',renderChain);renderDynamic();safe('vol',drawVol);syncSubs();return;}
      if(key==='preset'||key==='qPreset'){if(el.value)loadPreset(el.value);return;}
      if(key==='qMarket'){setMarket(el.value);return;}
      if(key==='entryMode'){S.entryMode=el.value;persist();toast('Fill price set to '+el.value+' — new legs will use it.');return;}
      if(key==='t0'){S.ui.t0=el.checked;renderDynamic();persist();return;}
      if(key==='fill'){S.ui.fill=el.checked;safe('chart',drawBase);persist();return;}
      if(key==='cone'){S.ui.cone=el.checked;renderDynamic();persist();return;}
      if(key==='selAll'){S.sel={};if(el.checked)S.legs.forEach(function(l){S.sel[l.id]=1;});renderLegs();return;}
      if(key==='legSel'){var id=el.getAttribute('data-leg');if(el.checked)S.sel[id]=1;else delete S.sel[id];renderLegs();return;}
      if(key==='savedSort'){S.savedSort=el.value;renderSaved();return;}
      if(key==='rename'){var ix=+el.getAttribute('data-idx');if(S.saved[ix]){S.saved[ix].name=(el.value.trim()||S.saved[ix].name).slice(0,40);
        S.editing=null;persist();renderSaved();toast('Renamed.');}return;}
      if(key==='legStrike'||key==='legExpiry'){
        var lid=el.getAttribute('data-leg'),ix2=-1;S.legs.forEach(function(l,i){if(l.id===lid)ix2=i;});if(ix2<0)return;
        var old=S.legs[ix2];pushHist();
        var nl=makeLeg(old.type,old.side,key==='legStrike'?+el.value:old.strike,key==='legExpiry'?+el.value:old.expiry,old.qty);
        nl.id=old.id;nl.ivOverride=old.ivOverride;S.legs[ix2]=nl;S.presetName='Custom';
        persist();renderLegs();renderDynamic();syncSubs();return;}
    });
    on(q('importFile'),'change',function(ev){if(ev.target.files[0])importFile(ev.target.files[0]);ev.target.value='';});
    on(q('saveName'),'keydown',function(ev){if(ev.key==='Enter')saveCurrent();});
    var legsBox=q('legs');
    on(legsBox,'dragstart',function(ev){var h=ev.target.closest('.drag');if(!h)return;
      var row=h.closest('.leg');dragId=row.getAttribute('data-leg');row.classList.add('dg');
      if(ev.dataTransfer){ev.dataTransfer.effectAllowed='move';try{ev.dataTransfer.setData('text/plain',dragId);}catch(e){}}});
    on(legsBox,'dragover',function(ev){if(!dragId)return;var row=ev.target.closest('.leg');if(!row)return;
      ev.preventDefault();Array.prototype.slice.call(legsBox.querySelectorAll('.leg.ov')).forEach(function(r){r.classList.remove('ov');});
      if(row.getAttribute('data-leg')!==dragId)row.classList.add('ov');});
    on(legsBox,'drop',function(ev){if(!dragId)return;var row=ev.target.closest('.leg');if(!row)return;ev.preventDefault();
      var to=-1;S.legs.forEach(function(l,i){if(l.id===row.getAttribute('data-leg'))to=i;});moveLeg(dragId,to);dragId=null;});
    on(legsBox,'dragend',function(){dragId=null;Array.prototype.slice.call(legsBox.querySelectorAll('.leg')).forEach(function(r){r.classList.remove('dg','ov');});});
    var move=function(ev){if(!over.c)return;var r=over.c.getBoundingClientRect();chart.hover=ev.clientX-r.left;safe('chart-tip',chartTip);frameQ.over=true;kick();};
    on(over.c,'pointermove',move);on(over.c,'pointerdown',move);
    on(over.c,'pointerleave',function(){chart.hover=null;safe('chart-tip',chartTip);frameQ.over=true;kick();});
    on(heat.c,'pointermove',function(ev){heat.hover=heatCell(ev);heat.cursor=null;heat.dirty=true;kick();});
    on(heat.c,'pointerleave',function(){heat.hover=null;heat.dirty=true;kick();});
    on(heat.c,'click',function(ev){applyHeatCell(heatCell(ev));});
    on(heat.c,'keydown',function(ev){
      var g=heat.grid;if(!g)return;
      if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Enter',' '].indexOf(ev.key)<0)return;
      ev.preventDefault();
      if(!heat.cursor)heat.cursor={c:Math.floor(g.cols/2),r:0};
      if(ev.key==='ArrowLeft')heat.cursor.c=clamp(heat.cursor.c-1,0,g.cols-1);
      if(ev.key==='ArrowRight')heat.cursor.c=clamp(heat.cursor.c+1,0,g.cols-1);
      if(ev.key==='ArrowUp')heat.cursor.r=clamp(heat.cursor.r-1,0,g.rows-1);
      if(ev.key==='ArrowDown')heat.cursor.r=clamp(heat.cursor.r+1,0,g.rows-1);
      if(ev.key==='Enter'||ev.key===' '){applyHeatCell(heat.cursor);return;}
      heat.hover=null;heat.dirty=true;kick();});
    on(q('scrim'),'click',closeDrawer);
    on(document,'keydown',function(ev){
      if(ev.key==='Escape'){closeDrawer();q('navlinks').classList.remove('open');return;}
      if(q('drawer').classList.contains('open')){trapFocus(ev);return;}
      var tag=(document.activeElement&&document.activeElement.tagName)||'';
      if(/INPUT|SELECT|TEXTAREA/.test(tag))return;
      if((ev.ctrlKey||ev.metaKey)&&ev.key.toLowerCase()==='z'){ev.preventDefault();ev.shiftKey?redo():undo();}
      if((ev.ctrlKey||ev.metaKey)&&ev.key.toLowerCase()==='y'){ev.preventDefault();redo();}});
    on(window,'resize',function(){setTop();queueResize();});
    on(document,'visibilitychange',function(){if(!document.hidden&&S.onScreen&&Date.now()>nextAt-CONFIG.REFRESH+3000)refresh().then(function(){schedule(CONFIG.REFRESH);});});
    if(window.ResizeObserver){var ro=new ResizeObserver(queueResize);obs.push(ro);
      [chart.w,heat.w,vol.w].forEach(function(w){if(w)ro.observe(w);});}
    else on(window,'resize',queueResize);
    if(window.IntersectionObserver){
      var io=new IntersectionObserver(function(es){es.forEach(function(e){
        if(e.target.classList&&e.target.classList.contains('pbc')){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}return;}
        var key=e.target.getAttribute&&e.target.getAttribute('data-of');
        if(['lab','chain','playbook','faq'].indexOf(key)>=0&&e.isIntersecting){
          Array.prototype.slice.call(q('navlinks').children).forEach(function(a){a.classList.toggle('on',a.getAttribute('data-sec')===key);});}});},
        {rootMargin:'-30% 0px -50% 0px',threshold:0});
      obs.push(io);
      Array.prototype.slice.call(root.querySelectorAll('.pbc')).forEach(function(c,i){c.style.transitionDelay=(i%4*0.06)+'s';io.observe(c);});
      ['lab','chain','playbook','faq'].forEach(function(k){var e=q(k);if(e)io.observe(e);});
      var io2=new IntersectionObserver(function(es){S.onScreen=es[0].isIntersecting;
        if(S.onScreen){queueResize();safe('ticker',renderTicker);}},{threshold:0});
      obs.push(io2);io2.observe(root);
    }else{Array.prototype.slice.call(root.querySelectorAll('.pbc')).forEach(function(c){c.classList.add('in');});}
    if(window.matchMedia){mq=matchMedia('(max-width:680px)');S.compact=mq.matches;
      mqHandler=function(e){S.compact=e.matches;safe('chain',renderChain);syncSubs();};
      if(mq.addEventListener)mq.addEventListener('change',mqHandler,SIG);else if(mq.addListener)mq.addListener(mqHandler);}
  }
  // थीमच्या fixed/sticky header ची उंची आपोआप (v3.2: --top variable बरोबर)
  function setTop(){
    var h=0,ab=document.getElementById('wpadminbar');
    if(ab){var ps=getComputedStyle(ab).position;if(ps==='fixed'||ps==='sticky')h+=ab.offsetHeight;}
    var man=parseInt(root.getAttribute('data-header-offset')||'0',10)||0;
    if(man>0)h+=man;
    else{
      var best=0,sels=['.elementor-location-header','header#masthead','header.site-header','#masthead','.site-header','header[data-elementor-type="header"]','.main-header','#header','.elementor-sticky--active'];
      sels.forEach(function(sel){
        Array.prototype.slice.call(document.querySelectorAll(sel)).forEach(function(el){
          if(root.contains(el)||el.contains(root))return;
          var cs=getComputedStyle(el);if(cs.position!=='fixed'&&cs.position!=='sticky')return;
          var r=el.getBoundingClientRect();
          if(r.top<=h+4&&r.height>0&&r.height<220)best=Math.max(best,r.bottom);});});
      h=Math.max(h,best);
    }
    root.style.setProperty('--top',Math.round(clamp(h,0,220))+'px');
  }

  /* ---------- Loop + init ---------- */
  function destroy(){dead=true;try{AC.abort();}catch(e){}
    cancelAnimationFrame(raf);timers.forEach(function(t){clearTimeout(t);clearInterval(t);});timers=[];
    wsClose();obs.forEach(function(o){try{o.disconnect();}catch(e){}});obs=[];raf=0;
    if(portal){while(portal.firstChild)root.appendChild(portal.firstChild);if(portal.parentNode)portal.parentNode.removeChild(portal);}
    if(mq&&mqHandler){if(mq.removeEventListener)mq.removeEventListener('change',mqHandler);else if(mq.removeListener)mq.removeListener(mqHandler);}}
  root.__of={destroy:destroy};

  setTop();
  var had=load();
  var hash=(location.hash||'').match(/[#&]of=([A-Za-z0-9\-_]+)/);
  if(hash){var sh=decodeLink(hash[1]);
    if(sh){S.market=sh.market;S.denom=sh.denom;S.legs=sh.legs;S.presetName=sh.name;had=true;
      later(700,function(){toast('Loaded a shared setup: '+sh.name+'.');});}
    else later(700,function(){toast('Shared link could not be read — showing your saved workspace.');});}
  if(MK().kind==='index'){S.denom='USD';S.lot=CONFIG.LOTS[S.market]||S.lot;}
  // पहिल्या paint लाच सर्व भरलेलं — demo + expiry + preset आधी, live नंतर
  S.data[S.market]=demoData(S.market);
  ensureExpiry();
  if(!S.legs.length)loadPreset('ironCondor',true);
  setStatus('demo');
  banner('warn','Simulated preview while the live '+S.market+' feed connects. Do not trade on these numbers.');
  bind();
  renderAll();
  sizeAll();
  every(CONFIG.WS_APPLY,applyLive);
  every(CONFIG.DEMO_TICK,function(){if(dead||document.hidden||!S.onScreen)return;
    if(S.status==='demo'){demoTick();renderDynamic();safe('ticker',renderTicker);safe('leg-marks',renderLegMarks);safe('vol',drawVol);}});
  every(1000,function(){if(dead)return;var rem=Math.max(0,nextAt-Date.now());
    var r=q('ring'),s=q('secs');
    if(r)r.style.strokeDashoffset=String(53.4*(1-rem/CONFIG.REFRESH));
    if(s)s.textContent=Math.ceil(rem/1000)+'s';});
  every(30000,function(){if(!dead&&!document.body.contains(root))destroy();});
  later(1200,setTop);later(3200,setTop);
  refresh().then(function(){if(!dead)schedule(CONFIG.REFRESH);});
  track('open',{market:S.market});
}
})();
