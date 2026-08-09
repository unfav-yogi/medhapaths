// =====================================================================
// MEDHAPATH — vanilla JS frontend (no build step, no framework)
// =====================================================================

const state = {
  page: "home",
  verifyPrefill: "",
  adminAuthed: false,
  students: [],
  templates: [],
  workshops: [],
  showcase: [],
  certificates: [],
  settings: {},
  stats: {},
};

// ---------------------------------------------------------------------
// API helper
// ---------------------------------------------------------------------
async function api(path, opts = {}) {
  const res = await fetch(`/api${path}`, {
    method: opts.method || "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  let data = null;
  const raw = await res.text();
  try { data = raw ? JSON.parse(raw) : null; } catch (e) {
    if (!res.ok) console.error(`Non-JSON error response from ${path} (${res.status}):`, raw.slice(0, 500));
  }
  if (!res.ok) {
    const err = new Error((data && (data.message || data.error)) || `Request failed (${res.status})`);
    err.status = res.status;
    err.payload = data;
    throw err;
  }
  return data;
}

// ---------------------------------------------------------------------
// Tiny icon set (inline SVG, currentColor)
// ---------------------------------------------------------------------
const ICONS = {
  shield: '<path d="M12 2 4 5v6c0 5 3.4 8.4 8 11 4.6-2.6 8-6 8-11V5l-8-3Z"/><path d="m9 12 2 2 4-4"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  award: '<circle cx="12" cy="8" r="6"/><path d="M9 13.5 7 22l5-3 5 3-2-8.5"/>',
  download: '<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>',
  users: '<circle cx="9" cy="8" r="4"/><path d="M2 21v-2a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v2"/><path d="M17 11a4 4 0 0 0 0-8"/><path d="M23 21v-2a5 5 0 0 0-4-4.9"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
  plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
  trash: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  upload: '<path d="M12 21V9"/><path d="m7 14 5-5 5 5"/><path d="M5 21h14"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  x: '<path d="M18 6 6 18"/><path d="M6 6l12 12"/>',
  chevron: '<path d="m9 18 6-6-6-6"/>',
  badge: '<circle cx="12" cy="8" r="6"/><path d="M9 13.5 7 22l5-3 5 3-2-8.5"/><path d="m9.5 8 1.5 1.5L15 6"/>',
  alert: '<circle cx="12" cy="12" r="10"/><path d="M12 8v5"/><path d="M12 16h.01"/>',
  circlex: '<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>',
  linkedin: '<rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/><path d="M10 9v12"/><path d="M10 13a4 4 0 0 1 8 0v8"/>',
  github: '<path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C7.5 2.8 6.4 3.1 6.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 5 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21"/>',
  building: '<rect x="4" y="2" width="16" height="20" rx="1"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01"/>',
  menu: '<path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/>',
  sparkles: '<path d="m12 3 1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5Z"/>',
  clipboard: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M9 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-3"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.2a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.2a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.2a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.2a1.6 1.6 0 0 0-1.5 1Z"/>',
};
function icon(name, size = 16, color = "currentColor") {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0">${ICONS[name] || ""}</svg>`;
}

// ---------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------
function go(page) {
  state.page = page;
  render();
  window.scrollTo(0, 0);
}

function parseHashVerify() {
  const m = window.location.hash.match(/#verify\?code=([^&]+)/);
  if (m) {
    state.verifyPrefill = decodeURIComponent(m[1]);
    state.page = "verification";
  }
}

function goVerify(code) {
  state.verifyPrefill = code;
  go("verification");
}

// ---------------------------------------------------------------------
// Layout: Navbar / Footer
// ---------------------------------------------------------------------
const NAV_LINKS = [
  ["home", "Home"], ["generator", "Generator"], ["verification", "Verify"],
  ["courses", "Courses"], ["registration", "Registration"], ["about", "About"], ["contact", "Contact"],
];

let mobileNavOpen = false;

function renderNavbar() {
  const links = NAV_LINKS.map(([id, label]) => `
    <button onclick="go('${id}')" style="font-size:14px;font-weight:500;padding:8px 4px;background:transparent;
      color:${state.page === id ? "var(--brass)" : "var(--slate-light)"};border:none;cursor:pointer;
      border-bottom:2px solid ${state.page === id ? "var(--brass)" : "transparent"};white-space:nowrap;">${label}</button>
  `).join("");

  const mobileLinks = NAV_LINKS.map(([id, label]) => `
    <button onclick="go('${id}'); toggleMobileNav(false);" style="text-align:left;padding:10px 0;font-size:15px;
      background:none;border:none;color:${state.page === id ? "var(--brass)" : "var(--slate)"};">${label}</button>
  `).join("");

  return `
  <div style="border-bottom:1px solid var(--ink-line);background:var(--ink);position:sticky;top:0;z-index:30;">
    <div class="max-w-6xl" style="display:flex;align-items:center;justify-content:space-between;padding:14px 20px;">
      <div style="display:flex;align-items:center;gap:8px;cursor:pointer;" onclick="go('home')">
        <img src="/static/img/logo.png" alt="MEDHAPATH logo" style="width:34px;height:34px;object-fit:contain;" />
        <span class="font-display" style="font-weight:600;font-size:19px;">MEDHAPATH</span>
      </div>
      <div class="nav-desktop">${links}</div>
      <div style="display:flex;align-items:center;gap:12px;">
        <button aria-hidden="true" tabindex="-1" onclick="go('admin')" style="width:14px;height:14px;background:transparent;border:none;cursor:default;"></button>
        <button class="nav-toggle" onclick="toggleMobileNav()" style="background:none;border:none;color:var(--slate);">${icon("menu", 22)}</button>
      </div>
    </div>
    <div id="mobile-nav" class="nav-mobile" style="display:${mobileNavOpen ? "flex" : "none"};flex-direction:column;padding:4px 20px 14px;gap:4px;">
      ${mobileLinks}
    </div>
  </div>`;
}

function toggleMobileNav(force) {
  mobileNavOpen = typeof force === "boolean" ? force : !mobileNavOpen;
  const el = document.getElementById("mobile-nav");
  if (el) el.style.display = mobileNavOpen ? "flex" : "none";
}

function renderFooter() {
  return `
  <div style="border-top:1px solid var(--ink-line);margin-top:60px;">
    <div class="max-w-6xl footer-flex" style="padding:26px 20px;color:var(--slate);font-size:13px;">
      <button onclick="footerAdminClick()" title="" style="background:none;border:none;color:var(--slate);cursor:default;font-size:13px;padding:0;font-family:inherit;">© ${new Date().getFullYear()} MEDHAPATH Digital Verification Authority</button>
      <div style="display:flex;gap:20px;">
        <button onclick="go('about')" style="background:none;border:none;color:var(--slate);cursor:pointer;">About</button>
        <button onclick="go('contact')" style="background:none;border:none;color:var(--slate);cursor:pointer;">Contact</button>
        <button onclick="go('verification')" style="background:none;border:none;color:var(--slate);cursor:pointer;">Verify a certificate</button>
      </div>
    </div>
  </div>`;
}

function sectionHeading(eyebrow, title) {
  return `<div><div class="section-eyebrow">${eyebrow}</div><h2 class="section-title">${title}</h2></div>`;
}

// =====================================================================
// Home page
// =====================================================================
async function renderHome() {
  const [workshops, showcase, stats, devStatus] = await Promise.all([
    api("/workshops").catch(() => []),
    api("/showcase").catch(() => []),
    api("/stats").catch(() => ({})),
    api("/dev/status").catch(() => ({ dev_mode: false })),
  ]);
  state.workshops = workshops; state.showcase = showcase; state.stats = stats;

  const devButton = devStatus.dev_mode ? `
    <button onclick="devLogin()" title="Dev-mode admin shortcut — only active because DEV_MODE=1 is set"
      style="position:fixed;bottom:14px;right:14px;width:10px;height:10px;border-radius:50%;
      background:transparent;border:none;cursor:pointer;z-index:40;opacity:0;"></button>` : "";

  const workshopCards = workshops.map(w => `
    <div class="card">
      <span class="pill">${w.category || ""}</span>
      <h3 class="font-display" style="font-size:19px;font-weight:600;margin:12px 0 6px;">${w.title}</h3>
      <p style="color:var(--slate-light);font-size:13.5px;line-height:1.55;min-height:40px;">${w.description || ""}</p>
      <div style="display:flex;justify-content:space-between;margin-top:16px;font-size:12.5px;color:var(--slate);">
        <span>${w.instructor || ""}</span><span>${w.duration || ""}</span>
      </div>
    </div>`).join("");

  const showcaseCards = showcase.map(s => `
    <div class="card" style="display:flex;gap:16px;">
      <div style="width:46px;height:46px;border-radius:999px;background:#3A331F;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
        <span style="color:var(--brass);font-weight:600;font-size:15px;">${(s.student_name || "").split(" ").map(n => n[0]).slice(0, 2).join("")}</span>
      </div>
      <div>
        <h4 style="font-weight:600;font-size:15px;">${s.student_name}</h4>
        <p style="font-size:12.5px;color:var(--brass);margin-bottom:6px;">${s.workshop_title || ""}</p>
        <p style="font-size:13px;color:var(--slate-light);line-height:1.5;">${s.bio || ""}</p>
        <div style="display:flex;align-items:center;gap:16px;margin-top:10px;">
          ${icon("linkedin", 15, "var(--slate)")} ${icon("github", 15, "var(--slate)")}
          ${s.certificate_code ? `<button onclick="goVerify('${s.certificate_code}')" class="font-mono" style="font-size:11.5px;color:var(--brass);background:none;border:none;cursor:pointer;display:flex;align-items:center;gap:4px;">${icon("badge", 13)} ${s.certificate_code}</button>` : ""}
        </div>
      </div>
    </div>`).join("");

  return `
  ${devButton}
  <div class="max-w-6xl" style="padding:70px 20px 40px;position:relative;">
    <div class="sticker" style="top:10px;right:6%;">${icon("sparkles", 26, "var(--brass)")}</div>
    <div class="sticker delay1" style="top:60%;left:2%;">${icon("award", 22, "var(--brass)")}</div>
    <div class="sticker delay2" style="bottom:6%;right:10%;">${icon("badge", 20, "var(--brass)")}</div>
    <div class="grid-auto grid-2-md" style="align-items:center;gap:40px;">
      <div>
        <div style="display:inline-flex;align-items:center;gap:8px;border:1px solid var(--ink-line);border-radius:999px;padding:6px 12px;margin-bottom:22px;">
          ${icon("sparkles", 13, "var(--brass)")}
          <span style="font-size:12.5px;color:var(--slate-light);">Cryptographically verifiable, issued in seconds</span>
        </div>
        <h1 class="font-display" style="font-size:44px;line-height:1.1;font-weight:600;margin-bottom:18px;">
          A certificate is only worth what can be <span style="color:var(--brass);">verified.</span>
        </h1>
        <p style="color:var(--slate-light);font-size:16px;line-height:1.65;margin-bottom:28px;max-width:470px;">
          MEDHAPATH issues, signs and hosts digital certificates for every workshop we run —
          each one carries a unique ID that anyone can check in seconds.
        </p>
        <div style="display:flex;flex-wrap:wrap;gap:12px;">
          <button onclick="go('verification')" class="btn-primary">${icon("search", 16)} Verify a certificate</button>
          <button onclick="go('generator')" class="btn-ghost">${icon("award", 16)} Generate certificate ${icon("chevron", 15)}</button>
        </div>
        <div style="display:flex;gap:32px;margin-top:40px;">
          <div><div class="font-display" style="font-size:26px;font-weight:600;color:var(--brass);">${(stats.total_certificates || 0) + 128}+</div><div style="font-size:12.5px;color:var(--slate);margin-top:2px;">Verified certificates</div></div>
          <div><div class="font-display" style="font-size:26px;font-weight:600;color:var(--brass);">${(stats.authorized_students || 0) + 340}+</div><div style="font-size:12.5px;color:var(--slate);margin-top:2px;">Authorized students</div></div>
          <div><div class="font-display" style="font-size:26px;font-weight:600;color:var(--brass);">${(stats.partner_organizations || 0) + 12}+</div><div style="font-size:12.5px;color:var(--slate);margin-top:2px;">Partner organizations</div></div>
        </div>

        <div style="margin-top:36px;">
          <div style="font-size:11.5px;color:var(--slate);text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;">Associated with</div>
          <div style="display:flex;align-items:center;gap:18px;">
            <img src="/static/img/dharmovix.jpg" alt="DHARMOVIX Technologies logo" style="height:44px;width:44px;border-radius:50%;object-fit:cover;" />
            <img src="/static/img/proaca.jpg" alt="ProAca Academy logo" style="height:44px;width:44px;border-radius:50%;object-fit:cover;" />
          </div>
        </div>
      </div>
      <div style="background:var(--parchment);border-radius:14px;padding:26px;border:1px solid var(--parchment-line);transform:rotate(1deg);box-shadow:0 20px 50px rgba(0,0,0,.35);">
        <div style="border:2px solid #8C6C28;border-radius:6px;padding:22px;text-align:center;">
          ${icon("shield", 20, "#8C6C28")}
          <div style="font-size:10px;letter-spacing:2px;color:#8C6C28;text-transform:uppercase;margin-top:8px;">Certificate of achievement</div>
          <div class="font-display" style="font-size:24px;font-weight:600;color:#26200F;margin:10px 0 4px;">Ananya Reddy</div>
          <div style="font-size:12.5px;color:#5A5232;">Applied Machine Learning</div>
        </div>
      </div>
    </div>
  </div>

  <div style="position:relative; padding: 20px 0;">
    <div style="position:absolute; inset:0; background-image: linear-gradient(rgba(16,21,31,0.88), rgba(16,21,31,0.95)), url(/static/img/workshop_bg.jpg); background-size:cover; background-position:center; z-index:0;"></div>
    <div class="max-w-6xl" style="padding:36px 20px 10px; position:relative; z-index:1;">
      ${sectionHeading("Programs", "Upcoming workshops")}
      <div class="grid-auto grid-2-3" style="margin-top:26px;">${workshopCards || `<p style="color:var(--slate);">No workshops yet.</p>`}</div>
    </div>
  </div>

  <div class="max-w-6xl" style="padding:56px 20px 10px;">
    ${sectionHeading("Trust", "Built for verification, not just design")}
    <div class="grid-auto grid-2-4" style="margin-top:26px;">
      <div class="card">${icon("shield", 20, "var(--brass)")}<h4 style="font-weight:600;font-size:15px;margin:12px 0 6px;">Instant verification</h4><p style="color:var(--slate);font-size:13px;line-height:1.55;">Every certificate resolves to a live status in under a second.</p></div>
      <div class="card">${icon("badge", 20, "var(--brass)")}<h4 style="font-weight:600;font-size:15px;margin:12px 0 6px;">Unique signed ID</h4><p style="color:var(--slate);font-size:13px;line-height:1.55;">Each certificate carries a unique ID tied permanently to its record.</p></div>
      <div class="card">${icon("users", 20, "var(--brass)")}<h4 style="font-weight:600;font-size:15px;margin:12px 0 6px;">Bulk issuance</h4><p style="color:var(--slate);font-size:13px;line-height:1.55;">Authorize entire cohorts at once from a spreadsheet.</p></div>
      <div class="card">${icon("grid", 20, "var(--brass)")}<h4 style="font-weight:600;font-size:15px;margin:12px 0 6px;">Custom templates</h4><p style="color:var(--slate);font-size:13px;line-height:1.55;">Switch the certificate design without touching a single record.</p></div>
    </div>
  </div>

  ${showcase.length ? `
  <div class="max-w-6xl" style="padding:56px 20px 10px;">
    ${sectionHeading("Alumni", "Student showcase")}
    <div class="grid-auto grid-2" style="margin-top:26px;">${showcaseCards}</div>
  </div>` : ""}

  <div class="max-w-6xl" style="padding:56px 20px 40px;">
    ${sectionHeading("Process", "How it works")}
    <div class="grid-auto grid-3" style="margin-top:26px;">
      <div class="card"><span class="font-mono" style="font-size:12px;color:var(--brass);">01</span><h4 style="font-weight:600;font-size:15px;margin:8px 0 6px;">Authorization</h4><p style="color:var(--slate);font-size:13px;line-height:1.55;">Admins add students to the roster, individually or by CSV import.</p></div>
      <div class="card"><span class="font-mono" style="font-size:12px;color:var(--brass);">02</span><h4 style="font-weight:600;font-size:15px;margin:8px 0 6px;">Generation</h4><p style="color:var(--slate);font-size:13px;line-height:1.55;">The student's name is matched, a unique certificate is signed and rendered.</p></div>
      <div class="card"><span class="font-mono" style="font-size:12px;color:var(--brass);">03</span><h4 style="font-weight:600;font-size:15px;margin:8px 0 6px;">Verification</h4><p style="color:var(--slate);font-size:13px;line-height:1.55;">Anyone can enter the ID to confirm authenticity instantly.</p></div>
    </div>
  </div>`;
}

// =====================================================================
// Certificate canvas rendering (shared by Generator + Admin preview)
// =====================================================================
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function formatLongDate(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

async function drawCertificate(canvas, opts) {
  const {
    studentName, courseName, code, issueDate, org, signatoryName, signatoryTitle,
    accentColor = "#8C6C28", backgroundImage, overlayTextColor,
    nameFont = "script",
    nameXPercent = 50, nameYPercent = 44,
    dateXPercent = 50, dateYPercent = 48.6,
    idXPercent = 6.4, idYPercent = 89.9,
  } = opts;
  const W = 1400, H = 990;
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");

  if (backgroundImage) {
    try {
      const img = await loadImage(backgroundImage);
      const scale = Math.max(W / img.width, H / img.height);
      const iw = img.width * scale, ih = img.height * scale;
      ctx.drawImage(img, (W - iw) / 2, (H - ih) / 2, iw, ih);
    } catch (e) {
      ctx.fillStyle = "#F5EFE1"; ctx.fillRect(0, 0, W, H);
    }
    const textColor = overlayTextColor || "#26200F";
    const nameX = W * (nameXPercent / 100), nameY = H * (nameYPercent / 100);
    const dateX = W * (dateXPercent / 100), dateY = H * (dateYPercent / 100);
    const idX = W * (idXPercent / 100), idY = H * (idYPercent / 100);

    ctx.textAlign = "center"; ctx.fillStyle = textColor;
    if (nameFont === "script") {
      ctx.font = "400 84px 'Alex Brush', cursive";
    } else {
      ctx.font = "600 50px 'Fraunces', serif";
    }
    ctx.fillText(studentName, nameX, nameY);

    ctx.font = "500 15px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText(`Issued on ${formatLongDate(issueDate)}`, dateX, dateY);

    ctx.font = "600 15px 'Plus Jakarta Sans', sans-serif";
    const idLabel = "ID: ";
    const idLabelWidth = ctx.measureText(idLabel).width;
    ctx.font = "500 15px 'JetBrains Mono', monospace";
    const idCodeWidth = ctx.measureText(code).width;
    const totalIdWidth = idLabelWidth + idCodeWidth;
    const idStartX = idX - totalIdWidth / 2;
    ctx.textAlign = "left";
    ctx.font = "600 15px 'Plus Jakarta Sans', sans-serif";
    ctx.fillStyle = textColor;
    ctx.fillText(idLabel, idStartX, idY);
    ctx.font = "500 15px 'JetBrains Mono', monospace";
    ctx.fillText(code, idStartX + idLabelWidth, idY);
    ctx.strokeStyle = accentColor; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(idStartX, idY + 10); ctx.lineTo(idStartX + totalIdWidth, idY + 10); ctx.stroke();
    return;
  }

  // Default parchment design (no uploaded template)
  ctx.fillStyle = "#F5EFE1"; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = accentColor; ctx.lineWidth = 6; ctx.strokeRect(30, 30, W - 60, H - 60);
  ctx.lineWidth = 1.5; ctx.strokeRect(48, 48, W - 96, H - 96);

  ctx.textAlign = "center";
  ctx.font = "500 13px 'Plus Jakarta Sans', sans-serif"; ctx.fillStyle = "#8C6C28";
  ctx.fillText("C E R T I F I C A T E   O F   A C H I E V E M E N T", W / 2, 150);

  ctx.fillStyle = "#26200F"; ctx.font = "600 58px 'Fraunces', serif";
  ctx.fillText(studentName, W / 2, 300);

  ctx.font = "400 15px 'Plus Jakarta Sans', sans-serif"; ctx.fillStyle = "#5A5232";
  ctx.fillText("has successfully completed the program", W / 2, 350);

  ctx.font = "600 30px 'Fraunces', serif"; ctx.fillStyle = "#3A331F";
  ctx.fillText(courseName, W / 2, 410);

  ctx.font = "400 14px 'Plus Jakarta Sans', sans-serif"; ctx.fillStyle = "#7A7148";
  ctx.fillText(`Issued on ${formatLongDate(issueDate)} by ${org}`, W / 2, 460);

  ctx.beginPath(); ctx.arc(W / 2, 570, 62, 0, Math.PI * 2);
  ctx.strokeStyle = accentColor; ctx.lineWidth = 3; ctx.stroke();
  ctx.beginPath(); ctx.arc(W / 2, 570, 50, 0, Math.PI * 2); ctx.stroke();
  ctx.font = "600 22px 'Fraunces', serif"; ctx.fillStyle = accentColor;
  ctx.fillText("MP", W / 2, 580);

  ctx.strokeStyle = "#5A5232"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(W / 2 - 130, 700); ctx.lineTo(W / 2 + 130, 700); ctx.stroke();
  ctx.font = "italic 22px 'Fraunces', serif"; ctx.fillStyle = "#26200F";
  ctx.fillText(signatoryName || "Authorized signatory", W / 2, 690);
  ctx.font = "400 12px 'Plus Jakarta Sans', sans-serif"; ctx.fillStyle = "#7A7148";
  ctx.fillText(signatoryTitle || "", W / 2, 720);

  ctx.textAlign = "left"; ctx.font = "600 15px 'Plus Jakarta Sans', sans-serif"; ctx.fillStyle = "#8C6C28";
  const idLabel = "ID: ";
  ctx.fillText(idLabel, 90, H - 90);
  const idLabelWidth = ctx.measureText(idLabel).width;
  ctx.font = "500 15px 'JetBrains Mono', monospace"; ctx.fillStyle = "#7A7148";
  ctx.fillText(code, 90 + idLabelWidth, H - 90);
  const codeWidth = ctx.measureText(code).width;
  ctx.strokeStyle = accentColor; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(90, H - 80); ctx.lineTo(90 + idLabelWidth + codeWidth, H - 80); ctx.stroke();
}

function downloadCanvasPNG(canvas, filename) {
  const dataUrl = canvas.toDataURL("image/png");
  const win = window.open();
  if (win) {
    win.document.write(`
      <html><head><title>${filename}</title></head>
      <body style="margin:0;background:#10151F;display:flex;align-items:center;justify-content:center;min-height:100vh;">
        <div style="text-align:center;font-family:sans-serif;">
          <img src="${dataUrl}" style="max-width:95vw;height:auto;border-radius:8px;" />
          <p style="color:#8B93A6;margin-top:16px;">Right-click the certificate above and choose "Save image as…" to download it.</p>
        </div>
      </body></html>`);
    win.document.close();
  } else {
    const link = document.createElement("a");
    link.download = `${filename}.png`;
    link.href = dataUrl;
    link.click();
  }
}

function downloadCanvasPDF(canvas, filename) {
  const dataUrl = canvas.toDataURL("image/png");
  const win = window.open();
  if (win) {
    win.document.write(`
      <html><head><title>${filename}</title>
      <style>@page { size: landscape; margin: 0; } body { margin: 0; }</style>
      </head><body><img src="${dataUrl}" style="width:100%;display:block;" onload="window.print();" /></body></html>`);
    win.document.close();
  }
}

// =====================================================================
// Generator page
// =====================================================================
let generatorResult = null;

async function renderGenerator() {
  const templates = await api("/templates").catch(() => []);
  state.templates = templates;
  const active = templates.find(t => t.is_active) || templates[0];

  return `
  <div class="max-w-5xl" style="padding:50px 20px 80px;position:relative;">
    <div class="sticker" style="top:0;right:4%;">${icon("award", 24, "var(--brass)")}</div>
    <div class="sticker delay1" style="bottom:10%;left:1%;">${icon("sparkles", 18, "var(--brass)")}</div>
    ${sectionHeading("Generator", "Generate your certificate")}
    <p style="color:var(--slate-light);font-size:14.5px;margin:10px 0 30px;max-width:560px;">
      Enter your full name exactly as it appears on your workshop authorization — capitalization and spacing
      must match the roster exactly.
    </p>
    <div class="grid-auto grid-2-md" style="gap:32px;">
      <div>
        <label style="font-size:13px;color:var(--slate-light);display:block;margin-bottom:8px;">Full name</label>
        <div style="display:flex;gap:8px;">
          <input id="gen-name" class="input" placeholder="Your full name" style="flex:1;" />
          <button id="gen-btn" onclick="handleGenerate()" class="btn-primary">${icon("award", 16)} Generate</button>
        </div>
        <div id="gen-result"></div>
        <div id="gen-actions"></div>
      </div>
      <div id="gen-preview">
        <div class="card" style="height:320px;display:flex;align-items:center;justify-content:center;color:var(--slate);font-size:13.5px;">
          Your certificate preview will render here once authorized.
        </div>
      </div>
    </div>
  </div>`;
}

async function handleGenerate() {
  const nameInput = document.getElementById("gen-name");
  const name = nameInput.value;
  const btn = document.getElementById("gen-btn");
  const resultEl = document.getElementById("gen-result");
  const actionsEl = document.getElementById("gen-actions");
  btn.disabled = true; btn.textContent = "Checking…";
  resultEl.innerHTML = ""; actionsEl.innerHTML = "";

  try {
    const data = await api("/certificates/generate", { method: "POST", body: { full_name: name } });
    generatorResult = data;
    resultEl.innerHTML = `
      <div style="display:flex;align-items:flex-start;gap:8px;margin-top:16px;background:var(--success-bg);border:1px solid var(--success);border-radius:8px;padding:14px;">
        ${icon("check", 16, "var(--success)")}
        <div><p style="font-size:13.5px;color:#B9E3C6;margin-bottom:6px;">Authorized. Certificate issued.</p>
        <p class="font-mono" style="font-size:12px;color:var(--slate);">${data.certificate.certificate_code}</p></div>
      </div>`;
    actionsEl.innerHTML = `
      <div style="display:flex;gap:8px;margin-top:20px;">
        <button onclick="handleDownloadPNG()" class="btn-ghost">${icon("download", 15)} Download high-res PNG</button>
        <button onclick="handleDownloadPDF()" class="btn-ghost">${icon("file", 15)} Export PDF document</button>
      </div>`;

    const previewEl = document.getElementById("gen-preview");
    previewEl.innerHTML = `<div id="printable-cert" style="border:1px solid var(--parchment-line);border-radius:10px;overflow:hidden;"><canvas id="cert-canvas" style="width:100%;height:auto;display:block;"></canvas></div>`;
    const canvas = document.getElementById("cert-canvas");
    const t = data.template || {};
    await drawCertificate(canvas, {
      studentName: data.certificate.student_name,
      courseName: data.certificate.course_name,
      code: data.certificate.certificate_code,
      issueDate: data.certificate.issue_date,
      org: (data.settings || {}).organization_name || "MEDHAPATH",
      signatoryName: (data.settings || {}).signatory_name || "",
      signatoryTitle: (data.settings || {}).signatory_title || "",
      accentColor: t.accent_color || "#8C6C28",
      backgroundImage: t.background_image,
      overlayTextColor: t.overlay_text_color,
      nameFont: t.name_font || "script",
      nameXPercent: t.name_x_percent, nameYPercent: t.name_y_percent,
      dateXPercent: t.date_x_percent, dateYPercent: t.date_y_percent,
      idXPercent: t.id_x_percent, idYPercent: t.id_y_percent,
    });
  } catch (err) {
    resultEl.innerHTML = `
      <div style="display:flex;align-items:flex-start;gap:8px;margin-top:16px;background:var(--danger-bg);border:1px solid var(--danger);border-radius:8px;padding:14px;">
        ${icon("alert", 16, "var(--danger)")}
        <p style="font-size:13.5px;color:#E8B6AF;">${(err.payload && err.payload.message) || err.message}</p>
      </div>`;
  } finally {
    btn.disabled = false; btn.innerHTML = `${icon("award", 16)} Generate`;
  }
}

function handleDownloadPNG() {
  const canvas = document.getElementById("cert-canvas");
  if (canvas && generatorResult) downloadCanvasPNG(canvas, generatorResult.certificate.certificate_code);
}
function handleDownloadPDF() {
  const canvas = document.getElementById("cert-canvas");
  if (canvas && generatorResult) downloadCanvasPDF(canvas, generatorResult.certificate.certificate_code);
}

// =====================================================================
// Verification page
// =====================================================================
async function renderVerification() {
  const prefill = state.verifyPrefill || "";
  const html = `
  <div style="position:relative;flex:1;">
    <div class="sticker" style="top:8%;right:6%;">${icon("badge", 22, "var(--brass)")}</div>
    <div class="sticker delay2" style="bottom:14%;left:4%;">${icon("shield", 18, "var(--brass)")}</div>
    <div style="position:absolute;inset:0;background-image:url(/static/img/logo.png);background-repeat:no-repeat;background-position:center 15%;background-size:340px;opacity:0.05;z-index:0;pointer-events:none;"></div>
    <div class="max-w-3xl" style="padding:50px 20px 100px;position:relative;z-index:1;">
      ${sectionHeading("Verification", "Verify a certificate")}
      <p style="color:var(--slate-light);font-size:14.5px;margin:10px 0 26px;">Enter a certificate ID, e.g. <span class="font-mono" style="color:var(--brass);">MP-06-08-2026-001-VY</span></p>
      <div style="display:flex;gap:8px;">
        <input id="verify-input" class="input font-mono" placeholder="MP-DD-MM-YYYY-XXX-VY" value="${prefill}" onkeydown="if(event.key==='Enter') runVerify();" />
        <button onclick="runVerify()" class="btn-primary">${icon("search", 16)} Verify</button>
      </div>
      <div id="verify-result"></div>
    </div>
  </div>`;
  setTimeout(() => { if (prefill) runVerify(); }, 0);
  return html;
}

async function runVerify() {
  const input = document.getElementById("verify-input");
  const code = (input.value || "").trim();
  if (!code) return;
  const resultEl = document.getElementById("verify-result");
  const data = await api(`/certificates/verify/${encodeURIComponent(code)}`).catch(() => ({ status: "INVALID" }));

  const meta = {
    VALID: { color: "var(--success)", bg: "var(--success-bg)", label: "Verified", icon: "badge" },
    REVOKED: { color: "var(--danger)", bg: "var(--danger-bg)", label: "Revoked", icon: "circlex" },
    INVALID: { color: "#C99A3B", bg: "#332916", label: "Not found", icon: "alert" },
  }[data.status];

  let details = "";
  if (data.certificate) {
    details = `
    <div class="grid-auto grid-2" style="gap:12px;font-size:14px;">
      <div><div style="font-size:12px;color:var(--slate);">Student</div><div>${data.certificate.student_name}</div></div>
      <div><div style="font-size:12px;color:var(--slate);">Course</div><div>${data.certificate.course_name || ""}</div></div>
      <div><div style="font-size:12px;color:var(--slate);">Issued</div><div>${formatLongDate(data.certificate.issue_date)}</div></div>
      <div><div style="font-size:12px;color:var(--slate);">ID</div><div class="font-mono">${data.certificate.certificate_code}</div></div>
    </div>`;
  }
  let note = "";
  if (data.status === "INVALID") note = `<p style="font-size:13.5px;color:#E3CFA0;">This ID was not found in the certificate database.</p>`;
  if (data.status === "REVOKED") note = `<p style="font-size:13px;color:#E8B6AF;margin-top:10px;">This certificate was revoked by the issuing authority and is no longer valid.</p>`;

  resultEl.innerHTML = `
    <div style="margin-top:26px;background:${meta.bg};border:1px solid ${meta.color};border-radius:12px;padding:22px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:${data.certificate ? "16px" : "0"};">
        ${icon(meta.icon, 20, meta.color)}
        <span style="font-weight:600;font-size:16px;color:${meta.color};">${meta.label}</span>
      </div>
      ${details}${note}
    </div>`;
}

// =====================================================================
// Registration page
// =====================================================================
async function renderRegistration() {
  const workshops = await api("/workshops").catch(() => []);
  state.workshops = workshops;
  const cards = workshops.map(w => `
    <div class="card">
      <span class="pill">${w.category || ""}</span>
      <h3 class="font-display" style="font-size:18px;font-weight:600;margin:10px 0 6px;">${w.title}</h3>
      <p style="color:var(--slate-light);font-size:13px;line-height:1.5;min-height:40px;">${w.description || ""}</p>
      <button onclick="openRegisterModal('${w.id}')" class="btn-ghost" style="margin-top:14px;width:100%;justify-content:center;">
        Register ${icon("chevron", 14)}
      </button>
    </div>`).join("");

  return `
  <div class="max-w-5xl" style="padding:50px 20px 90px;">
    ${sectionHeading("Registration", "Register for a workshop")}
    <div class="grid-auto grid-2-3" style="margin-top:26px;">${cards || `<p style="color:var(--slate);">No workshops yet.</p>`}</div>
  </div>
  <div id="register-modal"></div>`;
}

function openRegisterModal(workshopId) {
  const w = state.workshops.find(x => x.id === workshopId);
  if (!w) return;
  if (w.registration_form_url) {
    window.open(w.registration_form_url, "_blank");
    return;
  }
  const modal = document.getElementById("register-modal");
  modal.innerHTML = `
  <div style="position:fixed;inset:0;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;padding:20px;z-index:50;" onclick="if(event.target===this) closeRegisterModal();">
    <div class="card" style="width:100%;max-width:380px;" onclick="event.stopPropagation();">
      <h3 class="font-display" style="font-size:18px;font-weight:600;margin-bottom:4px;">${w.title}</h3>
      <p style="color:var(--slate);font-size:12.5px;margin-bottom:16px;">${w.instructor || ""} · ${w.duration || ""}</p>
      <input id="reg-name" class="input" placeholder="Full name" style="margin-bottom:10px;" />
      <input id="reg-email" class="input" placeholder="Email address" style="margin-bottom:16px;" />
      <div style="display:flex;gap:8px;">
        <button onclick="submitRegistration('${w.id}')" class="btn-primary" style="flex:1;justify-content:center;">Submit</button>
        <button onclick="closeRegisterModal()" class="btn-ghost" style="flex:1;justify-content:center;">Cancel</button>
      </div>
    </div>
  </div>`;
}
function closeRegisterModal() { document.getElementById("register-modal").innerHTML = ""; }

async function submitRegistration(workshopId) {
  const w = state.workshops.find(x => x.id === workshopId);
  const full_name = document.getElementById("reg-name").value;
  const email = document.getElementById("reg-email").value;
  if (!full_name.trim() || !email.trim()) return;
  await api("/registrations", { method: "POST", body: { workshop_id: workshopId, workshop_title: w.title, full_name, email } }).catch(() => null);
  document.getElementById("register-modal").innerHTML = `
  <div style="position:fixed;inset:0;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;padding:20px;z-index:50;">
    <div class="card" style="width:100%;max-width:380px;text-align:center;padding:30px;">
      ${icon("check", 26, "var(--success)")}
      <p style="font-size:15px;margin:10px 0 4px;">You're registered for ${w.title}.</p>
      <button onclick="closeRegisterModal()" class="btn-ghost" style="margin-top:14px;">Close</button>
    </div>
  </div>`;
}

// =====================================================================
// Courses page (public) — content fully controlled by admin
// =====================================================================
async function renderCourses() {
  const courses = await api("/courses").catch(() => []);
  const cards = courses.map(c => `
    <div class="card">
      ${c.category ? `<span class="pill">${c.category}</span>` : ""}
      <h3 class="font-display" style="font-size:18px;font-weight:600;margin:10px 0 6px;">${c.name}</h3>
      <p style="color:var(--slate-light);font-size:13px;line-height:1.5;min-height:40px;">${c.description || ""}</p>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-top:14px;">
        <span style="font-size:12px;color:var(--slate);">${c.provider || ""}</span>
        <a href="${c.link}" target="_blank" rel="noopener" class="btn-ghost" style="padding:8px 14px;font-size:13px;">Go to course ${icon("chevron", 13)}</a>
      </div>
    </div>`).join("");

  return `
  <div class="max-w-6xl" style="padding:50px 20px 90px;position:relative;">
    <div class="sticker" style="top:0;right:5%;">${icon("award", 22, "var(--brass)")}</div>
    ${sectionHeading("Courses", "Explore our courses")}
    <p style="color:var(--slate-light);font-size:14.5px;margin:10px 0 26px;max-width:560px;">
      Each course links out to where you'll actually take it. This list is maintained by MEDHAPATH admins.
    </p>
    <div class="grid-auto grid-2-3">${cards || `<p style="color:var(--slate);">No courses listed yet.</p>`}</div>
  </div>`;
}


function renderAbout() {
  return `
  <div style="position:relative;flex:1;">
    <div style="position:absolute;inset:0;background-image:url(/static/img/logo.png);background-repeat:no-repeat;background-position:center 10%;background-size:380px;opacity:0.05;z-index:0;pointer-events:none;"></div>
    <div class="max-w-3xl" style="padding:50px 20px 90px;position:relative;z-index:1;">
      ${sectionHeading("About", "Verification, not just decoration")}
      <p style="color:var(--slate-light);font-size:15px;line-height:1.75;margin-top:18px;">
        MEDHAPATH exists because a certificate that can't be checked isn't worth much. We issue digital
        certificates for workshops run with our partners, DHARMOVIX Tech and ProAca Academy, and every
        certificate we hand out resolves to a live, checkable record — instantly, and for free.
      </p>
      <div class="grid-auto grid-2" style="margin-top:30px;">
        <div class="card">${icon("building", 18, "var(--brass)")}<p style="margin-top:10px;font-size:13.5px;color:var(--slate-light);">Partnered with DHARMOVIX Tech and ProAca Academy for curriculum and instruction.</p></div>
        <div class="card">${icon("shield", 18, "var(--brass)")}<p style="margin-top:10px;font-size:13.5px;color:var(--slate-light);">Every issued certificate is logged and independently verifiable by ID.</p></div>
      </div>
    </div>
  </div>`;
}

function renderContact() {
  return `
  <div class="max-w-lg" style="padding:50px 20px 90px;">
    ${sectionHeading("Contact", "Get in touch")}
    <div id="contact-body" style="margin-top:24px;">
      <input id="contact-name" class="input" placeholder="Your name" style="margin-bottom:10px;" />
      <input id="contact-email" class="input" placeholder="Email address" style="margin-bottom:10px;" />
      <textarea id="contact-message" class="input" placeholder="How can we help?" rows="4" style="margin-bottom:14px;resize:none;"></textarea>
      <button onclick="submitContact()" class="btn-primary">Send message</button>
    </div>
  </div>`;
}

async function submitContact() {
  const full_name = document.getElementById("contact-name").value;
  const email = document.getElementById("contact-email").value;
  await api("/registrations", { method: "POST", body: { full_name: full_name || "Contact form", email: email || "unknown", workshop_title: "Contact form" } }).catch(() => null);
  document.getElementById("contact-body").innerHTML = `
    <div class="card" style="text-align:center;padding:30px;">
      ${icon("check", 22, "var(--success)")}
      <p style="margin-top:10px;">Message sent. We'll reply soon.</p>
    </div>`;
}

// =====================================================================
// Admin Login
// =====================================================================
let adminLoginMode = "credentials";

function renderAdminLogin() {
  return `
  <div style="position:relative;min-height:calc(100vh - 1px);overflow:hidden;">
    <div style="position:absolute;inset:0;background-image:linear-gradient(rgba(16,21,31,0.88), rgba(16,21,31,0.96)), url(/static/img/admin_bg_lock.jpg);background-size:cover;background-position:center;z-index:0;"></div>
    <div class="max-w-sm" style="padding:70px 20px 100px;position:relative;z-index:1;">
      <button onclick="go('home')" style="background:none;border:none;color:var(--slate);font-size:13px;cursor:pointer;margin-bottom:20px;display:flex;align-items:center;gap:4px;">← Back to site</button>
      <div style="text-align:center;margin-bottom:26px;">
        <img src="/static/img/logo.png" alt="MEDHAPATH logo" style="width:56px;height:56px;object-fit:contain;margin:0 auto 10px;display:block;" />
        <h2 class="font-display" style="font-size:22px;font-weight:600;margin-top:10px;">Admin portal</h2>
        <p style="font-size:13px;color:var(--slate);margin-top:4px;">Sign in with your organization's admin credentials or secret code.</p>
      </div>
      <div class="card">
        <div style="display:flex;gap:8px;margin-bottom:16px;">
          <button id="tab-credentials" onclick="setAdminLoginMode('credentials')" class="${adminLoginMode === 'credentials' ? 'btn-primary' : 'btn-ghost'}" style="flex:1;justify-content:center;padding:8px;">Email + password</button>
          <button id="tab-code" onclick="setAdminLoginMode('code')" class="${adminLoginMode === 'code' ? 'btn-primary' : 'btn-ghost'}" style="flex:1;justify-content:center;padding:8px;">Secret code</button>
        </div>
        <div id="admin-login-fields">${adminLoginFieldsHtml()}</div>
        <div id="admin-login-error"></div>
        <button onclick="submitAdminLogin()" class="btn-primary" style="width:100%;justify-content:center;margin-top:16px;">Sign in</button>
      </div>
    </div>
  </div>`;
}

function adminLoginFieldsHtml() {
  if (adminLoginMode === "credentials") {
    return `<input id="admin-email" class="input" placeholder="Email" />
            <input id="admin-password" class="input" type="password" placeholder="Password" style="margin-top:10px;" />`;
  }
  return `<input id="admin-code" class="input" placeholder="Secret code" />`;
}

function setAdminLoginMode(mode) {
  adminLoginMode = mode;
  document.getElementById("admin-login-fields").innerHTML = adminLoginFieldsHtml();
  document.getElementById("admin-login-error").innerHTML = "";
  const credBtn = document.getElementById("tab-credentials");
  const codeBtn = document.getElementById("tab-code");
  credBtn.className = mode === "credentials" ? "btn-primary" : "btn-ghost";
  codeBtn.className = mode === "code" ? "btn-primary" : "btn-ghost";
}

async function submitAdminLogin() {
  const errorEl = document.getElementById("admin-login-error");
  errorEl.innerHTML = "";
  const body = adminLoginMode === "credentials"
    ? { email: document.getElementById("admin-email").value.trim(), password: document.getElementById("admin-password").value.trim() }
    : { secretCode: document.getElementById("admin-code").value.trim() };
  try {
    await api("/admin/login", { method: "POST", body });
    state.adminAuthed = true;
    go("admin");
  } catch (err) {
    let message;
    if (err.status === 401 || err.status === 400) {
      // Genuine "wrong credentials" — safe to show the friendly message.
      message = (err.payload && err.payload.error) || "Those details don't match our records. Try again.";
    } else if (err.status === 404) {
      message = (err.payload && err.payload.hint)
        || "Login endpoint not found (404). The Flask backend (app.py) doesn't seem to be serving this page — make sure you're running \"python app.py\" and viewing the exact URL it prints, not a static file host.";
    } else {
      // Anything else (500, network failure, unparsable response) is a real
      // bug, not a wrong password — surface it plainly instead of hiding it
      // behind a misleading "wrong credentials" message.
      message = (err.payload && err.payload.error)
        || `Login failed unexpectedly (${err.status || "network error"}). Check the terminal running app.py for details.`;
    }
    errorEl.innerHTML = `<p style="color:var(--danger);font-size:12.5px;margin-top:10px;">${message}</p>`;
  }
}

async function adminLogout() {
  await api("/admin/logout", { method: "POST" }).catch(() => null);
  state.adminAuthed = false;
  go("home");
}

// Dev-only shortcut. The button that calls this only renders at all when
// the backend confirms DEV_MODE=1 is set; the endpoint itself independently
// refuses to work unless that same flag is set server-side. Both checks
// have to agree, and both default to off.
// The footer copyright line is the hidden admin entry point. When the
// server was started with DEV_MODE=1, this skips straight to the admin
// portal (matching devLogin's own independent server-side check). In any
// normal run — including every deployed instance — it falls back to the
// real login form, same as always.
function footerAdminClick() {
  if (state.devMode) {
    devLogin();
  } else {
    go("admin");
  }
}

async function devLogin() {
  try {
    await api("/dev/login", { method: "POST" });
    state.adminAuthed = true;
    go("admin");
  } catch (err) {
    console.warn("Dev login unavailable:", err.message);
  }
}

// =====================================================================
// Admin Portal shell
// =====================================================================
let adminTab = "overview";
const ADMIN_TABS = [
  ["overview", "Overview", "grid"], ["students", "Students", "users"],
  ["templates", "Templates", "file"], ["certificates", "Certificates", "award"],
  ["workshops", "Workshops & showcase", "clipboard"], ["courses", "Courses", "award"],
  ["settings", "Settings", "settings"],
];

async function renderAdminPortal() {
  const tabsHtml = ADMIN_TABS.map(([id, label, ic]) => `
    <button onclick="setAdminTab('${id}')" class="tab-btn ${adminTab === id ? "active" : ""}">${icon(ic, 15)} ${label}</button>
  `).join("");

  const shell = `
  <div style="position:relative;min-height:calc(100vh - 1px);">
    <div style="position:fixed;inset:0;background-image:linear-gradient(rgba(16,21,31,0.93), rgba(16,21,31,0.98)), url(/static/img/admin_bg_corridor.jpg);background-size:cover;background-position:center;z-index:0;"></div>
    <div class="max-w-6xl admin-shell" style="gap:24px;padding:34px 20px 90px;position:relative;z-index:1;">
      <div class="admin-sidebar">
        ${tabsHtml}
        <button onclick="adminLogout()" class="tab-btn" style="color:var(--danger);margin-top:8px;">${icon("logout", 15)} Sign out</button>
      </div>
      <div id="admin-tab-content" style="flex:1;min-width:0;">Loading…</div>
    </div>
  </div>`;

  setTimeout(loadAdminTab, 0);
  return shell;
}

function setAdminTab(id) {
  adminTab = id;
  render();
}

async function loadAdminTab() {
  const el = document.getElementById("admin-tab-content");
  if (!el) return;
  el.innerHTML = "Loading…";
  const renderers = {
    overview: renderAdminOverview, students: renderAdminStudents, templates: renderAdminTemplates,
    certificates: renderAdminCertificates, workshops: renderAdminWorkshops, courses: renderAdminCourses,
    settings: renderAdminSettings,
  };
  el.innerHTML = await renderers[adminTab]();
}

// ---------- Overview ----------
async function renderAdminOverview() {
  const health = await api("/db/health").catch(() => ({ records: {} }));
  const r = health.records || {};
  return `
  <div>
    <h2 class="font-display" style="font-size:22px;font-weight:600;margin-bottom:18px;">Overview</h2>
    <div class="grid-auto grid-2-4">
      <div class="card"><div style="font-size:12.5px;color:var(--slate);">Authorized students</div><div class="font-display" style="font-size:28px;font-weight:600;color:var(--brass);margin-top:6px;">${r.students || 0}</div></div>
      <div class="card"><div style="font-size:12.5px;color:var(--slate);">Certificates issued</div><div class="font-display" style="font-size:28px;font-weight:600;color:var(--brass);margin-top:6px;">${r.certificates || 0}</div></div>
      <div class="card"><div style="font-size:12.5px;color:var(--slate);">Templates</div><div class="font-display" style="font-size:28px;font-weight:600;color:var(--brass);margin-top:6px;">${r.templates || 0}</div></div>
      <div class="card"><div style="font-size:12.5px;color:var(--slate);">Workshops</div><div class="font-display" style="font-size:28px;font-weight:600;color:var(--brass);margin-top:6px;">${r.workshops || 0}</div></div>
    </div>
    <div class="card" style="margin-top:20px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">${icon("check", 15, "var(--success)")}<span style="font-size:13.5px;">Database connection: healthy</span></div>
      <p style="font-size:12.5px;color:var(--slate);">Backed by medhapath.db (SQLite) on disk. Records persist across restarts.</p>
    </div>
  </div>`;
}

// ---------- Students ----------
async function renderAdminStudents() {
  const students = await api("/students").catch(() => []);
  state.students = students;
  return `
  <div>
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;">
      <h2 class="font-display" style="font-size:22px;font-weight:600;">Authorized students</h2>
      <label class="btn-ghost" style="cursor:pointer;">${icon("upload", 14)} Import CSV<input id="csv-input" type="file" accept=".csv" style="display:none;" onchange="handleCsvImport(event)" /></label>
    </div>
    <div class="card" style="margin-bottom:18px;">
      <div class="grid-auto grid-3">
        <input id="student-name" class="input" placeholder="Full name" />
        <input id="student-email" class="input" placeholder="Email" />
        <input id="student-course" class="input" placeholder="Course name" />
      </div>
      <button onclick="addStudent()" class="btn-primary" style="margin-top:10px;">${icon("plus", 14)} Add student</button>
    </div>
    <input id="student-search" class="input" placeholder="Search students" style="max-width:300px;margin-bottom:12px;" oninput="filterStudents()" />
    <div id="student-list" class="admin-list-box">${studentRowsHtml(students)}</div>
  </div>`;
}

function studentRowsHtml(students) {
  if (!students.length) return `<div style="padding:20px;color:var(--slate);font-size:13px;text-align:center;">No students match your search.</div>`;
  return students.map(s => `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid var(--ink-line);">
      <div><div style="font-size:14px;">${s.full_name}</div><div style="font-size:12px;color:var(--slate);">${s.email || ""} · ${s.course_name || ""}</div></div>
      <div style="display:flex;align-items:center;gap:12px;">
        <span style="font-size:11px;padding:3px 9px;border-radius:999px;color:${s.status === "REVOKED" ? "var(--danger)" : "var(--success)"};border:1px solid ${s.status === "REVOKED" ? "var(--danger)" : "var(--success)"};">${s.status}</span>
        <button onclick="toggleStudentRevoke('${s.id}','${s.status}')" style="background:none;border:none;color:var(--slate-light);cursor:pointer;">${icon("shield", 15)}</button>
        <button onclick="removeStudent('${s.id}')" style="background:none;border:none;color:var(--danger);cursor:pointer;">${icon("trash", 15)}</button>
      </div>
    </div>`).join("");
}

function filterStudents() {
  const q = document.getElementById("student-search").value.toLowerCase();
  const filtered = state.students.filter(s => s.full_name.toLowerCase().includes(q));
  document.getElementById("student-list").innerHTML = studentRowsHtml(filtered);
}

async function addStudent() {
  const full_name = document.getElementById("student-name").value;
  const email = document.getElementById("student-email").value;
  const course_name = document.getElementById("student-course").value;
  if (!full_name.trim()) return;
  await api("/students", { method: "POST", body: { full_name, email, course_name } });
  loadAdminTab();
}
async function removeStudent(id) { await api(`/students/${id}`, { method: "DELETE" }); loadAdminTab(); }
async function toggleStudentRevoke(id, status) {
  await api(`/students/${id}`, { method: "PUT", body: { status: status === "REVOKED" ? "AUTHORIZED" : "REVOKED" } });
  loadAdminTab();
}
function handleCsvImport(event) {
  const file = event.target.files[0];
  if (!file) return;
  Papa.parse(file, {
    header: true, skipEmptyLines: true,
    complete: async (res) => {
      await api("/students/bulk", { method: "POST", body: { students: res.data } });
      loadAdminTab();
    },
  });
  event.target.value = "";
}

// ---------- Templates ----------
async function renderAdminTemplates() {
  const templates = await api("/templates").catch(() => []);
  state.templates = templates;
  return `
  <div>
    <h2 class="font-display" style="font-size:22px;font-weight:600;margin-bottom:8px;">Certificate templates</h2>
    <p style="font-size:13px;color:var(--slate-light);margin-bottom:18px;max-width:560px;">
      Upload a certificate design and it becomes the fixed background for every certificate generated on that
      template — only the student's name, issue date, unique ID are overlaid on top when a certificate is generated.
      Use the sliders on an uploaded template to place them exactly where they belong on your design.
    </p>
    <div id="templates-grid" class="grid-auto grid-2-3">${templates.map(templateCardHtml).join("")}</div>
  </div>`;
}

function templateCardHtml(t) {
  const preview = t.background_image ? `
    <div style="margin-bottom:10px;">
      <div style="position:relative;width:100%;aspect-ratio:1400/990;border-radius:8px;overflow:hidden;border:1px solid var(--ink-line);">
        <img src="${t.background_image}" style="width:100%;height:100%;object-fit:cover;display:block;" />
        <div style="position:absolute;left:${t.name_x_percent}%;top:${t.name_y_percent}%;transform:translate(-50%,-50%);font-family:${t.name_font === "serif" ? "'Fraunces',serif" : "'Alex Brush',cursive"};font-size:${t.name_font === "serif" ? 15 : 22}px;color:${t.overlay_text_color || "#26200F"};white-space:nowrap;text-shadow:0 0 4px rgba(255,255,255,.5);">Student Name</div>
        <div style="position:absolute;left:${t.date_x_percent}%;top:${t.date_y_percent}%;transform:translate(-50%,-50%);font-size:6.5px;color:${t.overlay_text_color || "#26200F"};white-space:nowrap;text-shadow:0 0 4px rgba(255,255,255,.5);">Issued on August 6, 2026</div>
        <div style="position:absolute;left:${t.id_x_percent}%;top:${t.id_y_percent}%;transform:translate(-50%,-50%);font-family:'JetBrains Mono',monospace;font-size:6.5px;color:${t.overlay_text_color || "#26200F"};white-space:nowrap;border-bottom:1px solid ${t.accent_color};text-shadow:0 0 4px rgba(255,255,255,.5);">ID: MP-06-08-2026-001-VY</div>
        ${["Name", "name_x_percent", "name_y_percent"].length ? "" : ""}
        ${posMarker("Name", t.name_x_percent, t.name_y_percent)}
        ${posMarker("Date", t.date_x_percent, t.date_y_percent)}
        ${posMarker("ID", t.id_x_percent, t.id_y_percent)}
        <button onclick="clearTemplateBackground('${t.id}')" style="position:absolute;top:6px;right:6px;background:rgba(16,21,31,0.8);border:none;border-radius:6px;padding:4px;cursor:pointer;">${icon("x", 13, "white")}</button>
      </div>
      <div style="font-size:10.5px;color:var(--slate);margin-top:5px;">Live preview — move the sliders below to reposition</div>
    </div>` : `<div style="height:70px;border-radius:8px;background:var(--parchment);border:3px solid ${t.accent_color};margin-bottom:10px;"></div>`;

  const posControls = t.background_image ? `
    <div style="margin-bottom:10px;">
      <div style="font-size:11px;color:var(--slate);margin-bottom:4px;">Name style</div>
      <div style="display:flex;gap:8px;margin-bottom:10px;">
        <button onclick="setTemplateField('${t.id}','name_font','script')" class="${t.name_font !== "serif" ? "btn-primary" : "btn-ghost"}" style="flex:1;justify-content:center;padding:6px;font-size:12px;">Script</button>
        <button onclick="setTemplateField('${t.id}','name_font','serif')" class="${t.name_font === "serif" ? "btn-primary" : "btn-ghost"}" style="flex:1;justify-content:center;padding:6px;font-size:12px;">Serif</button>
      </div>
      ${posControl(t.id, "Name position", "name_x_percent", "name_y_percent", t.name_x_percent, t.name_y_percent)}
      ${posControl(t.id, "Date position", "date_x_percent", "date_y_percent", t.date_x_percent, t.date_y_percent)}
      ${posControl(t.id, "ID position", "id_x_percent", "id_y_percent", t.id_x_percent, t.id_y_percent, true)}
    </div>` : "";

  return `
  <div class="card" style="border:${t.is_active ? "2px solid var(--brass)" : "1px solid var(--ink-line)"};">
    ${preview}
    <div style="font-weight:600;font-size:14px;">${t.name}</div>
    <div style="font-size:12px;color:var(--slate);margin-bottom:10px;">${t.background_image ? "Custom uploaded design" : "Default border"}</div>
    <label class="btn-ghost" style="width:100%;justify-content:center;padding:8px;margin-bottom:10px;cursor:pointer;display:flex;">
      ${icon("upload", 14)} ${t.background_image ? "Replace design" : "Upload design"}
      <input type="file" accept="image/*" style="display:none;" onchange="handleTemplateUpload('${t.id}', event)" />
    </label>
    ${posControls}
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:10px;">
      <div style="display:flex;align-items:center;gap:8px;">
        <input type="color" value="${t.accent_color}" onchange="setTemplateField('${t.id}','accent_color',this.value)" style="width:26px;height:24px;border:none;background:none;cursor:pointer;" />
        <span class="font-mono" style="font-size:10.5px;color:var(--slate);">accent</span>
      </div>
      <div style="display:flex;align-items:center;gap:8px;">
        <input type="color" value="${t.overlay_text_color || "#26200F"}" onchange="setTemplateField('${t.id}','overlay_text_color',this.value)" style="width:26px;height:24px;border:none;background:none;cursor:pointer;" />
        <span class="font-mono" style="font-size:10.5px;color:var(--slate);">text</span>
      </div>
    </div>
    <button onclick="setTemplateActive('${t.id}')" class="${t.is_active ? "btn-primary" : "btn-ghost"}" style="width:100%;justify-content:center;padding:8px;">${t.is_active ? "Active" : "Set active"}</button>
  </div>`;
}

function posMarker(label, x, y) {
  return `<div style="position:absolute;left:${x}%;top:${y}%;transform:translate(-50%,-50%);pointer-events:none;">
    <div style="font-size:8.5px;letter-spacing:.5px;text-transform:uppercase;font-weight:700;color:var(--brass);background:rgba(16,21,31,0.85);padding:1px 4px;border-radius:3px;white-space:nowrap;position:absolute;bottom:100%;left:50%;transform:translateX(-50%);margin-bottom:2px;">${label}</div>
    <div style="width:6px;height:6px;border-radius:50%;background:var(--brass);border:1.5px solid white;margin:0 auto;"></div>
  </div>`;
}

function posControl(templateId, label, xField, yField, x, y, last) {
  return `
  <div style="margin-bottom:${last ? 0 : 12}px;padding-bottom:${last ? 0 : 12}px;border-bottom:${last ? "none" : "1px solid var(--ink-line)"};">
    <div style="font-size:11.5px;color:var(--brass);margin-bottom:6px;font-weight:600;">${label}</div>
    <div style="font-size:10.5px;color:var(--slate);margin-bottom:2px;">Horizontal (${x}%)</div>
    <input type="range" min="0" max="100" value="${x}" style="width:100%;margin-bottom:6px;" oninput="setTemplateFieldLive('${templateId}','${xField}',this.value)" onchange="setTemplateField('${templateId}','${xField}',this.value)" />
    <div style="font-size:10.5px;color:var(--slate);margin-bottom:2px;">Vertical (${y}%)</div>
    <input type="range" min="0" max="100" value="${y}" style="width:100%;" oninput="setTemplateFieldLive('${templateId}','${yField}',this.value)" onchange="setTemplateField('${templateId}','${yField}',this.value)" />
  </div>`;
}

// Update local state + re-render preview instantly while dragging (no API call yet)
function setTemplateFieldLive(id, field, value) {
  const t = state.templates.find(x => x.id === id);
  if (!t) return;
  t[field] = Number(value);
  const grid = document.getElementById("templates-grid");
  if (grid) grid.innerHTML = state.templates.map(templateCardHtml).join("");
}

async function setTemplateField(id, field, value) {
  const isNumeric = field.includes("percent");
  const body = { [field]: isNumeric ? Number(value) : value };
  await api(`/templates/${id}`, { method: "PUT", body });
  loadAdminTab();
}
async function setTemplateActive(id) {
  await api(`/templates/${id}`, { method: "PUT", body: { is_active: true } });
  loadAdminTab();
}
function clearTemplateBackground(id) { setTemplateField(id, "background_image", null); }
function handleTemplateUpload(id, event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => setTemplateField(id, "background_image", reader.result);
  reader.readAsDataURL(file);
}

// ---------- Certificates ----------
async function renderAdminCertificates() {
  const certs = await api("/certificates").catch(() => []);
  if (!certs.length) {
    return `<div><h2 class="font-display" style="font-size:22px;font-weight:600;margin-bottom:18px;">Issued certificates</h2>
      <div class="admin-list-box"><div style="padding:20px;color:var(--slate);font-size:13px;text-align:center;">No certificates issued yet.</div></div></div>`;
  }
  const rows = certs.map(c => `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid var(--ink-line);">
      <div><div style="font-size:14px;">${c.student_name} <span style="color:var(--slate);font-size:12px;">· ${c.course_name || ""}</span></div>
      <div class="font-mono" style="font-size:11.5px;color:var(--slate);">${c.certificate_code}</div></div>
      <div style="display:flex;align-items:center;gap:12px;">
        <span style="font-size:11px;padding:3px 9px;border-radius:999px;color:${c.status === "VALID" ? "var(--success)" : "var(--danger)"};border:1px solid ${c.status === "VALID" ? "var(--success)" : "var(--danger)"};">${c.status}</span>
        <button onclick="toggleCertStatus('${c.certificate_code}','${c.status}')" class="btn-ghost">${c.status === "VALID" ? "Revoke" : "Reinstate"}</button>
      </div>
    </div>`).join("");
  return `<div><h2 class="font-display" style="font-size:22px;font-weight:600;margin-bottom:18px;">Issued certificates</h2><div class="admin-list-box">${rows}</div></div>`;
}
async function toggleCertStatus(code, status) {
  await api(`/certificates/${encodeURIComponent(code)}/status`, { method: "POST", body: { status: status === "VALID" ? "REVOKED" : "VALID" } });
  loadAdminTab();
}

// ---------- Workshops & Showcase ----------
async function renderAdminWorkshops() {
  const [workshops, showcase] = await Promise.all([api("/workshops").catch(() => []), api("/showcase").catch(() => [])]);
  const workshopRows = workshops.map(x => `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid var(--ink-line);">
      <div><div style="font-size:14px;">${x.title}</div><div style="font-size:12px;color:var(--slate);">${x.instructor || ""} · ${x.duration || ""}${x.registration_form_url ? " · has registration link" : ""}</div></div>
      <button onclick="removeWorkshop('${x.id}')" style="background:none;border:none;color:var(--danger);cursor:pointer;">${icon("trash", 15)}</button>
    </div>`).join("");
  const showcaseRows = showcase.map(s => `
    <div style="padding:12px 16px;border-bottom:1px solid var(--ink-line);">
      <div style="font-size:14px;">${s.student_name}</div><div style="font-size:12px;color:var(--slate);">${s.workshop_title || ""}</div>
    </div>`).join("");

  return `
  <div>
    <h2 class="font-display" style="font-size:22px;font-weight:600;margin-bottom:18px;">Workshops & showcase</h2>
    <div class="card" style="margin-bottom:18px;">
      <div class="grid-auto grid-4">
        <input id="w-title" class="input" placeholder="Title" />
        <input id="w-category" class="input" placeholder="Category" />
        <input id="w-instructor" class="input" placeholder="Instructor" />
        <input id="w-duration" class="input" placeholder="Duration" />
      </div>
      <input id="w-reg-url" class="input" placeholder="Registration form link (optional — e.g. a Google Form URL)" style="margin-top:8px;" />
      <p style="font-size:11.5px;color:var(--slate);margin-top:6px;">If left blank, students register through the built-in form on the Registration page instead.</p>
      <button onclick="addWorkshop()" class="btn-primary" style="margin-top:10px;">${icon("plus", 14)} Add workshop</button>
    </div>
    <div class="admin-list-box" style="margin-bottom:24px;">${workshopRows || `<div style="padding:20px;color:var(--slate);font-size:13px;text-align:center;">No workshops yet.</div>`}</div>
    <h3 style="font-weight:600;font-size:15px;margin-bottom:10px;">Showcase profiles</h3>
    <div class="admin-list-box">${showcaseRows || `<div style="padding:20px;color:var(--slate);font-size:13px;text-align:center;">No showcase profiles yet.</div>`}</div>
  </div>`;
}
async function addWorkshop() {
  const title = document.getElementById("w-title").value;
  if (!title.trim()) return;
  const body = {
    title,
    category: document.getElementById("w-category").value,
    instructor: document.getElementById("w-instructor").value,
    duration: document.getElementById("w-duration").value,
    registration_form_url: document.getElementById("w-reg-url").value,
  };
  await api("/workshops", { method: "POST", body });
  loadAdminTab();
}
async function removeWorkshop(id) { await api(`/workshops/${id}`, { method: "DELETE" }); loadAdminTab(); }

// ---------- Courses ----------
async function renderAdminCourses() {
  const courses = await api("/courses").catch(() => []);
  const rows = courses.map(c => `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid var(--ink-line);">
      <div>
        <div style="font-size:14px;">${c.name} ${c.category ? `<span style="color:var(--slate);font-size:12px;">· ${c.category}</span>` : ""}</div>
        <div style="font-size:12px;color:var(--slate);">${c.provider || ""} · <a href="${c.link}" target="_blank" rel="noopener" style="color:var(--brass);">${c.link}</a></div>
      </div>
      <button onclick="removeCourse('${c.id}')" style="background:none;border:none;color:var(--danger);cursor:pointer;">${icon("trash", 15)}</button>
    </div>`).join("");

  return `
  <div>
    <h2 class="font-display" style="font-size:22px;font-weight:600;margin-bottom:8px;">Courses</h2>
    <p style="font-size:13px;color:var(--slate-light);margin-bottom:18px;max-width:560px;">
      These are the courses shown on the public Courses page. Each one links out to wherever students actually take it.
    </p>
    <div class="card" style="margin-bottom:18px;">
      <div class="grid-auto grid-3">
        <input id="course-name" class="input" placeholder="Course name" />
        <input id="course-category" class="input" placeholder="Category" />
        <input id="course-provider" class="input" placeholder="Provider" />
      </div>
      <input id="course-link" class="input" placeholder="Course link (URL students go to)" style="margin-top:8px;" />
      <textarea id="course-description" class="input" placeholder="Short description" rows="2" style="margin-top:8px;resize:none;"></textarea>
      <button onclick="addCourse()" class="btn-primary" style="margin-top:10px;">${icon("plus", 14)} Add course</button>
    </div>
    <div class="admin-list-box">${rows || `<div style="padding:20px;color:var(--slate);font-size:13px;text-align:center;">No courses yet.</div>`}</div>
  </div>`;
}
async function addCourse() {
  const name = document.getElementById("course-name").value;
  const link = document.getElementById("course-link").value;
  if (!name.trim() || !link.trim()) return;
  const body = {
    name, link,
    category: document.getElementById("course-category").value,
    provider: document.getElementById("course-provider").value,
    description: document.getElementById("course-description").value,
  };
  await api("/courses", { method: "POST", body });
  loadAdminTab();
}
async function removeCourse(id) { await api(`/courses/${id}`, { method: "DELETE" }); loadAdminTab(); }

// ---------- Settings ----------
async function renderAdminSettings() {
  const settings = await api("/settings").catch(() => ({}));
  return `
  <div>
    <h2 class="font-display" style="font-size:22px;font-weight:600;margin-bottom:18px;">Organization settings</h2>
    <div class="card" style="max-width:480px;">
      <label style="font-size:12.5px;color:var(--slate);display:block;margin-bottom:6px;">Organization name</label>
      <input id="set-org" class="input" value="${settings.organization_name || ""}" style="margin-bottom:12px;" />
      <label style="font-size:12.5px;color:var(--slate);display:block;margin-bottom:6px;">Signatory name</label>
      <input id="set-sig-name" class="input" value="${settings.signatory_name || ""}" style="margin-bottom:12px;" />
      <label style="font-size:12.5px;color:var(--slate);display:block;margin-bottom:6px;">Signatory title</label>
      <input id="set-sig-title" class="input" value="${settings.signatory_title || ""}" style="margin-bottom:16px;" />
      <button onclick="saveSettings()" class="btn-primary">Save changes</button>
      <div id="settings-saved"></div>
    </div>
    <div class="card" style="max-width:480px;margin-top:20px;">
      <div style="font-size:14px;font-weight:600;margin-bottom:6px;">Reset database</div>
      <p style="font-size:12.5px;color:var(--slate);margin-bottom:12px;">Wipes all data and reseeds the demo roster, templates and workshops.</p>
      <button onclick="resetAllData()" style="border:1px solid var(--danger);color:var(--danger);background:none;font-size:14px;padding:8px 16px;border-radius:8px;cursor:pointer;">Reset all data</button>
      <div id="reset-msg"></div>
    </div>
  </div>`;
}
async function saveSettings() {
  const body = {
    organization_name: document.getElementById("set-org").value,
    signatory_name: document.getElementById("set-sig-name").value,
    signatory_title: document.getElementById("set-sig-title").value,
  };
  await api("/settings", { method: "PUT", body });
  document.getElementById("settings-saved").innerHTML = `<p style="color:var(--success);font-size:12.5px;margin-top:10px;">Saved.</p>`;
}
async function resetAllData() {
  if (!confirm("This clears all students, certificates, workshops and registrations back to seed data. Continue?")) return;
  await api("/admin/reset-data", { method: "POST" });
  document.getElementById("reset-msg").innerHTML = `<p style="color:var(--success);font-size:12.5px;margin-top:10px;">Database reset to seed data.</p>`;
}

// =====================================================================
// Main render dispatcher
// =====================================================================
async function render() {
  const app = document.getElementById("app");
  const isAdmin = state.page === "admin";

  let bodyHtml = `<div style="flex:1;display:flex;align-items:center;justify-content:center;color:var(--slate);">Loading…</div>`;
  app.innerHTML = `
    ${!isAdmin ? renderNavbar() : ""}
    <div id="page-body" style="flex:1;display:flex;flex-direction:column;">${bodyHtml}</div>
    ${!isAdmin ? renderFooter() : ""}
  `;

  const pageBody = document.getElementById("page-body");
  let html = "";
  try {
    switch (state.page) {
      case "home": html = await renderHome(); break;
      case "generator": html = await renderGenerator(); break;
      case "verification": html = await renderVerification(); break;
      case "courses": html = await renderCourses(); break;
      case "registration": html = await renderRegistration(); break;
      case "about": html = renderAbout(); break;
      case "contact": html = renderContact(); break;
      case "admin":
        if (state.adminAuthed) {
          html = await renderAdminPortal();
        } else {
          html = renderAdminLogin();
        }
        break;
      default: html = renderAbout();
    }
  } catch (e) {
    html = `<div class="max-w-3xl" style="padding:60px 20px;text-align:center;color:var(--slate);">Something went wrong loading this page. ${e.message || ""}</div>`;
  }
  pageBody.innerHTML = html;
}

// =====================================================================
// Init
// =====================================================================
// ---------------------------------------------------------------------
// Backend health check — runs before anything else. If this fails, the
// Python/Flask server isn't actually the thing serving this page (e.g.
// it's being opened as a static file, or hosted by a static-only server
// with no backend at all). Show one clear diagnostic page instead of
// letting the rest of the app fail confusingly one click at a time.
// ---------------------------------------------------------------------
async function checkBackendHealth() {
  try {
    const res = await fetch("/api/stats", { credentials: "same-origin" });
    const text = await res.text();
    try {
      JSON.parse(text);
      return true; // got real JSON back — Flask is serving this
    } catch (e) {
      return false; // got a response, but not JSON — not our Flask app
    }
  } catch (e) {
    return false; // fetch itself failed — no server reachable at all
  }
}

function renderBackendMissingPage() {
  const app = document.getElementById("app");
  const splash = document.getElementById("splash-screen");
  if (splash) splash.remove();
  const isFileProtocol = window.location.protocol === "file:";
  app.innerHTML = `
  <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;">
    <div class="card" style="max-width:560px;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
        ${icon("alert", 22, "var(--danger)")}
        <h1 class="font-display" style="font-size:20px;font-weight:600;">Python backend not detected</h1>
      </div>
      <p style="color:var(--slate-light);font-size:14px;line-height:1.6;margin-bottom:14px;">
        This page loaded, but <span class="font-mono" style="color:var(--brass);">/api/stats</span> did not return
        real data from Flask. That means something other than <span class="font-mono" style="color:var(--brass);">app.py</span>
        is serving these files${isFileProtocol ? " — right now you're opening this directly from your file system (the address bar starts with file://), which never runs Python at all." : ", most likely a static file host with no Python behind it."}
      </p>
      <div style="background:var(--ink);border:1px solid var(--ink-line);border-radius:8px;padding:14px;margin-bottom:14px;">
        <div style="font-size:12px;color:var(--slate);margin-bottom:8px;">To fix this, open a terminal in the project folder and run:</div>
        <div class="font-mono" style="font-size:13px;color:var(--white);margin-bottom:6px;">pip install -r requirements.txt</div>
        <div class="font-mono" style="font-size:13px;color:var(--white);">python app.py</div>
      </div>
      <p style="color:var(--slate-light);font-size:13.5px;line-height:1.6;margin-bottom:14px;">
        Then open the <strong>exact URL the terminal prints</strong> (something like
        <span class="font-mono" style="color:var(--brass);">http://localhost:5000</span>) — not this one, and not by
        double-clicking <span class="font-mono">index.html</span>.
      </p>
      <button onclick="window.location.reload()" class="btn-primary">Retry now</button>
    </div>
  </div>`;
}


async function init() {
  parseHashVerify();
  const healthy = await checkBackendHealth();
  if (!healthy) {
    renderBackendMissingPage();
    return;
  }
  const splashTimer = new Promise(resolve => setTimeout(resolve, 3000));
  try {
    const me = await api("/admin/me");
    state.adminAuthed = !!me.authenticated;
  } catch (e) { /* ignore */ }
  try {
    const dev = await api("/dev/status");
    state.devMode = !!dev.dev_mode;
  } catch (e) { state.devMode = false; }
  await render();
  await splashTimer;
  const splash = document.getElementById("splash-screen");
  if (splash) {
    splash.classList.add("hide");
    setTimeout(() => splash.remove(), 800);
  }
}

window.addEventListener("hashchange", () => {
  parseHashVerify();
  render();
});

init();
