(()=>{let ua="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36";const v=(navigator.userAgent.match(/(?:HeadlessChrome|Chrome|Chromium)\/(\d+(?:\.\d+){0,3})/)||[])[1];if(v)ua=ua.replace("Chrome/140.0.0.0","Chrome/"+v);try{Object.defineProperty(navigator,"userAgent",{configurable:true,get:()=>ua});Object.defineProperty(navigator,"appVersion",{configurable:true,get:()=>ua.replace(/^Mozilla\//,"")});Object.defineProperty(navigator,'platform',{configurable:true,get:()=>'Win32'});Object.defineProperty(navigator,'vendor',{configurable:true,get:()=>'Google Inc.'});const major=((ua.match(/Chrome\/(\d+)/)||[])[1]||'140');const product='Google Chrome',pv=major;const brands=[{brand:'Chromium',version:major},...(product==='Chromium'?[]:[{brand:product,version:pv}]),{brand:'Not_A Brand',version:'99'}],mobile=false,platform='Windows';const nativeHints=navigator.userAgentData;
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
