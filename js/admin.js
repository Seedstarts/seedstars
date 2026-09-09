
let adminClient=null,currentUser=null;
async function bootAdmin(){adminClient=await initSupabase();if(!adminClient){document.querySelector('#adminError').textContent='Supabase could not be loaded. Check internet access.';return}const {data:{session}}=await adminClient.auth.getSession();if(session){currentUser=session.user;await verifyAdmin();}else showLogin();adminClient.auth.onAuthStateChange((_e,session)=>{if(session){currentUser=session.user;verifyAdmin()}else showLogin()});document.querySelector('#loginForm')?.addEventListener('submit',login);document.querySelector('#logoutBtn')?.addEventListener('click',async()=>adminClient.auth.signOut())}
function showLogin(){document.querySelector('#loginScreen').classList.remove('hidden');document.querySelector('#adminApp').classList.add('hidden')}
function showApp(){document.querySelector('#loginScreen').classList.add('hidden');document.querySelector('#adminApp').classList.remove('hidden');document.querySelector('#adminEmail').textContent=currentUser?.email||'';const al=document.querySelector('#accountEmailLabel');if(al)al.textContent=currentUser?.email||'';loadAdminData()}
async function login(e){
  e.preventDefault();
  const email=document.querySelector('#adminEmailInput').value.trim().toLowerCase();
  const password=document.querySelector('#adminPassword').value;
  const err=document.querySelector('#loginError');
  const btn=e.currentTarget.querySelector('button[type="submit"]');
  if(err){err.textContent='';err.classList.add('hidden')}
  if(!adminClient){
    if(err){err.textContent='Cannot reach login service. Check internet and try again.';err.classList.remove('hidden')}
    return;
  }
  if(btn){btn.disabled=true;btn.textContent='Signing in…'}
  try{
    const {data,error}=await adminClient.auth.signInWithPassword({email,password});
    if(error){
      let msg=error.message||'Login failed.';
      if(/invalid login credentials/i.test(msg)) msg='Wrong email or password. Use seedstars.in@gmail.com and the password from SQL (or the one you changed).';
      if(/email not confirmed/i.test(msg)) msg='Email is not confirmed. In Supabase Auth, confirm the user or re-run the admin SQL.';
      if(err){err.textContent=msg;err.classList.remove('hidden')}
      return;
    }
    currentUser=data.user;
    await verifyAdmin();
  }catch(ex){
    if(err){err.textContent='Network error during login. Please try again.';err.classList.remove('hidden')}
    console.error(ex);
  }finally{
    if(btn){btn.disabled=false;btn.textContent='Login →'}
  }
}
async function verifyAdmin(){
  const err=document.querySelector('#loginError');
  try{
    const {data,error}=await adminClient.from('admin_profiles').select('id,role').eq('id',currentUser.id).maybeSingle();
    if(error){
      console.error('admin_profiles error',error);
      await adminClient.auth.signOut();
      if(err){err.textContent='Could not verify admin access: '+error.message+'. Check that admin_profiles table and RLS policies exist.';err.classList.remove('hidden')}
      showLogin();
      return;
    }
    if(!data||data.role!=='admin'){
      await adminClient.auth.signOut();
      if(err){err.textContent='This account is not authorised as a SEEDSTARS administrator. Run the admin SQL insert for seedstars.in@gmail.com.';err.classList.remove('hidden')}
      showLogin();
      return;
    }
    showApp();
  }catch(ex){
    console.error(ex);
    if(err){err.textContent='Admin check failed. See browser console for details.';err.classList.remove('hidden')}
    showLogin();
  }
}
async function loadAdminData(){await Promise.all([loadTable('reviews'),loadTable('updates'),loadTable('events'),loadTable('gallery')]);}
async function loadTable(table){const {data,error}=await adminClient.from(table).select('*').order('created_at',{ascending:false}).limit(100);const box=document.querySelector(`[data-admin-table="${table}"]`);if(!box)return;if(error){box.innerHTML=`<p class="small">${escapeHtml(error.message)}</p>`;return}if(!data?.length){box.innerHTML='<p class="small">No records yet.</p>';return}box.innerHTML=data.map(r=>`<div class="admin-row"><div><strong>${escapeHtml(r.title||r.name||r.event_title||'Untitled')}</strong><div class="small">${escapeHtml(r.description||r.review||r.role||r.event_date||'')}</div></div><div class="admin-actions"><button class="btn-small btn-soft" onclick="openEdit('${table}','${r.id}')">Edit</button><button class="btn-small btn-danger" onclick="deleteRow('${table}','${r.id}')">Delete</button></div></div>`).join('')}
async function openEdit(table,id){
  const {data,error}=await adminClient.from(table).select('*').eq('id',id).single();
  if(error){alert(error.message);return}
  const modal=document.querySelector('#editModal');
  const form=document.querySelector('#editForm');
  form.dataset.table=table; form.dataset.id=id;
  const fields=['name','role','city','rating','review','title','category','description','event_date','image_url','photo_url','caption'];
  fields.forEach(k=>{const el=form.elements[k];if(el){el.value=data[k]??''}});
  form.elements.published.checked=!!data.published;
  modal.classList.remove('hidden');
}
function closeEdit(){document.querySelector('#editModal')?.classList.add('hidden')}
async function submitEdit(e){
  e.preventDefault();
  const form=e.currentTarget,table=form.dataset.table,id=form.dataset.id;
  const obj={};
  ['name','role','city','rating','review','title','category','description','event_date','image_url','photo_url','caption'].forEach(k=>{const el=form.elements[k];if(el&&el.value!=='')obj[k]=k==='rating'?Number(el.value):el.value});
  obj.published=form.elements.published.checked;
  const {error}=await adminClient.from(table).update(obj).eq('id',id);
  if(error){alert(error.message);return}
  closeEdit();loadTable(table)
}

async function deleteRow(table,id){if(!confirm('Delete this item?'))return;const {error}=await adminClient.from(table).delete().eq('id',id);if(error)alert(error.message);else loadTable(table)}
async function saveRecord(table,form){
  const fd=new FormData(form),obj=Object.fromEntries(fd.entries());
  obj.published=obj.published==='on';
  if(table==='reviews') obj.rating=Number(obj.rating||5);
  // Upload optional image directly to Supabase Storage.
  for(const input of form.querySelectorAll('input[type=file]')){
    const file=input.files?.[0];
    if(!file) continue;
    if(!file.type.startsWith('image/')){alert('Please choose an image file.');return;}
    if(file.size>8*1024*1024){alert('Please keep images under 8 MB.');return;}
    const path=`${table}/${Date.now()}-${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g,'-')}`;
    const {error:uploadError}=await adminClient.storage.from('seedstars-media').upload(path,file,{upsert:false,contentType:file.type});
    if(uploadError){alert(uploadError.message);return;}
    const {data:urlData}=adminClient.storage.from('seedstars-media').getPublicUrl(path);
    const urlField=input.name==='photo_file'?'photo_url':'image_url';
    obj[urlField]=urlData.publicUrl;
  }
  Object.keys(obj).forEach(k=>{if(k.endsWith('_file'))delete obj[k]});
  if(!obj.image_url && table!=='reviews') delete obj.image_url;
  if(!obj.photo_url && table==='reviews') delete obj.photo_url;
  const {error}=await adminClient.from(table).insert(obj);
  if(error){alert(error.message);return}
  form.reset();
  loadTable(table)
}

async function changeAdminPassword(e){
  e.preventDefault();
  const cur=document.querySelector('#currentPassword');
  const neu=document.querySelector('#newPassword');
  const conf=document.querySelector('#confirmPassword');
  const ok=document.querySelector('#passwordSuccess');
  const err=document.querySelector('#passwordError');
  if(ok) ok.style.display='none';
  if(err){err.style.display='none';err.textContent=''}
  const current=cur?.value||'';
  const next=neu?.value||'';
  const confirm=conf?.value||'';
  if(next.length<8){
    if(err){err.textContent='New password must be at least 8 characters.';err.style.display='block'}
    return;
  }
  if(next!==confirm){
    if(err){err.textContent='New password and confirmation do not match.';err.style.display='block'}
    return;
  }
  if(next===current){
    if(err){err.textContent='New password must be different from the current password.';err.style.display='block'}
    return;
  }
  const email=currentUser?.email;
  if(!email||!adminClient){
    if(err){err.textContent='You are not signed in.';err.style.display='block'}
    return;
  }
  const btn=e.currentTarget.querySelector('button[type="submit"]');
  const original=btn?btn.textContent:'';
  if(btn){btn.disabled=true;btn.textContent='Updating…'}
  try{
    // Re-authenticate with current password, then update
    const {error:reAuthError}=await adminClient.auth.signInWithPassword({email,password:current});
    if(reAuthError){
      if(err){err.textContent='Current password is incorrect.';err.style.display='block'}
      return;
    }
    const {error:updError}=await adminClient.auth.updateUser({password:next});
    if(updError){
      if(err){err.textContent=updError.message||'Could not update password.';err.style.display='block'}
      return;
    }
    if(ok) ok.style.display='block';
    e.currentTarget.reset();
  }catch(ex){
    if(err){err.textContent='Something went wrong. Please try again.';err.style.display='block'}
    console.error(ex);
  }finally{
    if(btn){btn.disabled=false;btn.textContent=original||'Update password →'}
  }
}

function initAdminForms(){document.querySelectorAll('[data-admin-form]').forEach(f=>f.addEventListener('submit',e=>{e.preventDefault();saveRecord(f.dataset.adminForm,f)}));document.querySelector('#editForm')?.addEventListener('submit',submitEdit);document.querySelector('#changePasswordForm')?.addEventListener('submit',changeAdminPassword)}
document.addEventListener('DOMContentLoaded',async()=>{if(document.body.classList.contains('admin-page')){await bootAdmin();initAdminForms()}})
