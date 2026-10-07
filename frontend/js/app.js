const $=s=>document.querySelector(s),esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const TIMES=["09:00","09:30","10:00","10:30","11:00","11:30","14:00","14:30","15:00","15:30","16:00","16:30"];
// Cache of data loaded from the REST API. Pages render synchronously from this cache.
let DB={docs:[],appts:[],notes:[],booked:[],stats:{patients:0},me:null};
const docs=()=>DB.docs,getDoc=id=>docs().find(d=>d.id==id),me=()=>DB.me;
// API field names -> the short names the page templates use
const mapDoc=d=>({id:d.id,n:d.name,s:d.specialty,h:d.hospital,y:d.yearsExperience,q:d.qualifications,b:d.bio,d:d.availableDays});
const mapUser=u=>({email:u.email,name:u.name,role:u.role,docId:u.doctorId});
const mapAppt=a=>({id:a.id,docId:a.doctorId,docName:a.doctorName,email:a.patientEmail,patient:a.patientName,date:a.date,time:a.time,reason:a.reason,status:a.status});
async function loadDocs(){DB.docs=(await API.get("/doctors")).map(mapDoc)}
async function loadBooked(id){try{DB.booked=await API.get("/doctors/"+id+"/booked")}catch(e){DB.booked=[]}}
async function loadNotes(){DB.notes=await API.get("/notifications")}
async function refreshPrivate(){const u=me();if(!u)return;
const [ap,nt]=await Promise.all([API.get("/appointments"),API.get("/notifications")]);
DB.appts=ap.map(mapAppt);DB.notes=nt;if(u.role=="admin")DB.stats=await API.get("/admin/stats")}
API.onUnauthorized=()=>{DB.me=null;DB.appts=[];DB.notes=[]};
const iso=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const fmt=d=>new Date(d+"T00:00").toLocaleDateString("en",{weekday:"short",day:"numeric",month:"short",year:"numeric"});
const ini=n=>n.replace("Dr. ","").split(" ").map(w=>w[0]).slice(0,2).join("");
function toast(m){const t=$("#toast");t.textContent=m;t.classList.add("on");setTimeout(()=>t.classList.remove("on"),2800)}
function taken(doc,date,t,skip){return DB.booked.some(x=>x.date==date&&x.time==t&&x.id!=skip)}
const availDays=doc=>{const o=[];for(let k=1;o.length<10&&k<30;k++){const x=new Date();x.setDate(x.getDate()+k);if(doc.d.includes(x.getDay()))o.push(iso(x))}return o};
const card=d=>`<a class="card dc" style="text-decoration:none;color:inherit" href="#/doctor/${d.id}"><div class="av">${ini(d.n)}</div><div><h3>${esc(d.n)}</h3><span class="tag">${esc(d.s)}</span><div class="mute">${esc(d.h)} · ${d.y} yrs experience</div></div></a>`;
let B={date:null,time:null,rid:null},Q="",SP="All";
const R={};
R.home=()=>`<header class="hero"><div class="wrap"><div><h1>Your Health, Our Priority</h1><p>Find the right doctor and book your medical appointment quickly and easily.</p>
<div class="row"><a class="btn" href="#/doctors">Book an Appointment</a><a class="btn alt" href="#/doctors">Find a Doctor</a></div></div>
<svg viewBox="0 0 400 320" role="img" aria-label="Illustration of a doctor's appointment card" style="width:100%;max-width:420px;justify-self:center"><circle cx="200" cy="160" r="140" fill="var(--teal)"/><rect x="90" y="70" width="220" height="180" rx="22" fill="var(--card)" stroke="var(--line)" stroke-width="3"/><circle cx="150" cy="125" r="28" fill="#1565c0"/><path d="M142 110h16v10h10v16h-10v10h-16v-10h-10v-16h10z" fill="#fff"/><rect x="195" y="108" width="85" height="12" rx="6" fill="var(--line)"/><rect x="195" y="130" width="60" height="12" rx="6" fill="var(--line)"/><rect x="115" y="175" width="170" height="14" rx="7" fill="var(--teal)"/><rect x="115" y="200" width="60" height="30" rx="10" fill="#1565c0"/><rect x="185" y="200" width="60" height="30" rx="10" fill="var(--teal)"/></svg></div></header>
<section class="s"><div class="wrap"><h2>Book in three simple steps</h2><div class="grid"><div class="card"><div class="ic">🔍</div><h3>Find a doctor</h3><p class="mute">Search by name, specialty or hospital.</p></div><div class="card"><div class="ic">📅</div><h3>Pick a time</h3><p class="mute">See real availability and choose a slot.</p></div><div class="card"><div class="ic">✅</div><h3>Get confirmed</h3><p class="mute">Receive reminders and manage your visit online.</p></div></div></div></section>
<section class="s" style="padding-top:0"><div class="wrap"><h2>Our doctors</h2><div class="grid">${docs().slice(0,6).map(card).join("")}</div></div></section>`;
R.doctors=()=>{const sp=["All",...new Set(docs().map(d=>d.s))];return `<main class="wrap s"><h1 style="font-size:36px">Find a doctor</h1><label for="q">Search by name, specialty or hospital</label><input id="q" type="search" value="${esc(Q)}" placeholder="e.g. cardiology or City General"><div class="chips" style="margin:14px 0" role="group" aria-label="Specialty">${sp.map(s=>`<button class="chip" aria-pressed="${s==SP}" data-sp="${esc(s)}">${esc(s)}</button>`).join("")}</div><div class="grid" id="res"></div></main>`};
function results(){const q=Q.toLowerCase(),L=docs().filter(d=>(SP=="All"||d.s==SP)&&(d.n+d.s+d.h).toLowerCase().includes(q));$("#res").innerHTML=L.length?L.map(card).join(""):`<p class="mute">No doctors match your search. Try a different name or specialty.</p>`}
R.doctor=(id,qs)=>{const d=getDoc(id);if(!d)return R.doctors();B={date:null,time:null,rid:qs.r||null};const ds=availDays(d);B.date=ds[0];const u=me();
return `<main class="wrap s"><div class="split"><div class="card"><div class="dc"><div class="av" style="width:72px;height:72px;font-size:24px">${ini(d.n)}</div><div><h1 style="font-size:28px;margin:0">${esc(d.n)}</h1><span class="tag">${esc(d.s)}</span></div></div>
<p>${esc(d.b)}</p><h3>Qualifications</h3><p>${esc(d.q)}</p><h3>Experience</h3><p>${d.y} years</p><h3>Hospital</h3><p>${esc(d.h)}</p><h3>Availability</h3><p>${d.d.map(n=>["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][n]).join(", ")}, 09:00–17:00</p></div>
<div class="card"><h2>${B.rid?"Reschedule":"Book"} an appointment</h2><label>Date</label><div class="days" id="days">${ds.map(x=>`<button class="alt" aria-pressed="${x==B.date}" data-dt="${x}">${fmt(x).slice(0,10)}</button>`).join("")}</div><label>Time</label><div class="slots" id="slots"></div>
${B.rid?"":`<label for="rs">Reason for visit</label><select id="rs"><option>New concern</option><option>Follow-up</option><option>Routine check-up</option><option>Test results</option></select>`}
<p class="err" id="err" role="alert"></p><button style="width:100%" data-act="book" data-id="${d.id}">${B.rid?"Confirm new time":"Book appointment"}</button>${u&&u.role=="patient"?"":`<p class="mute">You'll be asked to log in as a patient.</p>`}</div></div></main>`};
function slots(id){const d=getDoc(id);$("#slots").innerHTML=TIMES.map(t=>`<button class="alt" ${taken(d,B.date,t,B.rid)?"disabled":""} aria-pressed="${t==B.time}" data-tm="${t}">${t}</button>`).join("");document.querySelectorAll("#days button").forEach(b=>b.setAttribute("aria-pressed",b.dataset.dt==B.date))}
R.confirm=id=>{const a=DB.appts.find(x=>x.id==id);if(!a)return R.home();return `<main class="wrap s"><div class="card" style="max-width:560px;margin:auto"><div class="ic">✅</div><h1 style="font-size:32px">Appointment requested</h1><p>Your request has been sent. You'll be notified when the doctor confirms it.</p><p><b>${esc(a.docName)}</b><br>${fmt(a.date)} at ${a.time}<br>Reason: ${esc(a.reason)}<br>Status: <span class="tag ${a.status}">${a.status}</span></p><div class="row"><a class="btn" href="#/dashboard">Go to my dashboard</a><a class="btn alt" href="#/doctors">Book another</a></div></div></main>`};
R.login=(_,qs)=>`<main class="wrap s"><div class="split"><div class="card"><h2>Log in</h2><label for="le">Email</label><input id="le" type="email" autocomplete="email"><label for="lp">Password</label><input id="lp" type="password" autocomplete="current-password"><p class="err" id="e1" role="alert"></p><button data-act="login" data-next="${esc(qs.next||"")}">Log in</button><p class="mute">Demo accounts (password demo123): patient@demo.com, doctor@demo.com. Admin: admin@demo.com, password admin123.</p></div>
<div class="card"><h2>Create a patient account</h2><p class="mute">Patient accounts only. Doctors are added by the clinic administrator.</p><label for="rn">Full name</label><input id="rn" autocomplete="name"><label for="re">Email</label><input id="re" type="email"><label for="rp">Password (6+ characters)</label><input id="rp" type="password" autocomplete="new-password"><p class="err" id="e2" role="alert"></p><button data-act="reg">Register</button></div></div></main>`;
const badge=a=>`<span class="tag ${a.status}">${a.status}</span>`;
R.dashboard=()=>{const u=me();if(!u)return go("/login?next=/dashboard");if(u.role=="admin")return admin();const doc=u.role=="doctor",all=DB.appts.filter(a=>doc?a.docId==u.docId:a.email==u.email).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time)),today=iso(new Date());
const up=all.filter(a=>a.date>=today&&["Pending","Confirmed"].includes(a.status)),prev=all.filter(a=>!up.includes(a));
const row=a=>`<div class="appt"><div><b>${esc(doc?a.patient:a.docName)}</b><div class="mute">${fmt(a.date)} at ${a.time} · ${esc(a.reason)}</div></div><div class="row" style="margin:0;align-items:center">${badge(a)}${a.status=="Pending"&&doc?`<button class="sm" data-act="st" data-id="${a.id}" data-v="Confirmed">Confirm</button>`:""}${a.status=="Confirmed"&&doc?`<button class="sm" data-act="st" data-id="${a.id}" data-v="Completed">Mark completed</button>`:""}${["Pending","Confirmed"].includes(a.status)?`${doc?"":`<a class="btn alt sm" href="#/doctor/${a.docId}?r=${a.id}">Reschedule</a>`}<button class="sm bad" data-act="st" data-id="${a.id}" data-v="Cancelled">Cancel</button>`:""}</div></div>`;
return `<main class="wrap s"><h1 style="font-size:34px">${doc?"Doctor":"Patient"} dashboard</h1><p class="mute">Signed in as ${esc(u.name)}</p>${doc?"":`<a class="btn" href="#/doctors">Book a new appointment</a>`}<div class="card" style="margin-top:20px"><h2>${doc?"Scheduled appointments":"Upcoming appointments"}</h2>${up.map(row).join("")||`<p class="mute">Nothing scheduled${doc?"":". Find a doctor to book your first visit"}.</p>`}</div><div class="card" style="margin-top:20px"><h2>Previous and cancelled</h2>${prev.map(row).join("")||`<p class="mute">No past appointments yet.</p>`}</div></main>`};
R.about=()=>`<main class="wrap s"><h1>About MediCare Plus</h1><p style="max-width:62ch">MediCare Plus connects patients with trusted doctors across partner hospitals. Our goal is simple: remove the phone queues and make booking care as easy as sending a message.</p><div class="grid"><div class="card"><div class="ic">🛡️</div><h3>Privacy first</h3><p class="mute">Your details are used only to arrange your appointment.</p></div><div class="card"><div class="ic">👩‍⚕️</div><h3>Verified doctors</h3><p class="mute">Every profile lists qualifications and experience.</p></div><div class="card"><div class="ic">♿</div><h3>Built for everyone</h3><p class="mute">Large text, clear contrast and keyboard-friendly pages.</p></div></div></main>`;
R.faq=()=>{const F=[["How do I book an appointment?","Find a doctor, choose a date and time, and select Book appointment. You need a patient account."],["Can I cancel or reschedule?","Yes. Open your dashboard and choose Cancel or Reschedule on any upcoming appointment."],["What do the statuses mean?","Pending: waiting for the doctor. Confirmed: the doctor accepted. Completed: the visit took place. Cancelled: the appointment was cancelled."],["Will I get reminders?","Yes. The bell icon shows confirmations, changes and reminders for visits in the next 48 hours."],["Is this for emergencies?","No. In an emergency, call your local emergency number or go to the nearest hospital."]];return `<main class="wrap s"><h1>Frequently asked questions</h1><div class="card">${F.map(f=>`<details><summary>${f[0]}</summary><p>${f[1]}</p></details>`).join("")}</div></main>`};
R.contact=()=>`<main class="wrap s"><div class="split"><div><h1>Contact us</h1><p>Questions about your booking? We reply within one working day.</p><p><b>Phone:</b> +94 11 234 5678<br><b>Email:</b> help@medicareplus.example<br><b>Hours:</b> Mon–Sat, 8:00–18:00</p></div><div class="card"><label for="cn">Your name</label><input id="cn"><label for="ce">Email</label><input id="ce" type="email"><label for="cm">Message</label><textarea id="cm" rows="4"></textarea><p class="err" id="e3" role="alert"></p><button data-act="msg">Send message</button></div></div></main>`;

function admin(){const D=docs(),ap=[...DB.appts].sort((a,b)=>(b.date+b.time).localeCompare(a.date+a.time)),st=(n,l)=>`<div class="card"><div style="font-size:34px;font-weight:800">${n}</div><div class="mute">${l}</div></div>`;
return `<main class="wrap s"><h1 style="font-size:34px">Admin dashboard</h1><div class="grid">${st(D.length,"Doctors")}${st(DB.stats.patients,"Patients")}${st(DB.appts.length,"Appointments")}${st(DB.appts.filter(a=>a.status=="Pending").length,"Pending requests")}</div>
<div class="split" style="margin-top:20px;align-items:start"><div class="card"><h2>Add a doctor</h2><p class="mute">This creates the doctor's profile and their login.</p>
<label for="an">Full name</label><input id="an"><label for="asp">Specialty</label><input id="asp"><label for="ah">Hospital</label><input id="ah"><label for="ay">Years of experience</label><input id="ay" type="number" min="0"><label for="aq">Qualifications</label><input id="aq"><label for="ab">Short biography</label><textarea id="ab" rows="2"></textarea>
<label>Available days</label><div>${["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((n,i)=>`<label style="display:inline-flex;gap:6px;font-weight:500;margin:4px 10px 4px 0"><input type="checkbox" class="dyc" value="${i}" style="width:auto" ${i>0&&i<6?"checked":""}>${n}</label>`).join("")}</div>
<label for="ae">Login email</label><input id="ae" type="email"><label for="apw">Temporary password (6+ characters)</label><input id="apw" type="text"><p class="err" id="e4" role="alert"></p><button data-act="adddoc">Add doctor</button></div>
<div class="card"><h2>Doctors</h2>${D.map(d=>`<div class="appt"><div><b>${esc(d.n)}</b><div class="mute">${esc(d.s)} · ${esc(d.h)}</div></div><button class="sm bad" data-act="rmdoc" data-id="${d.id}">Remove</button></div>`).join("")||`<p class="mute">No doctors yet.</p>`}</div></div>
<div class="card" style="margin-top:20px"><h2>All appointments</h2>${ap.map(a=>`<div class="appt"><div><b>${esc(a.patient)}</b> with ${esc(a.docName)}<div class="mute">${fmt(a.date)} at ${a.time} · ${esc(a.reason)}</div></div><div class="row" style="margin:0;align-items:center">${badge(a)}${["Pending","Confirmed"].includes(a.status)?`<button class="sm bad" data-act="st" data-id="${a.id}" data-v="Cancelled">Cancel</button>`:""}</div></div>`).join("")||`<p class="mute">No appointments yet.</p>`}</div></main>`}
function go(p){location.hash="#"+p}
async function render(){const h=location.hash.slice(1)||"/",[path,qstr]=h.split("?"),qs=Object.fromEntries(new URLSearchParams(qstr||"")),p=path.split("/").filter(Boolean),pg=p[0]||"home";
try{if(pg=="doctor")await loadBooked(p[1]);if(pg=="dashboard"||pg=="confirm")await refreshPrivate()}catch(e){toast(e.message)}
$("#app").innerHTML=(R[pg]||R.home)(p[1],qs)||"";if(pg=="doctors")results();if(pg=="doctor"&&getDoc(p[1]))slots(p[1]);
const u=me(),L=[["/","Home"],["/doctors","Find a doctor"],["/about","About"],["/faq","FAQ"],["/contact","Contact"]];
$("#lk").innerHTML=L.map(l=>`<a href="#${l[0]}" ${("/"+(p[0]||""))==l[0]?'aria-current="page"':""}>${l[1]}</a>`).join("")+(u?`<a href="#/dashboard">Dashboard</a><button class="alt sm" data-act="out">Log out</button>`:`<a class="btn sm" href="#/login">Log in / Register</a>`);
bell();window.scrollTo(0,0);document.title="MediCare Plus";}
function bell(){const u=me(),n=u?DB.notes:[],c=n.filter(x=>!x.read).length;$("#bell").innerHTML="🔔"+(c?`<b>${c}</b>`:"");$("#np").innerHTML=`<h3>Notifications</h3>`+(u?(n.slice(0,12).map(x=>`<p>${esc(x.text)}</p>`).join("")||`<p class="mute">No notifications yet.</p>`):`<p class="mute">Log in to see notifications.</p>`)}
const nav=p=>{if((location.hash||"#/")=="#"+p)render();else go(p)};
document.addEventListener("input",e=>{if(e.target.id=="q"){Q=e.target.value;results()}});
document.addEventListener("click",e=>{const b=e.target.closest("button");if(!b){if(!e.target.closest("#np"))$("#np").classList.remove("on");return}
const id=location.hash.split("/")[2]?.split("?")[0];
if(b.id=="mb"){const o=$("#lk").classList.toggle("on");b.setAttribute("aria-expanded",o)}
else if(b.id=="bell"){const open=$("#np").classList.toggle("on");if(me()&&open)openNotes()}
else if(b.dataset.sp){SP=b.dataset.sp;render()}
else if(b.dataset.dt){B.date=b.dataset.dt;B.time=null;slots(id)}
else if(b.dataset.tm){B.time=b.dataset.tm;slots(id)}
else if(b.dataset.act)act(b)});
async function openNotes(){try{await loadNotes();bell();await API.post("/notifications/read");DB.notes.forEach(n=>n.read=true);$("#bell").innerHTML="🔔"}catch(e){toast(e.message)}}
const ERR={login:"#e1",reg:"#e2",book:"#err",adddoc:"#e4",msg:"#e3"};
const EMAIL=/^\S+@\S+\.\S+$/;
async function act(b){const a=b.dataset.act,u=me(),fail=m=>{const el=ERR[a]&&$(ERR[a]);el?el.textContent=m:toast(m)};
try{
if(a=="out"){await API.post("/auth/logout").catch(()=>{});API.setToken(null);DB.me=null;DB.appts=[];DB.notes=[];nav("/");toast("Logged out")}
else if(a=="login"){const r=await API.post("/auth/login",{email:$("#le").value.trim().toLowerCase(),password:$("#lp").value});
API.setToken(r.token);DB.me=mapUser(r.user);await refreshPrivate();nav(b.dataset.next||"/dashboard");toast("Welcome back, "+DB.me.name)}
else if(a=="reg"){const n=$("#rn").value.trim(),em=$("#re").value.trim().toLowerCase(),pw=$("#rp").value;
if(!n||!EMAIL.test(em))return fail("Enter your name and a valid email.");if(pw.length<6)return fail("Password must be at least 6 characters.");
const r=await API.post("/auth/register",{name:n,email:em,password:pw});API.setToken(r.token);DB.me=mapUser(r.user);await refreshPrivate();nav("/dashboard");toast("Account created")}
else if(a=="book"){if(!u||u.role!="patient"){go("/login?next=/doctor/"+b.dataset.id);return toast("Log in as a patient to book")}
if(!B.time)return fail("Choose a time slot.");
const x=mapAppt(B.rid?await API.put("/appointments/"+B.rid+"/reschedule",{date:B.date,time:B.time}):await API.post("/appointments",{doctorId:+b.dataset.id,date:B.date,time:B.time,reason:$("#rs").value}));
await refreshPrivate();nav("/confirm/"+x.id)}
else if(a=="st"){const x=await API.patch("/appointments/"+b.dataset.id+"/status",{status:b.dataset.v});await refreshPrivate();render();toast("Appointment "+x.status.toLowerCase())}
else if(a=="adddoc"){const g=i=>$(i).value.trim(),days=[...document.querySelectorAll(".dyc:checked")].map(c=>+c.value),em=g("#ae").toLowerCase();
if(!g("#an")||!g("#asp")||!g("#ah"))return fail("Enter the doctor's name, specialty and hospital.");if(!days.length)return fail("Select at least one available day.");
if(!EMAIL.test(em))return fail("Enter a valid login email.");if($("#apw").value.length<6)return fail("Password must be at least 6 characters.");
const n=g("#an"),d=await API.post("/doctors",{name:n.startsWith("Dr.")?n:"Dr. "+n,specialty:g("#asp"),hospital:g("#ah"),yearsExperience:+g("#ay")||0,qualifications:g("#aq"),bio:g("#ab"),availableDays:days,email:em,password:$("#apw").value});
await loadDocs();await refreshPrivate();render();toast(d.name+" added")}
else if(a=="rmdoc"){if(!b.dataset.sure){b.dataset.sure=1;b.textContent="Tap again to confirm";return}
await API.del("/doctors/"+b.dataset.id);await loadDocs();await refreshPrivate();render();toast("Doctor removed")}
else if(a=="msg"){if(!$("#cn").value.trim()||!EMAIL.test($("#ce").value)||!$("#cm").value.trim())return fail("Fill in your name, a valid email and a message.");
await API.post("/contact",{name:$("#cn").value.trim(),email:$("#ce").value.trim(),message:$("#cm").value.trim()});toast("Message sent. We'll reply soon.");nav("/")}
}catch(err){fail(err.message);
if(a=="book"){const did=b.dataset.id;await loadBooked(did);slots(did)}}}
window.addEventListener("hashchange",render);
setInterval(()=>{if(me())loadNotes().then(bell).catch(()=>{})},60000);
(async()=>{try{await loadDocs();if(API.getToken()){try{DB.me=mapUser(await API.get("/auth/me"))}catch(e){API.setToken(null)}}}catch(e){toast(e.message)}render()})();
