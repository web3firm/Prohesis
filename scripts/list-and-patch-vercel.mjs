#!/usr/bin/env node
(async function(){
  const token = process.env.VERCEL_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;
  if(!token||!projectId){console.error('Please set VERCEL_TOKEN and VERCEL_PROJECT_ID'); process.exit(1)}
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  const listUrl = `https://api.vercel.com/v9/projects/${projectId}/env?limit=1000`;
  const r = await fetch(listUrl, { headers });
  console.log('LIST_STATUS', r.status);
  const txt = await r.text();
  try{ console.log(JSON.stringify(JSON.parse(txt), null, 2)) } catch(e){ console.log(txt) }
  try{
    const json = JSON.parse(txt);
    const found = (json.env||[]).find(e=>e.key==='NEXT_PUBLIC_FACTORY_CONTRACT');
    if(found){
      console.log('Found factory id:', found.id);
      const patchUrl = `https://api.vercel.com/v9/projects/${projectId}/env/${found.id}`;
      const payload = { value: 'REDACTED_TEST_VALUE', target:['production','preview'], type:'plain' };
      const pr = await fetch(patchUrl, { method:'PATCH', headers, body: JSON.stringify(payload) });
      console.log('PATCH_STATUS', pr.status);
      const pt = await pr.text();
      try{ console.log(JSON.stringify(JSON.parse(pt), null,2)) } catch(e){ console.log(pt) }
    } else {
      console.log('Factory key not found in list');
    }
  }catch(e){ console.error('list parse error', e) }
})().catch(e=>{ console.error(e); process.exit(1) })
