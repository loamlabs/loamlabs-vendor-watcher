"use strict";(()=>{var e={};e.id=75,e.ids=[75],e.modules={145:e=>{e.exports=require("next/dist/compiled/next-server/pages-api.runtime.prod.js")},6249:(e,t)=>{Object.defineProperty(t,"l",{enumerable:!0,get:function(){return function e(t,n){return n in t?t[n]:"then"in t&&"function"==typeof t.then?t.then(t=>e(t,n)):"function"==typeof t&&"default"===n?t:void 0}}})},344:(e,t,n)=>{n.r(t),n.d(t,{config:()=>c,default:()=>d,routeModule:()=>p});var r={};n.r(r),n.d(r,{default:()=>l});var o=n(1802),a=n(7153),s=n(6249);async function i(){let e=await fetch(`https://${process.env.SHOPIFY_SHOP_NAME}.myshopify.com/admin/oauth/access_token`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({client_id:process.env.SHOPIFY_CLIENT_ID,client_secret:process.env.SHOPIFY_CLIENT_SECRET,grant_type:"client_credentials"})});return(await e.json()).access_token}async function l(e,t){if("GET"!==e.method)return t.status(405).json({error:"Method not allowed"});let n=`${process.env.SHOPIFY_SHOP_NAME}.myshopify.com`,r=await i();if(!process.env.SHOPIFY_SHOP_NAME||!r)return t.status(500).json({error:"Shopify credentials missing"});let o=`
    query {
      productMetafields: metafieldDefinitions(first: 250, ownerType: PRODUCT) {
        edges {
          node {
            namespace
            key
            type { name }
            validations {
              name
              value
            }
          }
        }
      }
      variantMetafields: metafieldDefinitions(first: 250, ownerType: PRODUCTVARIANT) {
        edges {
          node {
            namespace
            key
            type { name }
            validations {
              name
              value
            }
          }
        }
      }
    }
  `;try{let e=await fetch(`https://${n}/admin/api/2024-01/graphql.json`,{method:"POST",headers:{"Content-Type":"application/json","X-Shopify-Access-Token":r},body:JSON.stringify({query:o})}),a=await e.json();if(a.errors)return console.error("GraphQL Errors:",a.errors),t.status(600).json({error:"Shopify GraphQL Error",details:a.errors});let s=a.data.productMetafields.edges.map(e=>e.node),i=a.data.variantMetafields.edges.map(e=>e.node);console.log("=== DIAGNOSTIC: FIRST VARIANT METADATA DEFS ==="),console.log(JSON.stringify(i.slice(0,5).map(e=>({key:e.key,type:e.type,validations:e.validations})),null,2));let l=[...s,...i],d={};for(let e of l){let t=e.validations?.find(e=>"choices"===e.name);if(t&&t.value)try{let n=JSON.parse(t.value);Array.isArray(n)&&(d[e.key]=n)}catch(t){console.error("Failed to parse choices for",e.key)}e.type?.name==="boolean"&&(d[e.key]="boolean")}t.status(200).json({success:!0,optionsDict:d})}catch(e){console.error("API Error:",e),t.status(500).json({error:"Internal Server Error",message:e.message})}}let d=(0,s.l)(r,"default"),c=(0,s.l)(r,"config"),p=new o.PagesAPIRouteModule({definition:{kind:a.x.PAGES_API,page:"/api/get-metafield-definitions",pathname:"/api/get-metafield-definitions",bundlePath:"",filename:""},userland:r})},7153:(e,t)=>{var n;Object.defineProperty(t,"x",{enumerable:!0,get:function(){return n}}),function(e){e.PAGES="PAGES",e.PAGES_API="PAGES_API",e.APP_PAGE="APP_PAGE",e.APP_ROUTE="APP_ROUTE"}(n||(n={}))},1802:(e,t,n)=>{e.exports=n(145)}};var t=require("../../webpack-api-runtime.js");t.C(e);var n=t(t.s=344);module.exports=n})();