const box=document.getElementById('buttons');
const selectBox=document.getElementById('selectOptions');
let selectCount=0,count=0;
function safeText(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function fillSelect(select,items,placeholder,render){const old=select.value||select.dataset.selected||'';select.innerHTML=`<option value="">${placeholder}</option>`+items.map(render).join('');if(old&&items.some(x=>x.id===old))select.value=old;}
function populateResourceSelects(root,d){
 root.querySelectorAll('.category-select').forEach(s=>fillSelect(s,d.channels.filter(c=>c.type===4),'No category',c=>`<option value="${c.id}">${safeText(c.name)}</option>`));
 root.querySelectorAll('.role-select').forEach(s=>fillSelect(s,d.roles.filter(r=>r.name!=='@everyone'),'No staff role',r=>`<option value="${r.id}">@${safeText(r.name)}</option>`));
}
function addSelectOption(data={}){if(selectCount>=25)return;const i=selectCount++;const el=document.createElement('div');el.className='button-editor';el.innerHTML=`<div class="row"><label>Dropdown label<input name="selectOptions[${i}][label]" maxlength="100" required placeholder="Billing Support" value="${safeText(data.label||'')}"></label><label>Emoji<input name="selectOptions[${i}][emoji]" placeholder="💳" value="${safeText(data.emoji||'')}"></label></div><label>Description<input name="selectOptions[${i}][description]" maxlength="100" placeholder="Payment and invoice help" value="${safeText(data.description||'')}"></label><label>Ticket category for THIS option<select class="category-select" name="selectOptions[${i}][categoryId]"><option value="">Loading categories…</option></select></label><label>Staff role<select class="role-select" name="selectOptions[${i}][staffRoleId]"><option value="">Loading roles…</option></select></label><label>Opening message<textarea name="selectOptions[${i}][welcomeMessage]">${safeText(data.welcomeMessage||'Thanks for contacting support. A team member will be with you shortly.')}</textarea></label><button type="button">Remove dropdown option</button>`;el.querySelector('button').onclick=()=>el.remove();selectBox?.append(el);if(window.serverResources)populateResourceSelects(el,window.serverResources)}
document.getElementById('addSelectOption')?.addEventListener('click',()=>addSelectOption());
function addButton(data={}){if(!box)return;const el=document.createElement('div');el.className='button-editor';el.innerHTML=`<div class="row"><label>Button label<input name="buttons[${count}][label]" maxlength="80" required placeholder="General Support" value="${safeText(data.label||'')}"></label><label>Emoji<input name="buttons[${count}][emoji]" placeholder="🎫" value="${safeText(data.emoji||'')}"></label><label>Button color<select name="buttons[${count}][style]"><option value="3">Green</option><option value="1">Blue</option><option value="2">Grey</option><option value="4">Red</option></select></label></div><label>Ticket category<select class="category-select" name="buttons[${count}][categoryId]"><option value="">Loading categories…</option></select></label><label>Support staff role<select class="role-select" name="buttons[${count}][staffRoleId]"><option value="">Loading roles…</option></select></label><label>Opening message<textarea name="buttons[${count}][welcomeMessage]">${safeText(data.welcomeMessage||'Thanks for contacting support. A team member will be with you shortly.')}</textarea></label><button type="button">Remove option</button>`;el.querySelector('button').onclick=()=>el.remove();box.append(el);if(window.serverResources)populateResourceSelects(el,window.serverResources);count++;}
document.getElementById('addButton')?.addEventListener('click',()=>addButton());
if(box&&!box.children.length)addButton();
async function loadResources(){
 const selects=[...document.querySelectorAll('.channel-select,.voice-select,.category-select,.role-select')];
 selects.forEach(s=>{if(s.classList.contains('channel-select'))s.innerHTML='<option value="">Loading channels…</option>';});
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),12000);
 try{
  const r=await fetch(`/api/guild/${encodeURIComponent(guildId)}/resources`,{signal:controller.signal,headers:{Accept:'application/json'}});
  const d=await r.json().catch(()=>({error:`Server returned HTTP ${r.status}`}));if(!r.ok)throw Error(d.error||`Could not load server resources (HTTP ${r.status}).`);
  if(!Array.isArray(d.channels)||!Array.isArray(d.roles))throw Error('Discord returned an invalid channels/roles response.');
  window.serverResources=d;
  document.querySelectorAll('.channel-select').forEach(s=>fillSelect(s,d.channels.filter(c=>c.type===0||c.type===5),'Select a text channel',c=>`<option value="${c.id}"># ${safeText(c.name)}</option>`));
  document.querySelectorAll('.voice-select').forEach(s=>fillSelect(s,d.channels.filter(c=>c.type===2),'Select a voice channel',c=>`<option value="${c.id}">🔊 ${safeText(c.name)}</option>`));
  document.querySelectorAll('.category-select').forEach(s=>fillSelect(s,d.channels.filter(c=>c.type===4),'No category',c=>`<option value="${c.id}">${safeText(c.name)}</option>`));
  document.querySelectorAll('.role-select').forEach(s=>fillSelect(s,d.roles.filter(r=>r.name!=='@everyone'),'No staff role',r=>`<option value="${r.id}">@${safeText(r.name)}</option>`));
  const pick=(selector,value)=>{const el=typeof selector==='string'?document.querySelector(selector):selector;if(el&&value&&[...el.options].some(o=>o.value===value))el.value=value};
  // Restore every persisted resource selection after Discord's async channel/role list loads.
  const saved=d.selected||{};
  document.querySelectorAll('#saved-panels select[data-selected]').forEach(s=>pick(s,s.dataset.selected));
  pick('#welcome select[name=channelId]',saved.welcome||selectedResources.welcome);
  pick('#invites select[name=channelId]',saved.invite||selectedResources.invite);
  pick('#leave select[name=channelId]',saved.leave||selectedResources.leave);
  pick('#boost select[name=channelId]',saved.boost||selectedResources.boost);
  pick('#ai select[name=channelId]',saved.ai||selectedResources.ai);
  pick('#tickets select[name=channelId]',selectedResources.ticket);
  pick('#voice select[name=channelId]',saved.voice||selectedResources.voice);pick('#voice select[name=categoryId]',saved.category||selectedResources.category);
  pick('#music select[name=voiceChannelId]',saved.musicVoice||selectedResources.musicVoice);pick('#music select[name=textChannelId]',saved.musicText||selectedResources.musicText);pick('#music select[name=djRoleId]',saved.musicRole||selectedResources.musicRole);
  pick('#saved-panels form[action$=ticket-transcripts] select[name=channelId]',saved.transcript||selectedResources.transcript);
  // Apply stored channel to existing editable items where the form exposes a saved index.
  document.querySelectorAll('[data-saved-channel]').forEach(el=>pick(el,el.dataset.savedChannel));
 }catch(e){
  console.error('Guild resources:',e);
  document.querySelectorAll('.channel-select').forEach(s=>{s.innerHTML='';const o=document.createElement('option');o.value='';o.textContent=e.name==='AbortError'?'Loading timed out — tap Retry':e.message;s.append(o)});
  let notice=document.getElementById('resourceLoadError');if(!notice){notice=document.createElement('div');notice.id='resourceLoadError';notice.className='toast error';notice.setAttribute('role','alert');document.querySelector('main.wrap')?.prepend(notice)}
  notice.textContent=`Could not load Discord channels and roles: ${e.name==='AbortError'?'Request timed out.':e.message} `;
  if(!notice.querySelector('button')){const b=document.createElement('button');b.type='button';b.textContent='Retry';b.onclick=()=>{notice.remove();loadResources()};notice.append(b)}
 }finally{clearTimeout(timer)}
}
loadResources();
