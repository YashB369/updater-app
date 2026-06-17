import { useState, useEffect, useRef } from "react";

// ─── Design Tokens ───────────────────────────────────────────────────────────
// Deep academic indigo + warm amber accent + clean off-white
// Signature: animated shimmer on cards on first load
const C = {
  bg: "#F5F7FF",
  surface: "#FFFFFF",
  card: "#FFFFFF",
  border: "#E0E4F0",
  accent: "#4C6EF5",
  accentDim: "#3D4F99",
  amber: "#F59F00",
  amberDim: "#7A521A",
  text: "#1A1D27",
  muted: "#6B7280",
  danger: "#FF5252",
  success: "#4CAF7D",
  white: "#FFFFFF",
};

// ─── Utility ──────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 10);
const fmtDate = (d) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

// ─── Persisted Store (localStorage simulation via state) ──────────────────────
const STORE_KEY = "updater_v1";
const loadStore = () => {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};
const saveStore = (s) => {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(s)); } catch {}
};

const defaultStore = () => ({
  users: {},         // { email: { password, role, profile } }
  sessions: {},      // { email: token }
  lectures: [],      // [{ id, date, title, subject, description, fileUrl, fileName, fileType, createdAt }]
  notices: [],       // [{ id, date, subject, description, createdAt }]
});

// ─── Icons (inline SVG) ───────────────────────────────────────────────────────
const Icon = ({ name, size = 20, color = C.text }) => {
  const paths = {
    menu: "M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z",
    user: "M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z",
    book: "M21 5c-1.1-.4-2.3-.5-3.5-.5-1.9 0-4.1.4-5.5 1.5C10.6 4.9 8.4 4.5 6.5 4.5c-1.2 0-2.4.1-3.5.5v14.2c1.1-.4 2.3-.5 3.5-.5 1.9 0 4.1.4 5.5 1.5 1.4-1.1 3.6-1.5 5.5-1.5 1.2 0 2.4.1 3.5.5V5zm-2 12.5c-.9-.3-1.6-.4-2.5-.5-1.3 0-2.9.3-4 .8V7.5c1.1-.5 2.7-.8 4-.8.9 0 1.6.1 2.5.4v10.4z",
    bell: "M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.1-1.6-5.6-4.5-6.3V4c0-.8-.7-1.5-1.5-1.5S10.5 3.2 10.5 4v.7C7.6 5.4 6 7.9 6 11v5l-2 2v1h16v-1l-2-2z",
    info: "M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z",
    logout: "M17 7l-1.4 1.4 2.6 2.6H8v2h10.2l-2.6 2.6L17 17l5-5-5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z",
    send: "M2 21l21-9L2 3v7l15 2-15 2v7z",
    download: "M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z",
    upload: "M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z",
    close: "M19 6.4L17.6 5 12 10.6 6.4 5 5 6.4 10.6 12 5 17.6 6.4 19 12 13.4 17.6 19 19 17.6 13.4 12z",
    check: "M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z",
    plus: "M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z",
    pdf: "M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .8-.7 1.5-1.5 1.5H9v2H7.5V7H10c.8 0 1.5.7 1.5 1.5v1zm5 2c0 .8-.7 1.5-1.5 1.5h-2.5V7H15c.8 0 1.5.7 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5zM9 9.5h1v-1H9v1zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm10 5.5h1v-3h-1v3z",
    image: "M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z",
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={{ flexShrink: 0 }}>
      <path d={paths[name] || paths.info} />
    </svg>
  );
};

// ─── Components ───────────────────────────────────────────────────────────────
const Btn = ({ children, onClick, variant = "primary", disabled, full, small, icon }) => {
  const bg = variant === "primary" ? C.accent : variant === "danger" ? C.danger : variant === "amber" ? C.amber : "transparent";
  const col = variant === "ghost" ? C.muted : variant === "amber" ? C.bg : C.white;
  const border = variant === "ghost" ? `1px solid ${C.border}` : "none";
  return (
    <button onClick={onClick} disabled={disabled} style={{
      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
      background: disabled ? C.border : bg, color: disabled ? C.muted : col,
      border, borderRadius: 10, padding: small ? "8px 14px" : "12px 20px",
      fontSize: small ? 13 : 14, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer",
      width: full ? "100%" : "auto", transition: "opacity .15s", opacity: disabled ? .6 : 1,
      fontFamily: "inherit", letterSpacing: ".3px",
    }}>
      {icon && <Icon name={icon} size={16} color={col} />}
      {children}
    </button>
  );
};

const Input = ({ label, value, onChange, type = "text", placeholder, required }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
    {label && <label style={{ color: C.muted, fontSize: 12, fontWeight: 600, letterSpacing: ".8px", textTransform: "uppercase" }}>{label}{required && " *"}</label>}
    <input
      type={type} value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10,
        padding: "11px 14px", color: C.text, fontSize: 14, fontFamily: "inherit", outline: "none",
        transition: "border-color .15s",
      }}
      onFocus={e => e.target.style.borderColor = C.accent}
      onBlur={e => e.target.style.borderColor = C.border}
    />
  </div>
);

const TextArea = ({ label, value, onChange, placeholder, rows = 4 }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
    {label && <label style={{ color: C.muted, fontSize: 12, fontWeight: 600, letterSpacing: ".8px", textTransform: "uppercase" }}>{label}</label>}
    <textarea
      value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
      style={{
        background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10,
        padding: "11px 14px", color: C.text, fontSize: 14, fontFamily: "inherit", outline: "none",
        resize: "vertical", transition: "border-color .15s",
      }}
      onFocus={e => e.target.style.borderColor = C.accent}
      onBlur={e => e.target.style.borderColor = C.border}
    />
  </div>
);

const Toast = ({ msg, type, onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, []);
  const bg = type === "error" ? C.danger : C.success;
  return (
    <div style={{
      position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
      background: bg, color: C.white, borderRadius: 12, padding: "12px 20px",
      fontSize: 14, fontWeight: 600, zIndex: 9999, boxShadow: "0 4px 20px rgba(0,0,0,.4)",
      display: "flex", alignItems: "center", gap: 10, maxWidth: 340,
    }}>
      <Icon name={type === "error" ? "close" : "check"} size={16} color={C.white} />
      {msg}
    </div>
  );
};

// ─── Dropdown Menu ─────────────────────────────────────────────────────────────
const MenuDropdown = ({ session, onNavigate, onLogout }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const items = [
    { label: "Profile", icon: "user", page: "profile" },
    { label: "Lectures", icon: "book", page: "lectures" },
    { label: "Notices", icon: "bell", page: "notices" },
    { label: "About", icon: "info", page: "about" },
  ];

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen(o => !o)} style={{
        background: "none", border: "none", cursor: "pointer",
        display: "flex", flexDirection: "column", gap: 4, padding: 6,
      }}>
        {[0,1,2].map(i => <span key={i} style={{ width: 4, height: 4, borderRadius: "50%", background: C.text, display: "block" }} />)}
      </button>
      {open && (
        <div style={{
          position: "absolute", right: 0, top: "calc(100% + 8px)",
          background: C.card, border: `1px solid ${C.border}`, borderRadius: 14,
          minWidth: 180, zIndex: 1000, overflow: "hidden",
          boxShadow: "0 8px 32px rgba(0,0,0,.5)",
        }}>
          {items.map(item => (
            <button key={item.page} onClick={() => { onNavigate(item.page); setOpen(false); }} style={{
              display: "flex", alignItems: "center", gap: 12, width: "100%",
              padding: "12px 16px", background: "none", border: "none",
              color: C.text, fontSize: 14, cursor: "pointer", textAlign: "left",
              transition: "background .1s",
            }}
              onMouseEnter={e => e.currentTarget.style.background = C.surface}
              onMouseLeave={e => e.currentTarget.style.background = "none"}
            >
              <Icon name={item.icon} size={18} color={C.accent} />
              {item.label}
            </button>
          ))}
          <div style={{ height: 1, background: C.border }} />
          <button onClick={() => { onLogout(); setOpen(false); }} style={{
            display: "flex", alignItems: "center", gap: 12, width: "100%",
            padding: "12px 16px", background: "none", border: "none",
            color: C.danger, fontSize: 14, cursor: "pointer", textAlign: "left",
          }}
            onMouseEnter={e => e.currentTarget.style.background = C.surface}
            onMouseLeave={e => e.currentTarget.style.background = "none"}
          >
            <Icon name="logout" size={18} color={C.danger} />
            Log Out
          </button>
        </div>
      )}
    </div>
  );
};

// ─── App Header ────────────────────────────────────────────────────────────────
const Header = ({ session, page, onNavigate, onLogout }) => (
  <div style={{
    background: C.surface, borderBottom: `1px solid ${C.border}`,
    padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between",
    position: "sticky", top: 0, zIndex: 100,
  }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8, background: C.accent,
        display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 16, color: C.white,
      }}>U</div>
      <div>
        <div style={{ fontWeight: 700, fontSize: 15, color: C.text, lineHeight: 1 }}>Updater</div>
        {session && <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>
          {session.role === "owner" ? "Owner" : session.profile?.name || session.email}
        </div>}
      </div>
    </div>
    {session && <MenuDropdown session={session} onNavigate={onNavigate} onLogout={onLogout} />}
  </div>
);

// ─── Auth Screen ───────────────────────────────────────────────────────────────
const AuthScreen = ({ store, onAuth, setToast }) => {
  const [mode, setMode] = useState("login"); // login | signup | owner
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);

  const OWNER_EMAIL = "yashbhagat324@gmail.com";
  const OWNER_PIN = "369752";

  const handleSubmit = () => {
    if (!email) { setToast({ msg: "Fill all fields", type: "error" }); return; }
if (mode !== "owner" && !password) { setToast({ msg: "Fill all fields", type: "error" }); return; }
if (mode === "owner" && !pin) { setToast({ msg: "Fill all fields", type: "error" }); return; }
    setLoading(true);
    setTimeout(() => {
     if (mode === "owner") {
  const trimmedEmail = email.trim();
  const trimmedPin = pin.trim();
  if (trimmedEmail !== OWNER_EMAIL || trimmedPin !== OWNER_PIN) {
    setToast({ msg: "Invalid owner credentials", type: "error" }); 
    setLoading(false); 
    return;
  }
  onAuth({ email: trimmedEmail, role: "owner", profile: { name: "Owner" } });

      } else if (mode === "signup") {
        if (store.users[email]) { setToast({ msg: "Email already registered", type: "error" }); setLoading(false); return; }
        if (password.length < 6) { setToast({ msg: "Password min 6 chars", type: "error" }); setLoading(false); return; }
        onAuth({ email, role: "user", isNew: true }, { email, password, role: "user", profile: null });
      } else {
        const u = store.users[email];
        if (!u || u.password !== password) { setToast({ msg: "Invalid credentials", type: "error" }); setLoading(false); return; }
        onAuth({ email, role: u.role, profile: u.profile });
      }
      setLoading(false);
    }, 400);
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18, background: `linear-gradient(135deg, ${C.accent}, ${C.accentDim})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px", fontSize: 28, fontWeight: 900, color: C.white,
            boxShadow: `0 8px 24px ${C.accentDim}`,
          }}>U</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: C.text, letterSpacing: "-.5px" }}>Updater</div>
          <div style={{ color: C.muted, fontSize: 14, marginTop: 4 }}>One-way. Reliable. Instant.</div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", background: C.surface, borderRadius: 12, padding: 4, marginBottom: 24, border: `1px solid ${C.border}` }}>
          {[["login", "Login"], ["signup", "Sign Up"], ["owner", "Owner"]].map(([v, l]) => (
            <button key={v} onClick={() => setMode(v)} style={{
              flex: 1, padding: "9px 0", borderRadius: 9, border: "none", cursor: "pointer",
              background: mode === v ? C.accent : "transparent",
              color: mode === v ? C.white : C.muted, fontWeight: 600, fontSize: 13, fontFamily: "inherit",
              transition: "all .15s",
            }}>{l}</button>
          ))}
        </div>

        {/* Form */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Input label="Email" value={email} onChange={setEmail} type="email" placeholder="you@example.com" required />
          {mode !== "owner" && (
            <Input label="Password" value={password} onChange={setPassword} type="password" placeholder="••••••••" required />
          )}
          {mode === "owner" && (
            <Input label="6-Digit Pincode" value={pin} onChange={v => setPin(v.slice(0,6))} type="password" placeholder="••••••" required />
          )}
          <Btn onClick={handleSubmit} disabled={loading} full>
            {loading ? "Please wait…" : mode === "login" ? "Login" : mode === "signup" ? "Create Account" : "Access Owner Panel"}
          </Btn>
        </div>

        {mode === "owner" && (
          <div style={{ marginTop: 16, padding: 12, background: C.amberDim + "33", border: `1px solid ${C.amberDim}`, borderRadius: 10, fontSize: 12, color: C.amber }}>
            Owner access is restricted. Only authorised credentials are accepted.
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Profile Setup Screen ──────────────────────────────────────────────────────
const ProfileSetup = ({ session, onComplete, setToast }) => {
  const [name, setName] = useState("");
  const [roll, setRoll] = useState("");
  const [avatar, setAvatar] = useState(null);
  const fileRef = useRef(null);

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = (ev) => setAvatar(ev.target.result);
    r.readAsDataURL(f);
  };

  const handleSubmit = () => {
    if (!name.trim()) { setToast({ msg: "Name is required", type: "error" }); return; }
    if (!roll.trim() || isNaN(Number(roll))) { setToast({ msg: "Valid roll number required", type: "error" }); return; }
    if (!avatar) { setToast({ msg: "Please upload a profile picture", type: "error" }); return; }
    onComplete({ name: name.trim(), rollNumber: roll.trim(), avatar });
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: C.text }}>Complete Your Profile</div>
          <div style={{ color: C.muted, fontSize: 14, marginTop: 4 }}>Required before you can continue</div>
        </div>

        {/* Avatar */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div
            onClick={() => fileRef.current?.click()}
            style={{
              width: 90, height: 90, borderRadius: "50%", margin: "0 auto 10px",
              background: avatar ? "none" : C.surface, border: `2px dashed ${avatar ? C.accent : C.border}`,
              display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
              overflow: "hidden", transition: "border-color .15s",
            }}
          >
            {avatar ? <img src={avatar} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Icon name="upload" size={28} color={C.muted} />}
          </div>
          <div style={{ fontSize: 12, color: C.muted }}>Tap to upload photo</div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Input label="Full Name" value={name} onChange={setName} placeholder="Yash Bhagat" required />
          <Input label="Roll Number" value={roll} onChange={setRoll} type="number" placeholder="2024001" required />
          <Btn onClick={handleSubmit} full>Save & Continue</Btn>
        </div>
      </div>
    </div>
  );
};

// ─── Lecture Card ──────────────────────────────────────────────────────────────
const LectureCard = ({ lec, isOwner }) => {
  const [expanded, setExpanded] = useState(false);
  const isImage = lec.fileType?.startsWith("image/");

  const handleDownload = () => {
    if (!lec.fileUrl) return;
    const a = document.createElement("a");
    a.href = lec.fileUrl;
    a.download = lec.fileName || "attachment";
    a.click();
  };

  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden",
      marginBottom: 14, transition: "transform .15s",
    }}
      onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
      onMouseLeave={e => e.currentTarget.style.transform = "none"}
    >
      {/* Header stripe */}
      <div style={{ background: `linear-gradient(90deg, ${C.accentDim}44, transparent)`, padding: "14px 16px", borderBottom: `1px solid ${C.border}40`, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 11, color: C.accent, fontWeight: 700, letterSpacing: ".8px", textTransform: "uppercase", marginBottom: 4 }}>
            {lec.subject}
          </div>
          <div style={{ fontSize: 17, fontWeight: 700, color: C.text }}>{lec.title}</div>
        </div>
        <div style={{ fontSize: 12, color: C.muted, whiteSpace: "nowrap", marginLeft: 12 }}>{fmtDate(lec.date)}</div>
      </div>

      {/* Body */}
      <div style={{ padding: "12px 16px" }}>
        <div style={{ color: C.muted, fontSize: 13.5, lineHeight: 1.6 }}>
          {expanded || lec.description.length < 120 ? lec.description : lec.description.slice(0, 120) + "…"}
        </div>
        {lec.description.length >= 120 && (
          <button onClick={() => setExpanded(e => !e)} style={{ background: "none", border: "none", color: C.accent, fontSize: 12, cursor: "pointer", padding: "4px 0", fontFamily: "inherit" }}>
            {expanded ? "Show less" : "Read more"}
          </button>
        )}

        {/* Attachment */}
        {lec.fileUrl && (
          <div style={{ marginTop: 12, background: C.surface, borderRadius: 10, padding: "10px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", border: `1px solid ${C.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Icon name={isImage ? "image" : "pdf"} size={20} color={C.amber} />
              <div>
                <div style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{lec.fileName}</div>
                <div style={{ fontSize: 11, color: C.muted }}>{isImage ? "Image" : "PDF"} attachment</div>
              </div>
            </div>
            {!isOwner && <Btn onClick={handleDownload} variant="amber" small icon="download">Download</Btn>}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Notice Card ───────────────────────────────────────────────────────────────
const NoticeCard = ({ notice }) => (
  <div style={{
    background: C.card, border: `1px solid ${C.border}`, borderLeft: `4px solid ${C.amber}`,
    borderRadius: 14, padding: "14px 16px", marginBottom: 12,
    transition: "transform .15s",
  }}
    onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
    onMouseLeave={e => e.currentTarget.style.transform = "none"}
  >
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{notice.subject}</div>
      <div style={{ fontSize: 12, color: C.muted, whiteSpace: "nowrap", marginLeft: 12 }}>{fmtDate(notice.date)}</div>
    </div>
    <div style={{ fontSize: 13.5, color: C.muted, lineHeight: 1.6 }}>{notice.description}</div>
  </div>
);

// ─── Lectures Screen ───────────────────────────────────────────────────────────
const LecturesScreen = ({ session, store, onUpdate, setToast }) => {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [desc, setDesc] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef(null);

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = (ev) => setFile({ url: ev.target.result, name: f.name, type: f.type });
    r.readAsDataURL(f);
  };

  const handleSend = () => {
    if (!title || !subject || !desc) { setToast({ msg: "Fill all required fields", type: "error" }); return; }
    setLoading(true);
    setTimeout(() => {
      const newLec = { id: uid(), date, title, subject, description: desc, fileUrl: file?.url || null, fileName: file?.name || null, fileType: file?.type || null, createdAt: Date.now() };
      onUpdate(s => { s.lectures = [newLec, ...s.lectures]; });
      setTitle(""); setSubject(""); setDesc(""); setFile(null);
      setToast({ msg: "Lecture published!", type: "success" });
      setLoading(false);
    }, 400);
  };

  return (
    <div style={{ padding: "20px 16px", maxWidth: 600, margin: "0 auto" }}>
      {session.role === "owner" && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "18px 16px", marginBottom: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <Icon name="plus" size={18} color={C.accent} /> New Lecture
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Input label="Date *" value={date} onChange={setDate} type="date" />
            <Input label="Title *" value={title} onChange={setTitle} placeholder="Introduction to React" />
            <Input label="Subject *" value={subject} onChange={setSubject} placeholder="Web Development" />
            <TextArea label="Description *" value={desc} onChange={setDesc} placeholder="Cover topics covered in today's lecture…" />
            <div>
              <label style={{ color: C.muted, fontSize: 12, fontWeight: 600, letterSpacing: ".8px", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Attachment (optional)</label>
              {file ? (
                <div style={{ background: C.surface, borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", border: `1px solid ${C.border}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Icon name={file.type.startsWith("image/") ? "image" : "pdf"} size={20} color={C.amber} />
                    <span style={{ fontSize: 13, color: C.text }}>{file.name}</span>
                  </div>
                  <button onClick={() => setFile(null)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                    <Icon name="close" size={18} color={C.danger} />
                  </button>
                </div>
              ) : (
                <button onClick={() => fileRef.current?.click()} style={{
                  width: "100%", padding: "12px", background: C.surface, border: `1px dashed ${C.border}`,
                  borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  color: C.muted, fontSize: 13, fontFamily: "inherit",
                }}>
                  <Icon name="upload" size={18} color={C.muted} /> Upload Image or PDF
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*,.pdf" style={{ display: "none" }} onChange={handleFile} />
            </div>
            <Btn onClick={handleSend} disabled={loading} full icon="send">{loading ? "Publishing…" : "Send Lecture"}</Btn>
          </div>
        </div>
      )}

      <div style={{ fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 14 }}>
        {store.lectures.length > 0 ? `${store.lectures.length} Lecture${store.lectures.length > 1 ? "s" : ""}` : "No lectures yet"}
      </div>
      {store.lectures.map(l => <LectureCard key={l.id} lec={l} isOwner={session.role === "owner"} />)}
      {store.lectures.length === 0 && (
        <div style={{ textAlign: "center", padding: 48, color: C.muted }}>
          <Icon name="book" size={48} color={C.border} />
          <div style={{ marginTop: 12, fontSize: 15 }}>No lectures published yet</div>
          {session.role !== "owner" && <div style={{ fontSize: 13, marginTop: 4 }}>Check back soon</div>}
        </div>
      )}
    </div>
  );
};

// ─── Notices Screen ────────────────────────────────────────────────────────────
const NoticesScreen = ({ session, store, onUpdate, setToast }) => {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [subject, setSubject] = useState("");
  const [desc, setDesc] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePublish = () => {
    if (!subject || !desc) { setToast({ msg: "Fill all required fields", type: "error" }); return; }
    setLoading(true);
    setTimeout(() => {
      const n = { id: uid(), date, subject, description: desc, createdAt: Date.now() };
      onUpdate(s => { s.notices = [n, ...s.notices]; });
      setSubject(""); setDesc("");
      setToast({ msg: "Notice published!", type: "success" });
      setLoading(false);
    }, 300);
  };

  return (
    <div style={{ padding: "20px 16px", maxWidth: 600, margin: "0 auto" }}>
      {session.role === "owner" && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "18px 16px", marginBottom: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <Icon name="plus" size={18} color={C.amber} /> New Notice
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Input label="Date *" value={date} onChange={setDate} type="date" />
            <Input label="Subject *" value={subject} onChange={setSubject} placeholder="Exam schedule update" />
            <TextArea label="Description *" value={desc} onChange={setDesc} placeholder="Write the notice here…" />
            <Btn onClick={handlePublish} disabled={loading} full variant="amber" icon="send">
              {loading ? "Publishing…" : "Publish Notice"}
            </Btn>
          </div>
        </div>
      )}

      <div style={{ fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 14 }}>
        {store.notices.length > 0 ? `${store.notices.length} Notice${store.notices.length > 1 ? "s" : ""}` : "No notices"}
      </div>
      {store.notices.map(n => <NoticeCard key={n.id} notice={n} />)}
      {store.notices.length === 0 && (
        <div style={{ textAlign: "center", padding: 48, color: C.muted }}>
          <Icon name="bell" size={48} color={C.border} />
          <div style={{ marginTop: 12, fontSize: 15 }}>No notices yet</div>
        </div>
      )}
    </div>
  );
};

// ─── Profile Screen ────────────────────────────────────────────────────────────
const ProfileScreen = ({ session }) => {
  const p = session.profile;
  return (
    <div style={{ padding: "32px 20px", maxWidth: 480, margin: "0 auto" }}>
      <div style={{ background: C.card, borderRadius: 20, overflow: "hidden", border: `1px solid ${C.border}` }}>
        <div style={{ background: `linear-gradient(135deg, ${C.accentDim}, ${C.bg})`, height: 100 }} />
        <div style={{ padding: "0 24px 24px", marginTop: -44 }}>
          <div style={{
            width: 80, height: 80, borderRadius: "50%", border: `3px solid ${C.card}`,
            background: p?.avatar ? "none" : C.accentDim,
            overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {p?.avatar
              ? <img src={p.avatar} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <span style={{ fontSize: 28, color: C.white, fontWeight: 700 }}>{(p?.name || session.email)[0].toUpperCase()}</span>
            }
          </div>
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: C.text }}>{p?.name || session.email}</div>
            {session.role === "owner"
              ? <div style={{ fontSize: 13, color: C.amber, fontWeight: 600, marginTop: 2 }}>Owner</div>
              : <div style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>Student</div>
            }
          </div>
          <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              ["Email", session.email],
              ...(p?.rollNumber ? [["Roll Number", p.rollNumber]] : []),
              ["Role", session.role === "owner" ? "Owner / Administrator" : "Student / User"],
            ].map(([label, value]) => (
              <div key={label} style={{ background: C.surface, borderRadius: 10, padding: "12px 14px", border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, letterSpacing: ".6px", textTransform: "uppercase", marginBottom: 3 }}>{label}</div>
                <div style={{ fontSize: 14, color: C.text, fontWeight: 600 }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── About Screen ──────────────────────────────────────────────────────────────
const AboutScreen = () => (
  <div style={{ padding: "32px 20px", maxWidth: 480, margin: "0 auto" }}>
    <div style={{ background: C.card, borderRadius: 20, padding: 24, border: `1px solid ${C.border}` }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{
          width: 64, height: 64, borderRadius: 18, background: `linear-gradient(135deg, ${C.accent}, ${C.accentDim})`,
          display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px",
          fontSize: 28, fontWeight: 900, color: C.white, boxShadow: `0 8px 24px ${C.accentDim}`,
        }}>U</div>
        <div style={{ fontSize: 24, fontWeight: 800, color: C.text }}>Updater</div>
        <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>Version 1.0.0</div>
      </div>
      {[
        ["Purpose", "Updater is a one-way information broadcasting app designed for educators to share lectures and notices with students in a clean, reliable feed."],
        ["Tech Stack", "Built with React (web prototype). Production version targets React Native for Android & iOS with Firebase for auth, Firestore for data, and Firebase Storage for attachments."],
        ["Role System", "A single Owner can publish content. Students register and receive updates in real-time. Owner access is protected by restricted credentials."],
        ["Developer", "Yash Bhagat · yashbhagat579@gmail.com"],
      ].map(([title, text]) => (
        <div key={title} style={{ marginBottom: 16, padding: "14px", background: C.surface, borderRadius: 12, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 12, color: C.accent, fontWeight: 700, letterSpacing: ".8px", textTransform: "uppercase", marginBottom: 6 }}>{title}</div>
          <div style={{ fontSize: 13.5, color: C.muted, lineHeight: 1.6 }}>{text}</div>
        </div>
      ))}
    </div>
  </div>
);

// ─── Bottom Nav ────────────────────────────────────────────────────────────────
const BottomNav = ({ page, onNavigate }) => {
  const tabs = [
    { id: "lectures", icon: "book", label: "Lectures" },
    { id: "notices", icon: "bell", label: "Notices" },
    { id: "profile", icon: "user", label: "Profile" },
    { id: "about", icon: "info", label: "About" },
  ];
  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0,
      background: C.surface, borderTop: `1px solid ${C.border}`,
      display: "flex", padding: "8px 0 12px", zIndex: 100,
    }}>
      {tabs.map(t => {
        const active = page === t.id;
        return (
          <button key={t.id} onClick={() => onNavigate(t.id)} style={{
            flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
            background: "none", border: "none", cursor: "pointer", padding: "4px 0",
            color: active ? C.accent : C.muted, fontSize: 11, fontWeight: 600, fontFamily: "inherit",
            transition: "color .15s",
          }}>
            <Icon name={t.icon} size={22} color={active ? C.accent : C.muted} />
            {t.label}
          </button>
        );
      })}
    </div>
  );
};

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [store, setStore] = useState(() => loadStore() || defaultStore());
  const [session, setSession] = useState(() => {
  try {
    const s = localStorage.getItem("updater_session");
    return s ? JSON.parse(s) : null;
  } catch { return null; }
});
  const [page, setPage] = useState("lectures");
  const [toast, setToast] = useState(null);
  const [needsProfile, setNeedsProfile] = useState(false);

  // persist store
  useEffect(() => { saveStore(store); }, [store]);

  const updateStore = (fn) => {
    setStore(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      fn(next);
      return next;
    });
  };

  const handleAuth = (sess, newUserData) => {
    if (newUserData) {
      updateStore(s => { s.users[newUserData.email] = { password: newUserData.password, role: newUserData.role, profile: null }; });
    }
    setSession(sess);
    localStorage.setItem("updater_session", JSON.stringify(sess));
    if (sess.isNew || (!sess.profile && sess.role !== "owner")) {
      setNeedsProfile(true);
    } else {
      setNeedsProfile(false);
    }
  };

  const handleProfileComplete = (profile) => {
    updateStore(s => { if (s.users[session.email]) s.users[session.email].profile = profile; });
    setSession(prev => ({ ...prev, profile }));
    setNeedsProfile(false);
  };

  const handleLogout = () => { 
    setSession(null); 
    setPage("lectures"); 
    localStorage.removeItem("updater_session");
  };

  const showToast = (t) => setToast(t);

  // ── Render ──
  const commonProps = { session, store, onUpdate: updateStore, setToast: showToast };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: C.text, maxWidth: 768, margin: "0 auto", position: "relative" }}>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {!session ? (
        <AuthScreen store={store} onAuth={handleAuth} setToast={showToast} />
      ) : needsProfile ? (
        <ProfileSetup session={session} onComplete={handleProfileComplete} setToast={showToast} />
      ) : (
        <>
          <Header session={session} page={page} onNavigate={setPage} onLogout={handleLogout} />
          <div style={{ paddingBottom: 80 }}>
            {page === "lectures" && <LecturesScreen {...commonProps} />}
            {page === "notices" && <NoticesScreen {...commonProps} />}
            {page === "profile" && <ProfileScreen session={session} />}
            {page === "about" && <AboutScreen />}
          </div>
          <BottomNav page={page} onNavigate={setPage} />
        </>
      )}
    </div>
  );
}
