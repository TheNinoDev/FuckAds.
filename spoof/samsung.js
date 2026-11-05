(()=>{const ua="Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/24.0 Chrome/117.0.0.0 Mobile Safari/537.36";try{Object.defineProperty(navigator,"userAgent",{configurable:true,get:()=>ua});Object.defineProperty(navigator,"appVersion",{configurable:true,get:()=>ua.replace(/^Mozilla\//,"")});Object.defineProperty(navigator,'platform',{configurable:true,get:()=>'Linux armv8l'});Object.defineProperty(navigator,'vendor',{configurable:true,get:()=>'Google Inc.'});const major=((ua.match(/Chrome\/(\d+)/)||[])[1]||'140');const product='Samsung Internet',pv='24';const brands=[{brand:'Chromium',version:major},...(product==='Chromium'?[]:[{brand:product,version:pv}]),{brand:'Not_A Brand',version:'99'}],mobile=true,platform='Android';const nativeHints=navigator.userAgentData;
if(globalThis.isSecureContext && nativeHints){
 const hints=new Proxy(nativeHints,{get(target,key){
  if(key==='brands')return brands;
  if(key==='mobile')return mobile;
  if(key==='platform')return platform;
  if(key==='toJSON')return ()=>({brands,mobile,platform});
  if(key==='getHighEntropyValues')return async keys=>{
   const result=await target.getHighEntropyValues(keys);
   result.brands=brands;result.mobile=mobile;result.platform=platform;
   if('uaFullVersion' in result)result.uaFullVersion=major+'.0.0.0';
   if('fullVersionList' in result)result.fullVersionList=brands.map(b=>({brand:b.brand,version:b.version+'.0.0.0'}));
   if(mobile){if('architecture' in result)result.architecture='';if('bitness' in result)result.bitness='';if('platformVersion' in result)result.platformVersion='';}
   return result;
  };
  const value=Reflect.get(target,key,target);return typeof value==='function'?value.bind(target):value;
 }});
 Object.defineProperty(navigator,'userAgentData',{configurable:true,get:()=>hints});
}
for(let obj=navigator;obj;obj=Object.getPrototypeOf(obj)){const d=Object.getOwnPropertyDescriptor(obj,'brave');if(d?.configurable)delete obj.brave;}}catch{}})();
