"use strict";(()=>{var e={};e.id=646,e.ids=[646],e.modules={145:e=>{e.exports=require("next/dist/compiled/next-server/pages-api.runtime.prod.js")},6249:(e,t)=>{Object.defineProperty(t,"l",{enumerable:!0,get:function(){return function e(t,r){return r in t?t[r]:"then"in t&&"function"==typeof t.then?t.then(t=>e(t,r)):"function"==typeof t&&"default"===r?t:void 0}}})},7237:(e,t,r)=>{r.r(t),r.d(t,{config:()=>u,default:()=>c,routeModule:()=>l});var o={};r.r(o),r.d(o,{default:()=>d});var n=r(1802),s=r(7153),i=r(6249);async function a(){let e=await fetch(`https://${process.env.SHOPIFY_SHOP_NAME}.myshopify.com/admin/oauth/access_token`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({client_id:process.env.SHOPIFY_CLIENT_ID,client_secret:process.env.SHOPIFY_CLIENT_SECRET,grant_type:"client_credentials"})});return(await e.json()).access_token}async function d(e,t){if("POST"!==e.method)return t.status(405).json({error:"Method not allowed"});let{productId:r}=e.body;if(!r)return t.status(400).json({error:"Missing productId"});try{let e=await a(),o=`
      query getMetafields($id: ID!) {
        product(id: $id) {
          metafields(first: 100) {
            edges {
              node {
                key
                value
                type
              }
            }
          }
          variants(first: 100) {
            edges {
              node {
                id
                metafields(first: 100) {
                  edges {
                    node {
                      key
                      value
                      type
                    }
                  }
                }
              }
            }
          }
        }
      }
    `,n=await fetch(`https://${process.env.SHOPIFY_SHOP_NAME}.myshopify.com/admin/api/2024-01/graphql.json`,{method:"POST",headers:{"Content-Type":"application/json","X-Shopify-Access-Token":e},body:JSON.stringify({query:o,variables:{id:`gid://shopify/Product/${r}`}})}),s=await n.json();if(s.errors)return console.error("GraphQL Metafield Fetch Error:",s.errors),t.status(500).json({error:"Shopify Error",details:s.errors});let i=s.data.product;if(!i)return t.status(404).json({error:"Product not found"});let d=i.metafields.edges.map(e=>e.node),c={};i.variants.edges.forEach(e=>{c[e.node.id.split("/").pop()]=e.node.metafields.edges.map(e=>e.node)}),t.status(200).json({success:!0,productMetafields:d,variantsMetafields:c})}catch(e){console.error("Fetch Metafields API Error:",e),t.status(500).json({error:"Internal Server Error"})}}let c=(0,i.l)(o,"default"),u=(0,i.l)(o,"config"),l=new n.PagesAPIRouteModule({definition:{kind:s.x.PAGES_API,page:"/api/get-live-metafields",pathname:"/api/get-live-metafields",bundlePath:"",filename:""},userland:o})},7153:(e,t)=>{var r;Object.defineProperty(t,"x",{enumerable:!0,get:function(){return r}}),function(e){e.PAGES="PAGES",e.PAGES_API="PAGES_API",e.APP_PAGE="APP_PAGE",e.APP_ROUTE="APP_ROUTE"}(r||(r={}))},1802:(e,t,r)=>{e.exports=r(145)}};var t=require("../../webpack-api-runtime.js");t.C(e);var r=t(t.s=7237);module.exports=r})();