const crypto = require('crypto');
const base = () => process.env.SUPABASE_URL;
const key = () => process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminOK = body => body?.password && body.password === (process.env.ADMIN_PASSWORD || 'atiny-admin');
const headers = () => ({apikey:key(),Authorization:`Bearer ${key()}`,'Content-Type':'application/json',Prefer:'return=representation'});
async function db(path, options={}) { const r=await fetch(`${base()}/rest/v1/${path}`,{headers:headers(),...options}); if(!r.ok)throw Error(await r.text()); return r.status===204?null:r.json(); }
exports.handler=async event=>{
  if(!base()||!key()) return {statusCode:503,body:JSON.stringify({error:'Shared library is not configured yet.'})};
  try {
    if(event.httpMethod==='GET') { const cards=await db('cards?select=id,name,image_url,binder_id,rarity,enabled&enabled=eq.true&order=created_at.asc'); return {statusCode:200,headers:{'Content-Type':'application/json','Cache-Control':'no-store'},body:JSON.stringify({cards:cards.map(c=>({id:c.id,name:c.name,image:c.image_url,binder:'ATEEZ',rarity:c.rarity,enabled:c.enabled}))})}; }
    const body=JSON.parse(event.body||'{}'); if(!adminOK(body))return {statusCode:401,body:JSON.stringify({error:'Admin password required'})};
    if(body.action==='seed') { const rows=(body.cards||[]).map(c=>({id:c.id,name:c.name||'Photocard',image_url:c.image,binder_id:null,rarity:c.rarity||'Common',enabled:true})); const existing=await db('cards?select=id&limit=1'); if(!existing.length&&rows.length)await db('cards',{method:'POST',body:JSON.stringify(rows)}); return {statusCode:200,body:JSON.stringify({ok:true,count:rows.length})}; }
    if(body.action==='add') { const id=crypto.randomUUID(); const data=String(body.image||''); const match=data.match(/^data:(.+?);base64,(.+)$/); if(!match)throw Error('Image data missing'); const ext=match[1].includes('png')?'png':'jpg'; const file=`${id}.${ext}`; await fetch(`${base()}/storage/v1/object/photocards/${file}`,{method:'POST',headers:{apikey:key(),Authorization:`Bearer ${key()}`,'Content-Type':match[1],'x-upsert':'true'},body:Buffer.from(match[2],'base64')}); const image=`${base()}/storage/v1/object/public/photocards/${file}`; const rows=await db('cards',{method:'POST',body:JSON.stringify({id,name:'Photocard',image_url:image,binder_id:null,rarity:body.rarity||'Common',enabled:true})}); return {statusCode:200,body:JSON.stringify({card:{...rows[0],image,binder:body.binder||'ATEEZ'}})}; }
    if(body.action==='update') { await db(`cards?id=eq.${encodeURIComponent(body.id)}`,{method:'PATCH',body:JSON.stringify({rarity:body.rarity,enabled:body.enabled})}); return {statusCode:200,body:JSON.stringify({ok:true})}; }
    if(body.action==='remove') { await db(`cards?id=eq.${encodeURIComponent(body.id)}`,{method:'PATCH',body:JSON.stringify({enabled:false})}); return {statusCode:200,body:JSON.stringify({ok:true})}; }
    return {statusCode:400,body:JSON.stringify({error:'Unknown action'})};
  } catch(e) { return {statusCode:500,body:JSON.stringify({error:e.message})}; }
};
