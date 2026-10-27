// EmpQR - demo-first employee profile and ID card app.
// Firebase can be enabled by filling firebaseConfig below and setting USE_FIREBASE = true.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, getDocs, setDoc, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const USE_FIREBASE = false;
const firebaseConfig = {
  apiKey: "PASTE_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
let db = null, auth = null, currentUser = null;
if (USE_FIREBASE) {
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app); db = getFirestore(app);
}

const $ = id => document.getElementById(id);
const STORAGE_KEY = "empqr_employees_v1";
const DEMO_ADMIN = { email: "admin@demo.com", password: "EmpQR@123" };
const sampleEmployees = [
  {id:"EMP001",name:"Sujith Kumar",designation:"Full Stack Developer",department:"Engineering",email:"letcrein@gmail.com",phone:"+91 73391 27661",photoUrl:"",linkedin:"",github:"",website:"",bio:"Building useful digital experiences with modern web technologies.",active:true},
  {id:"EMP002",name:"Priya Raman",designation:"UI/UX Designer",department:"Design",email:"priya@example.com",phone:"+91 90000 12345",photoUrl:"",linkedin:"",github:"",website:"",bio:"Designing accessible and thoughtful user experiences.",active:true},
  {id:"EMP003",name:"Arun Prakash",designation:"HR Executive",department:"People & Culture",email:"arun@example.com",phone:"+91 90000 54321",photoUrl:"",linkedin:"",github:"",website:"",bio:"Helping teams grow through people-first practices.",active:true}
];
let employees = [];
let isAdmin = false;
let toastTimer;

function escapeHtml(value="") {
  return String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}
function initials(name="Employee") { return name.trim().split(/\s+/).slice(0,2).map(s=>s[0]||"").join("").toUpperCase(); }
function loadLocal() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch(e) { console.warn("Could not read local records", e); }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleEmployees));
  return structuredClone(sampleEmployees);
}
function saveLocal() { localStorage.setItem(STORAGE_KEY, JSON.stringify(employees)); }
async function loadEmployees() {
  if (!USE_FIREBASE) { employees = loadLocal(); return; }
  const snapshot = await getDocs(collection(db, "employees"));
  employees = snapshot.docs.map(d => ({...d.data(), id:d.id}));
}
async function persistEmployee(employee) {
  if (USE_FIREBASE) await setDoc(doc(db,"employees",employee.id), employee);
  else { const idx=employees.findIndex(e=>e.id===employee.id); if(idx>=0) employees[idx]=employee; else employees.unshift(employee); saveLocal(); }
}
async function removeEmployee(id) {
  if (USE_FIREBASE) await deleteDoc(doc(db,"employees",id));
  else { employees=employees.filter(e=>e.id!==id); saveLocal(); }
}
function notify(message) {
  const t=$("toast"); t.textContent=message; t.classList.add("show");
  clearTimeout(toastTimer); toastTimer=setTimeout(()=>t.classList.remove("show"),2600);
}
function showView(which) {
  $("profileView").classList.toggle("hidden",which!=="profile");
  $("adminView").classList.toggle("hidden",which!=="admin");
  $("profileNav").classList.toggle("active",which==="profile");
  $("adminNav").classList.toggle("active",which==="admin");
  if(which==="admin") renderAdmin();
  else renderProfileFromUrl();
}
function profileUrl(employee) {
  const url=new URL(location.href); url.search=""; url.hash=""; url.searchParams.set("id",employee.id); return url.toString();
}
function linkRow(symbol,label,value,href) {
  if(!value) return "";
  const content=href ? `<a href="${escapeHtml(href)}" ${href.startsWith("http")?'target="_blank" rel="noopener noreferrer"':''}>${escapeHtml(value)}</a>` : escapeHtml(value);
  return `<div class="contact-row"><span class="symbol">${symbol}</span><span>${content}</span></div>`;
}
function renderProfile(employee) {
  if(!employee || !employee.active) {
    $("profileMount").innerHTML=`<div class="not-found"><p class="eyebrow">PROFILE UNAVAILABLE</p><h2>${employee?"Employee profile inactive":"No employee profile found"}</h2><p class="muted">${employee?"This employee profile has been deactivated. Contact your company administrator.":"Scan a valid employee QR code or open a profile URL containing an employee ID."}</p><button class="ghost" id="backToProfiles">View demo profile</button></div>`;
    $("backToProfiles").onclick=()=>{history.replaceState({}, "", location.pathname);renderProfileFromUrl();};
    return;
  }
  const photo=employee.photoUrl ? `<img src="${escapeHtml(employee.photoUrl)}" alt="${escapeHtml(employee.name)}" onerror="this.outerHTML='<div class=&quot;avatar-placeholder&quot;>${escapeHtml(initials(employee.name))}</div>'">` : `<div class="avatar-placeholder">${escapeHtml(initials(employee.name))}</div>`;
  const socials=[employee.linkedin?`<a href="${escapeHtml(employee.linkedin)}" target="_blank" rel="noopener" aria-label="LinkedIn">in</a>`:"",employee.github?`<a href="${escapeHtml(employee.github)}" target="_blank" rel="noopener" aria-label="GitHub">GH</a>`:"",employee.website?`<a href="${escapeHtml(employee.website)}" target="_blank" rel="noopener" aria-label="Website">WEB</a>`:""].filter(Boolean).join("");
  $("profileMount").innerHTML=`
    <article class="profile-card">
      <div class="photo-frame">${photo}</div>
      <h2>${escapeHtml(employee.name)}</h2>
      <p class="role">${escapeHtml(employee.designation)}</p>
      <div class="divider"></div>
      <span class="employee-id">EMPLOYEE ID · ${escapeHtml(employee.id)}</span>
      <div class="contact-list">
        ${employee.department?linkRow("▦","Department",employee.department):""}
        ${employee.email?linkRow("✉","Email",employee.email,"mailto:"+employee.email):""}
        ${employee.phone?linkRow("☎","Phone",employee.phone,"tel:"+employee.phone.replace(/[^\d+]/g,"")):""}
      </div>
      ${employee.bio?`<p class="bio">${escapeHtml(employee.bio)}</p>`:""}
      ${socials?`<p class="social-label">CONNECT WITH ME</p><div class="socials">${socials}</div>`:""}
      <p class="footnote">Digital employee profile · EmpQR</p>
    </article>`;
}
function renderProfileFromUrl() {
  const id=new URLSearchParams(location.search).get("id");
  const employee=id?employees.find(e=>e.id.toLowerCase()===id.toLowerCase()):employees[0];
  renderProfile(employee);
}
function renderAdmin() {
  $("loginPanel").classList.toggle("hidden",isAdmin);
  $("dashboardPanel").classList.toggle("hidden",!isAdmin);
  $("footerMode").textContent=USE_FIREBASE?"Firebase connected":"Demo mode";
  if(!isAdmin)return;
  const query=($("searchInput").value||"").trim().toLowerCase();
  const filtered=employees.filter(e=>[e.name,e.id,e.designation,e.department,e.email].join(" ").toLowerCase().includes(query));
  $("employeeCount").textContent=employees.length;
  $("employeeRows").innerHTML=filtered.map(e=>`<tr>
    <td><div class="person-cell">${e.photoUrl?`<img class="mini-avatar" src="${escapeHtml(e.photoUrl)}" alt="">`:`<span class="mini-avatar">${escapeHtml(initials(e.name))}</span>`}<span><b>${escapeHtml(e.name)}</b><small>${escapeHtml(e.email||"No email added")}</small></span></div></td>
    <td>${escapeHtml(e.id)}</td><td>${escapeHtml(e.department||"—")}<small style="display:block;color:#839087;margin-top:3px">${escapeHtml(e.designation)}</small></td>
    <td><span class="${e.active?'active-badge':'inactive-badge'}">${e.active?'Active':'Inactive'}</span></td>
    <td><div class="action-group"><button class="small-btn" data-action="edit" data-id="${escapeHtml(e.id)}">Edit</button><button class="small-btn" data-action="qr" data-id="${escapeHtml(e.id)}">QR / ID</button><button class="small-btn" data-action="toggle" data-id="${escapeHtml(e.id)}">${e.active?'Deactivate':'Activate'}</button></div></td>
  </tr>`).join("") || `<tr><td colspan="5" class="muted">No matching employees found.</td></tr>`;
}
function openForm(employee=null) {
  $("employeeForm").reset(); $("formMessage").textContent="";
  $("formTitle").textContent=employee?"Edit employee":"Add employee";
  $("originalId").value=employee?.id||"";
  const mapping={fullName:"name",employeeId:"id",designation:"designation",department:"department",email:"email",phone:"phone",photoUrl:"photoUrl",linkedin:"linkedin",github:"github",website:"website",bio:"bio"};
  for(const [field,key] of Object.entries(mapping)) $(field).value=employee?.[key]||"";
  $("employeeId").disabled=!!employee;
  $("employeeDialog").showModal();
}
function formToEmployee() {
  return {id:$("employeeId").value.trim().toUpperCase(),name:$("fullName").value.trim(),designation:$("designation").value.trim(),department:$("department").value.trim(),email:$("email").value.trim(),phone:$("phone").value.trim(),photoUrl:$("photoUrl").value.trim(),linkedin:$("linkedin").value.trim(),github:$("github").value.trim(),website:$("website").value.trim(),bio:$("bio").value.trim(),active:true};
}
function printIdCard(employee) {
  const old=document.querySelector(".print-card"); if(old)old.remove();
  const card=document.createElement("div"); card.className="print-card";
  card.innerHTML=`<div class="print-brand">Emp<span class="print-green">QR</span> <span style="font-size:6pt;font-weight:normal">· EMPLOYEE ID</span></div><div class="print-content">${employee.photoUrl?`<img src="${escapeHtml(employee.photoUrl)}" alt="">`:`<div class="print-avatar">${escapeHtml(initials(employee.name))}</div>`}<div><h2>${escapeHtml(employee.name)}</h2><p><b>${escapeHtml(employee.designation)}</b></p><p>${escapeHtml(employee.department||"")}</p><p>ID: ${escapeHtml(employee.id)}</p><p>${escapeHtml(employee.email||"")}</p></div><div class="print-qr"><div id="printQr"></div><p>SCAN PROFILE</p></div></div><div class="print-footer">Scan QR to view employee's digital profile</div>`;
  document.body.appendChild(card);
  const qrTarget=card.querySelector("#printQr");
  if(window.QRCode) new QRCode(qrTarget,{text:profileUrl(employee),width:120,height:120,colorDark:"#06110a",colorLight:"#ffffff",correctLevel:QRCode.CorrectLevel.M});
  setTimeout(()=>window.print(),500);
}
async function createQr(employee) {
  const url=profileUrl(employee);
  const w=window.open("","_blank","width=440,height=560");
  if(!w){notify("Allow pop-ups to open the QR card.");return;}
  w.document.write(`<!doctype html><html><head><title>EmpQR ${escapeHtml(employee.id)}</title><style>body{background:#080b09;color:#f5f7f5;font-family:Arial;text-align:center;padding:28px}h2{margin-bottom:4px}p{color:#9eaaa1;font-size:13px}#qr{background:white;padding:12px;display:inline-block;border-radius:8px;margin:18px}button{background:#00f477;border:0;border-radius:8px;padding:11px 15px;font-weight:bold;cursor:pointer;margin:5px}</style></head><body><h2>${escapeHtml(employee.name)}</h2><p>${escapeHtml(employee.designation)} · ${escapeHtml(employee.id)}</p><div id="qr"></div><p>Scan to open this employee's digital profile</p><p style="word-break:break-all">${escapeHtml(url)}</p><button onclick="window.print()">Print QR</button><button onclick="navigator.clipboard.writeText('${url.replace(/'/g,"%27")}')">Copy profile URL</button><script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"><\/script><script>new QRCode(document.getElementById('qr'),{text:${JSON.stringify(url)},width:220,height:220});<\/script></body></html>`);
  w.document.close();
}
$("profileNav").onclick=()=>showView("profile");
$("adminNav").onclick=()=>showView("admin");
$("loginBtn").onclick=async()=>{
  const email=$("adminEmail").value.trim(), password=$("adminPassword").value;
  $("loginMessage").textContent="Checking credentials…";
  try {
    if(USE_FIREBASE) { const credential=await signInWithEmailAndPassword(auth,email,password); currentUser=credential.user; }
    else if(email===DEMO_ADMIN.email&&password===DEMO_ADMIN.password) { currentUser={email}; }
    else { throw new Error("Incorrect demo credentials."); }
    isAdmin=true; $("loginMessage").textContent=""; renderAdmin(); notify("Signed in successfully.");
  } catch(err) { $("loginMessage").textContent=USE_FIREBASE?"Sign-in failed. Check your account and Firebase setup.":err.message; }
};
$("logoutBtn").onclick=async()=>{if(USE_FIREBASE)await signOut(auth);isAdmin=false;currentUser=null;renderAdmin();};
$("addEmployeeBtn").onclick=()=>openForm();
$("closeDialog").onclick=$("cancelForm").onclick=()=>$("employeeDialog").close();
$("searchInput").addEventListener("input",renderAdmin);
$("employeeForm").addEventListener("submit",async event=>{
  event.preventDefault();
  const e=formToEmployee(), oldId=$("originalId").value;
  if(!e.name||!e.id||!e.designation){$("formMessage").textContent="Name, Employee ID and Designation are required.";return;}
  if(!oldId&&employees.some(x=>x.id===e.id)){$("formMessage").textContent="That Employee ID already exists. Choose a unique ID.";return;}
  if(oldId){const old=employees.find(x=>x.id===oldId);e.active=old?.active??true;}
  try { await persistEmployee(e); if(USE_FIREBASE)await loadEmployees(); $("employeeDialog").close();renderAdmin();renderProfileFromUrl();notify("Employee saved."); }
  catch(err){$("formMessage").textContent="Could not save employee. Check Firebase configuration and permissions.";console.error(err);}
});
$("employeeRows").addEventListener("click",async event=>{
  const button=event.target.closest("button[data-action]");if(!button)return;
  const e=employees.find(x=>x.id===button.dataset.id);if(!e)return;
  if(button.dataset.action==="edit")openForm(e);
  if(button.dataset.action==="qr") {
    const choice=confirm("OK = open QR code. Cancel = print physical ID card.");
    if(choice)createQr(e);else printIdCard(e);
  }
  if(button.dataset.action==="toggle") {
    const updated={...e,active:!e.active};
    try{await persistEmployee(updated);if(USE_FIREBASE)await loadEmployees();renderAdmin();renderProfileFromUrl();notify(updated.active?"Employee activated.":"Employee deactivated.");}
    catch(err){notify("Could not update employee.");}
  }
});
(async function init(){
  try{await loadEmployees();}catch(err){console.error(err);$("loginMessage").textContent="Could not load employee records. Check Firebase setup."; }
  if(USE_FIREBASE) onAuthStateChanged(auth,user=>{currentUser=user;isAdmin=!!user;renderAdmin();});
  const id=new URLSearchParams(location.search).get("id");
  if(!id) history.replaceState({}, "", location.pathname);
  renderProfileFromUrl();
  if(location.hash==="#admin")showView("admin");
})();