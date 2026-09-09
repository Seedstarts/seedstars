
const SB_URL='https://dlscspacphctfwbfouvo.supabase.co';
const SB_KEY='sb_publishable_PfBUJ7uSSuQANlsCUZG9KQ_7O4fEpGL';
let supabaseClient=null;
function loadScript(src){return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=reject;document.head.appendChild(s)})}
async function initSupabase(){if(window.supabase?.createClient){supabaseClient=window.supabase.createClient(SB_URL,SB_KEY);return supabaseClient}try{await loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2');supabaseClient=window.supabase.createClient(SB_URL,SB_KEY);return supabaseClient}catch(e){console.warn('Supabase library could not load.',e);return null}}
function setBrandAssets(){document.querySelectorAll('[data-brand="logo"]').forEach(x=>x.src=SEEDSTARS_BRAND.logo);document.querySelectorAll('[data-brand="director"]').forEach(x=>x.src=SEEDSTARS_BRAND.director);document.querySelectorAll('[data-brand="avenix"]').forEach(x=>x.src=SEEDSTARS_BRAND.avenix)}
function navActive(){const page=document.body.dataset.page;document.querySelectorAll('.nav-links a[data-page]').forEach(a=>{if(a.dataset.page===page)a.classList.add('active')})}
function initMenu(){const nav=document.querySelector('.nav'),btn=document.querySelector('.menu-toggle');if(btn)btn.addEventListener('click',()=>nav.classList.toggle('open'));document.querySelectorAll('.nav-links a').forEach(a=>a.addEventListener('click',()=>nav?.classList.remove('open')))}
function initReveal(){const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');io.unobserve(e.target)}}),{threshold:.12});document.querySelectorAll('.reveal').forEach(el=>io.observe(el))}
function initPreloader(){const p=document.querySelector('.preloader');if(!p)return;window.addEventListener('load',()=>setTimeout(()=>p.classList.add('hide'),500));setTimeout(()=>p.classList.add('hide'),2200)}
function initCounters(){document.querySelectorAll('[data-counter]').forEach(el=>{const end=Number(el.dataset.counter||0);let start=0;const step=Math.max(1,Math.ceil(end/50));const t=setInterval(()=>{start+=step;if(start>=end){start=end;clearInterval(t)}el.textContent=start.toLocaleString()+'+'},28)})}
function initPhone(){document.querySelectorAll('input[type=tel]').forEach(input=>{input.addEventListener('input',()=>{input.value=input.value.replace(/\D/g,'').slice(0,10);input.classList.toggle('invalid',input.value.length>0&&input.value.length!==10)})})}


function initForms(){
  if (typeof window.SEEDSTARS_INIT_FORMS === 'function') {
    window.SEEDSTARS_INIT_FORMS();
  }
}

async function loadPublicContent(){const client=await initSupabase();if(!client)return;try{const {data:reviews}=await client.from('reviews').select('*').eq('published',true).order('created_at',{ascending:false}).limit(12);renderReviews(reviews||[]);const {data:updates}=await client.from('updates').select('*').eq('published',true).order('published_at',{ascending:false}).limit(6);renderUpdates(updates||[]);const {data:events}=await client.from('events').select('*').eq('published',true).order('event_date',{ascending:true}).limit(6);renderEvents(events||[]);const {data:gallery}=await client.from('gallery').select('*').eq('published',true).order('created_at',{ascending:false}).limit(12);renderGallery(gallery||[])}catch(e){console.warn('Public content load skipped until Supabase tables are created.',e)}}
function renderReviews(items){document.querySelectorAll('[data-review-list]').forEach(box=>{if(!items.length)return;box.innerHTML=items.map(r=>`<article class="card">${r.photo_url?`<img src="${escapeAttr(r.photo_url)}" alt="${escapeAttr(r.name||'Client')}" style="width:64px;height:64px;border-radius:50%;object-fit:cover;margin-bottom:14px">`:''}<div class="quote-mark">“</div><p class="quote">${escapeHtml(r.review||'')}</p><div style="margin-top:18px"><strong>${escapeHtml(r.name||'')}</strong><div class="small">${escapeHtml(r.role||'')} ${r.city?' · '+escapeHtml(r.city):''}</div><div style="color:#c49a4a;margin-top:5px">${'★'.repeat(Number(r.rating||5))}</div></div></article>`).join('')})}
function renderUpdates(items){document.querySelectorAll('[data-update-list]').forEach(box=>{if(!items.length)return;box.innerHTML=items.map(x=>`<article class="card image-card">${x.image_url?`<img src="${escapeAttr(x.image_url)}" alt="${escapeAttr(x.title||'Update')}">`:''}<div class="content"><span class="badge">${escapeHtml(x.category||'Update')}</span><h3>${escapeHtml(x.title||'')}</h3><p>${escapeHtml(x.description||'')}</p></div></article>`).join('')})}
function renderGallery(items){document.querySelectorAll('[data-gallery-list]').forEach(box=>{if(!items.length)return;box.innerHTML=items.map(x=>`<article class="card image-card"><img src="${escapeAttr(x.image_url)}" alt="${escapeAttr(x.title||'SEEDSTARS') }"><div class="content"><h3>${escapeHtml(x.title||'')}</h3><p>${escapeHtml(x.caption||'')}</p></div></article>`).join('')})}
function renderEvents(items){document.querySelectorAll('[data-event-list]').forEach(box=>{if(!items.length)return;box.innerHTML=items.map(x=>`<article class="card image-card">${x.image_url?`<img src="${escapeAttr(x.image_url)}" alt="${escapeAttr(x.title||'Event')}">`:''}<div class="content"><span class="badge">${escapeHtml(x.event_date||'')}</span><h3>${escapeHtml(x.title||'')}</h3><p>${escapeHtml(x.description||'')}</p></div></article>`).join('')})}
function escapeHtml(s){return String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}function escapeAttr(s){return escapeHtml(s)}

const COUNTRY_DATA = {
  russia: {
    title: 'Russia',
    flag: 'https://flagcdn.com/w160/ru.png',
    img: 'images/countries/russia.jpg',
    tagline: 'A leading destination for medical and technical education.',
    desc: '<p>Russia offers a wide range of undergraduate and postgraduate programmes, with many universities recognised for medicine, engineering and science. Indian students often choose Russia for structured MBBS pathways and comparatively affordable tuition.</p><p>SEEDSTARS helps you shortlist universities, understand eligibility, prepare applications and plan your journey from offer letter to departure.</p>',
    help: ['University & course shortlisting','Application and document guidance','SOP support where required','Visa process overview','Pre-departure checklist']
  },
  azerbaijan: {
    title: 'Azerbaijan',
    flag: 'https://flagcdn.com/w160/az.png',
    img: 'images/countries/azerbaijan.jpg',
    tagline: 'Modern campuses and a growing international student community.',
    desc: '<p>Azerbaijan is emerging as a practical study destination with English-medium options in selected programmes, cultural familiarity for many South Asian students, and competitive living costs in student cities such as Baku.</p><p>We guide you through course fit, university options and the steps needed to move from enquiry to enrolment.</p>',
    help: ['Programme and university matching','Application timeline planning','Document checklist support','Visa guidance overview','Student life orientation tips']
  },
  kazakhstan: {
    title: 'Kazakhstan',
    flag: 'https://flagcdn.com/w160/kz.png',
    img: 'images/countries/kazakhstan.jpg',
    tagline: 'Strong MBBS and higher-education pathways with modern facilities.',
    desc: '<p>Kazakhstan is frequently considered for medical education and other higher-study options. Several institutions follow curricula aligned with international standards and provide dedicated support for overseas students.</p><p>SEEDSTARS works with you to clarify eligibility, compare options and prepare a clear application plan.</p>',
    help: ['MBBS & academic pathway counselling','University comparison','Application support','Visa process guidance','Pre-departure preparation']
  },
  uzbekistan: {
    title: 'Uzbekistan',
    flag: 'https://flagcdn.com/w160/uz.png',
    img: 'images/countries/uzbekistan.jpg',
    tagline: 'Cost-effective medical and academic programmes with rising interest.',
    desc: '<p>Uzbekistan is gaining attention for medical and related programmes with relatively lower tuition and living costs. It can be a practical option when budget and course fit are both important.</p><p>Our team helps you understand the landscape, shortlist institutions and complete each step with clarity.</p>',
    help: ['Course and university shortlisting','Budget-aware planning','Application document support','Visa overview','Departure readiness guidance']
  }
};

function initCountryExplore(){
  const modal = document.getElementById('countryModal');
  if(!modal) return;
  const open = (key)=>{
    const data = COUNTRY_DATA[key];
    if(!data) return;
    document.getElementById('countryModalTitle').textContent = data.title;
    document.getElementById('countryModalTagline').textContent = data.tagline;
    document.getElementById('countryModalImg').src = data.img;
    document.getElementById('countryModalImg').alt = data.title;
    document.getElementById('countryModalFlag').src = data.flag;
    document.getElementById('countryModalFlag').alt = data.title + ' flag';
    document.getElementById('countryModalDesc').innerHTML = data.desc;
    document.getElementById('countryModalHelp').innerHTML = data.help.map(x=>'<li>'+x+'</li>').join('');
    document.getElementById('countryModalFormCountry').textContent = data.title;
    const svc = document.getElementById('countryServiceField');
    if(svc) svc.value = 'Study Abroad Guidance – ' + data.title;
    const msg = document.getElementById('countryMessageField');
    if(msg) msg.value = 'I am interested in study abroad guidance for ' + data.title + '.';
    // reset form messages
    modal.querySelectorAll('.success,.error').forEach(el=>{el.style.display='none'});
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden','false');
    document.body.style.overflow='hidden';
  };
  const close = ()=>{
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden','true');
    document.body.style.overflow='';
  };
  document.querySelectorAll('.explore-country').forEach(btn=>{
    btn.addEventListener('click',()=>open(btn.dataset.country));
  });
  modal.querySelectorAll('[data-close-modal]').forEach(el=>el.addEventListener('click',close));
  document.addEventListener('keydown',e=>{if(e.key==='Escape' && !modal.classList.contains('hidden')) close()});
}

function markFontsReady(){
  const done=()=>document.body.classList.add('fonts-ready');
  if(document.fonts && document.fonts.ready){
    document.fonts.ready.then(done).catch(done);
    setTimeout(done,1200);
  }else{
    setTimeout(done,300);
  }
}
function init(){
  document.body.classList.remove('js-loading');
  document.body.classList.add('js-ready');
  setBrandAssets();
  navActive();
  initMenu();
  initReveal();
  initPreloader();
  initCounters();
  initPhone();
  initForms();
  initCountryExplore();
  markFontsReady();
  if(document.querySelector('[data-dynamic-content]')) loadPublicContent();
}
document.addEventListener('DOMContentLoaded',init);
window.addEventListener('load',()=>document.body.classList.add('fonts-ready'));
