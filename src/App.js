import { useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc, setDoc, getDoc, serverTimestamp, query as queryFirestore, orderBy } from "firebase/firestore";

// ─── Firebase Setup ───────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyBoYBf36spL1LngnRWo0NUJYMUrFhIRmwA",
  authDomain: "updater-app-dc51a.firebaseapp.com",
  projectId: "updater-app-dc51a",
  storageBucket: "updater-app-dc51a.firebasestorage.app",
  messagingSenderId: "824489179385",
  appId: "1:824489179385:web:0880ce5b21b9c4376c8a28"
};
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

// ─── Design Tokens ───────────────────────────────────────────────────────────
const isDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;

const C = {
  bg: isDark ? "#0F1117" : "#F5F7FF",
  surface: isDark ? "#1A1D27" : "#FFFFFF",
  card: isDark ? "#20243A" : "#FFFFFF",
  border: isDark ? "#2A2F4A" : "#E0E4F0",
  accent: "#4C6EF5",
  accentDim: "#3D4F99",
  amber: "#F59F00",
  amberDim: "#7A521A",
  text: isDark ? "#E8EAF6" : "#1A1D27",
  muted: isDark ? "#7B80A0" : "#6B7280",
  danger: "#FF5252",
  success: "#4CAF7D",
  white: "#FFFFFF",
};
// ─── Utility ──────────────────────────────────────────────────────────────────
const fmtDate = (d) => {
  if (!d) return "";
  const date = d.toDate ? d.toDate() : new Date(d);
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

// ─── Icons ────────────────────────────────────────────────────────────────────
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
    search: "M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z",
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

// ─── Dropdown Menu ────────────────────────────────────────────────────────────
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
      <button onClick={() => setOpen(o => !o)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", gap: 4, padding: 6 }}>
        {[0,1,2].map(i => <span key={i} style={{ width: 4, height: 4, borderRadius: "50%", background: C.text, display: "block" }} />)}
      </button>
      {open && (
        <div style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, minWidth: 180, zIndex: 1000, overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,.2)" }}>
          {items.map(item => (
            <button key={item.page} onClick={() => { onNavigate(item.page); setOpen(false); }} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "12px 16px", background: "none", border: "none", color: C.text, fontSize: 14, cursor: "pointer", textAlign: "left" }}
              onMouseEnter={e => e.currentTarget.style.background = C.surface}
              onMouseLeave={e => e.currentTarget.style.background = "none"}>
              <Icon name={item.icon} size={18} color={C.accent} />
              {item.label}
            </button>
          ))}
          <div style={{ height: 1, background: C.border }} />
          <button onClick={() => { onLogout(); setOpen(false); }} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "12px 16px", background: "none", border: "none", color: C.danger, fontSize: 14, cursor: "pointer", textAlign: "left" }}
            onMouseEnter={e => e.currentTarget.style.background = C.surface}
            onMouseLeave={e => e.currentTarget.style.background = "none"}>
            <Icon name="logout" size={18} color={C.danger} />
            Log Out
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Header ───────────────────────────────────────────────────────────────────
const Header = ({ session, onNavigate, onLogout }) => (
  <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 16, color: C.white }}>U</div>
      <div>
        <div style={{ fontWeight: 700, fontSize: 15, color: C.text, lineHeight: 1 }}>Updater</div>
        {session && <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>{session.role === "owner" ? "Owner" : session.profile?.name || session.email}</div>}
      </div>
    </div>
    {session && <MenuDropdown session={session} onNavigate={onNavigate} onLogout={onLogout} />}
  </div>
);

// ─── Auth Screen ──────────────────────────────────────────────────────────────
const AuthScreen = ({ onAuth, setToast }) => {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);

    // AFTER — remove OWNER_EMAIL and OWNER_PIN constants entirely
const handleSubmit = async () => {
  if (!email) { setToast({ msg: "Fill all fields", type: "error" }); return; }
  if (mode !== "owner" && !password) { setToast({ msg: "Fill all fields", type: "error" }); return; }
  if (mode === "owner" && !pin) { setToast({ msg: "Enter pincode", type: "error" }); return; }
  setLoading(true);
  try {
    if (mode === "owner") {
      const trimmedEmail = email.trim();
      const trimmedPin = pin.trim();

      let cred;
      try {
        cred = await signInWithEmailAndPassword(auth, trimmedEmail, trimmedEmail + "_owner_pass");
      } catch {
        try {
          cred = await createUserWithEmailAndPassword(auth, trimmedEmail, trimmedEmail + "_owner_pass");
        } catch {
          cred = await signInWithEmailAndPassword(auth, trimmedEmail, trimmedEmail + "_owner_pass");
        }
      }

      const configDoc = await getDoc(doc(db, "config", "owner"));
      if (!configDoc.exists()) {
        await signOut(auth);
        setToast({ msg: "Owner config not found. Contact support.", type: "error" });
        setLoading(false);
        return;
      }

      const configData = configDoc.data();

      if (trimmedEmail !== configData.email || trimmedPin !== configData.pin) {
        await signOut(auth);
        setToast({ msg: "Invalid owner credentials", type: "error" });
        setLoading(false);
        return;
      }

      await setDoc(doc(db, "users", cred.user.uid), {
        email: trimmedEmail,
        role: "owner",
        profile: { name: "Owner" }
      }, { merge: true });

      onAuth({
        uid: cred.user.uid,
        email: trimmedEmail,
        role: "owner",
        profile: { name: "Owner" }
      });

    } else if (mode === "signup") {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, "users", cred.user.uid), { email, role: "user", profile: null });
      onAuth({ uid: cred.user.uid, email, role: "user", profile: null, isNew: true });

    } else {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, "users", cred.user.uid));
      const data = userDoc.data();
      onAuth({ uid: cred.user.uid, email, role: data?.role || "user", profile: data?.profile || null });
    }
  } catch (e) {
    setToast({
      msg: e.message.includes("user-not-found") || e.message.includes("wrong-password") || e.message.includes("invalid")
        ? "Invalid credentials"
        : e.message.includes("email-already")
        ? "Email already registered"
        : e.message.includes("weak")
        ? "Password min 6 chars"
        : "Error: " + e.message,
      type: "error"
    });
  }
  setLoading(false);
};
        

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: `linear-gradient(135deg, ${C.accent}, ${C.accentDim})`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 28, fontWeight: 900, color: C.white, boxShadow: `0 8px 24px ${C.accentDim}` }}>U</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: C.text, letterSpacing: "-.5px" }}>Updater</div>
          <div style={{ color: C.muted, fontSize: 14, marginTop: 4 }}>One-way. Reliable. Instant.</div>
        </div>
        <div style={{ display: "flex", background: C.surface, borderRadius: 12, padding: 4, marginBottom: 24, border: `1px solid ${C.border}` }}>
          {[["login", "Login"], ["signup", "Sign Up"], ["owner", "Owner"]].map(([v, l]) => (
            <button key={v} onClick={() => setMode(v)} style={{ flex: 1, padding: "9px 0", borderRadius: 9, border: "none", cursor: "pointer", background: mode === v ? C.accent : "transparent", color: mode === v ? C.white : C.muted, fontWeight: 600, fontSize: 13, fontFamily: "inherit", transition: "all .15s" }}>{l}</button>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Input label="Email" value={email} onChange={setEmail} type="email" placeholder="you@example.com" required />
          {mode !== "owner" && <Input label="Password" value={password} onChange={setPassword} type="password" placeholder="••••••••" required />}
          {mode === "owner" && <Input label="6-Digit Pincode" value={pin} onChange={v => setPin(v.slice(0, 6))} type="password" placeholder="••••••" required />}
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

// ─── Profile Setup ────────────────────────────────────────────────────────────
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

  const handleSubmit = async () => {
    if (!name.trim()) { setToast({ msg: "Name is required", type: "error" }); return; }
    if (!roll.trim() || isNaN(Number(roll))) { setToast({ msg: "Valid roll number required", type: "error" }); return; }
    const profile = { name: name.trim(), rollNumber: roll.trim(), avatar: avatar || null };
    await setDoc(doc(db, "users", session.uid), { profile }, { merge: true });
    onComplete(profile);
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: C.text }}>Complete Your Profile</div>
          <div style={{ color: C.muted, fontSize: 14, marginTop: 4 }}>Required before you can continue</div>
        </div>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div onClick={() => fileRef.current?.click()} style={{ width: 90, height: 90, borderRadius: "50%", margin: "0 auto 10px", background: avatar ? "none" : C.surface, border: `2px dashed ${avatar ? C.accent : C.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", overflow: "hidden" }}>
            {avatar ? <img src={avatar} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Icon name="upload" size={28} color={C.muted} />}
          </div>
          <div style={{ fontSize: 12, color: C.muted }}>Tap to upload photo (optional)</div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Input label="Full Name" value={name} onChange={setName} placeholder="Enter Your Name" required />
          <Input label="Roll Number" value={roll} onChange={setRoll} type="number" placeholder="147" required />
          <Btn onClick={handleSubmit} full>Save & Continue</Btn>
        </div>
      </div>
    </div>
  );
};
//Lecture Detail//
const LectureDetail = ({ lec, isOwner, onClose, onDelete }) => {
  const isImage = lec.fileType?.startsWith("image/");
  const [viewImg, setViewImg] = useState(null);

  useEffect(() => {
    const handleBack = () => {
      if (viewImg) {
        setViewImg(null);
        window.history.pushState(null, "", window.location.href);
      } else {
        onClose();
        window.history.pushState(null, "", window.location.href);
      }
    };
    window.addEventListener("popstate", handleBack);
    window.history.pushState(null, "", window.location.href);
    return () => window.removeEventListener("popstate", handleBack);
  }, [viewImg]);

  const handleDownload = async () => {
    if (!lec.fileUrl) return;
    try {
      const response = await fetch(lec.fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = lec.fileName || "attachment";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      window.open(lec.fileUrl, "_blank");
    }
  };

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: C.bg, zIndex: 500, overflowY: "auto", maxWidth: 768, margin: "0 auto" }}>
      {viewImg && (
        <div onClick={() => setViewImg(null)} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,.95)", zIndex: 600, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
          <button onClick={() => setViewImg(null)} style={{ position: "absolute", top: 16, left: 16, background: "none", border: "none", color: "#fff", fontSize: 16, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>← Back</button>
          <img src={viewImg} alt="full view" style={{ maxWidth: "100%", maxHeight: "90vh", objectFit: "contain", borderRadius: 8 }} />
        </div>
      )}
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "14px 20px", display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 10 }}>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: C.accent, fontSize: 14, fontWeight: 600, fontFamily: "inherit", padding: 0 }}>
          <Icon name="close" size={20} color={C.accent} /> Back
        </button>
        {isOwner && (
         <button onClick={() => { if(window.confirm("Delete this lecture?")) { onDelete(lec.id); onClose(); } }} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: C.danger, fontSize: 13, fontWeight: 600, fontFamily: "inherit" }}>
            <Icon name="close" size={16} color={C.danger} /> Delete
          </button>
        )}
      </div>
      <div style={{ padding: "24px 20px", maxWidth: 600, margin: "0 auto" }}>
        <div style={{ display: "inline-block", background: C.accent + "18", color: C.accent, fontSize: 11, fontWeight: 700, letterSpacing: ".8px", textTransform: "uppercase", padding: "4px 10px", borderRadius: 20, marginBottom: 12 }}>
          {lec.subject}
        </div>
        <div style={{ fontSize: 26, fontWeight: 800, color: C.text, lineHeight: 1.3, marginBottom: 8 }}>{lec.title}</div>
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 24, display: "flex", alignItems: "center", gap: 6 }}>
          📅 {lec.date ? new Date(lec.date).toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" }) : fmtDate(lec.createdAt)}
        </div>
        <div style={{ height: 1, background: C.border, marginBottom: 24 }} />
        <div style={{ fontSize: 16, color: C.text, lineHeight: 1.9, whiteSpace: "pre-wrap", marginBottom: 32 }}>{lec.description}</div>
     {(lec.files?.length > 0 || lec.fileUrl) && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".6px", marginBottom: 12 }}>
              Attachments ({lec.files?.length || 1})
            </div>
            {lec.files?.length > 0 ? (
              lec.files.map((f, i) => {
                const isImg = f.type?.startsWith("image/");
                return (
                  <div key={i} style={{ marginBottom: 12 }}>
                    {isImg && <img src={f.url} alt={f.name} style={{ width: "100%", borderRadius: 10, marginBottom: 8, objectFit: "cover" }} />}
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                      <div style={{ fontSize: 12, color: C.muted, wordBreak: "break-all" }}>{f.name}</div>
                      <div style={{ display: "flex", gap: 8 }}>
                        {isImg && (
                          <button onClick={(e) => { e.stopPropagation(); setViewImg(f.url); window.history.pushState(null, "", window.location.href); }} style={{
                            flex: 1, padding: "10px", background: C.surface, border: `1px solid ${C.border}`,
                            borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 600,
                            color: C.accent, fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 6
                          }}>
                            <Icon name="image" size={16} color={C.accent} /> View Full
                          </button>
                        )}
                        {!isOwner && (
                          <button onClick={async () => {
                            try {
                              const res = await fetch(f.url);
                              const blob = await res.blob();
                              const url = window.URL.createObjectURL(blob);
                              const a = document.createElement("a");
                              a.href = url; a.download = f.name;
                              document.body.appendChild(a); a.click();
                              document.body.removeChild(a);
                              window.URL.revokeObjectURL(url);
                            } catch { window.open(f.url, "_blank"); }
                          }} style={{
                            flex: 1, padding: "10px", background: C.amber, border: "none",
                            borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 600,
                            color: C.bg, fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 6
                          }}>
                            <Icon name="download" size={16} color={C.bg} /> Download
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div>
                {isImage && <img src={lec.fileUrl} alt="attachment" style={{ width: "100%", borderRadius: 10, marginBottom: 12, objectFit: "cover" }} />}
                <div style={{ display: "flex", gap: 10 }}>
                  {isImage && <Btn onClick={() => { setViewImg(lec.fileUrl); window.history.pushState(null, "", window.location.href); }} variant="ghost" small icon="image">View Full</Btn>}
                  {!isOwner && <Btn onClick={handleDownload} variant="amber" small icon="download">Download</Btn>}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
// ─── Lecture Card ─────────────────────────────────────────────────────────────
const LectureCard = ({ lec, isOwner, onDelete, onClick }) => {
  const isImage = lec.fileType?.startsWith("image/");
  return (
    <div onClick={onClick} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden", marginBottom: 14, boxShadow: "0 1px 4px rgba(0,0,0,.06)", cursor: "pointer", transition: "transform .15s, box-shadow .15s" }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(76,110,245,.15)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,.06)"; }}
    >
      <div style={{ background: `linear-gradient(90deg, ${C.accentDim}22, transparent)`, padding: "14px 16px", borderBottom: `1px solid ${C.border}40`, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: C.accent, fontWeight: 700, letterSpacing: ".8px", textTransform: "uppercase", marginBottom: 4 }}>{lec.subject}</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: C.text }}>{lec.title}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ fontSize: 12, color: C.muted, whiteSpace: "nowrap" }}>
            {lec.date ? new Date(lec.date).toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric" }) : fmtDate(lec.createdAt)}
          </div>
         {isOwner && <button onClick={e => { e.stopPropagation(); if(window.confirm("Delete this lecture?")) onDelete(lec.id); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}><Icon name="close" size={16} color={C.danger} /></button>}
        </div>
      </div>
      <div style={{ padding: "12px 16px" }}>
        <div style={{ color: C.muted, fontSize: 13.5, lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{lec.description}</div>
      {(lec.files?.length > 0 || lec.fileUrl) && (
          <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 6 }}>
            <Icon name="image" size={14} color={C.amber} />
            <span style={{ fontSize: 12, color: C.amber, fontWeight: 600 }}>
              {lec.files?.length > 0 ? `${lec.files.length} file${lec.files.length > 1 ? "s" : ""} attached` : "1 file attached"}
            </span>
          </div>
        )}
        <div style={{ marginTop: 8, fontSize: 12, color: C.accent, fontWeight: 600 }}>Tap to read more →</div>
      </div>
    </div>
  );
};

// ─── Notice Card ──────────────────────────────────────────────────────────────
const NoticeCard = ({ notice, isOwner, onDelete }) => (
  <div style={{ background: C.card, border: `1px solid ${C.border}`, borderLeft: `4px solid ${C.amber}`, borderRadius: 14, padding: "14px 16px", marginBottom: 12, boxShadow: "0 1px 4px rgba(0,0,0,.06)" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{notice.subject}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ fontSize: 12, color: C.muted, whiteSpace: "nowrap" }}>{notice.date ? new Date(notice.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : fmtDate(notice.createdAt)}</div>
        {isOwner && <button onClick={() => { if(window.confirm("Delete this notice?")) onDelete(notice.id); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}><Icon name="close" size={16} color={C.danger} /></button>}
      </div>
    </div>
    <div style={{ fontSize: 13.5, color: C.muted, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{notice.description}</div>
  </div>
);

// ─── Lectures Screen ──────────────────────────────────────────────────────────
const LecturesScreen = ({ session, setToast }) => {
  const [lectures, setLectures] = useState([]);
  const groupedLectures = lectures.reduce((groups, lec) => {
    const date = lec.date || "Unknown";
    if (!groups[date]) groups[date] = [];
    groups[date].push(lec);
    return groups;
  }, {});
  const sortedDates = Object.keys(groupedLectures).sort((a, b) => new Date(b) - new Date(a));
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [desc, setDesc] = useState("");
  const [files, setFiles] = useState([]);
  const [selectedLec, setSelectedLec] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    const q = queryFirestore(collection(db, "lectures"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, snap => setLectures(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return unsub;
  }, []);

  const handleFile = (e) => {
    const newFiles = Array.from(e.target.files);
    newFiles.forEach(f => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setFiles(prev => [...prev, { url: ev.target.result, name: f.name, type: f.type, raw: f }]);
      };
      reader.readAsDataURL(f);
    });
  };

  const handleSend = async () => {
    if (!title || !subject || !desc) { setToast({ msg: "Fill all required fields", type: "error" }); return; }
    setLoading(true);
    try {
      let fileUrl = null;
      let fileName = null;
      let fileType = null;

     let uploadedFiles = [];
      for (const file of files) {
        if (file.type.startsWith("image/")) {
          const formData = new FormData();
          formData.append("image", file.raw);
          const res = await fetch("https://api.imgbb.com/1/upload?key=5cf22bb839530082a818dccdc34a6012", {
            method: "POST",
            body: formData,
          });
          const data = await res.json();
          if (data.success) {
            uploadedFiles.push({ url: data.data.url, name: file.name, type: file.type });
          } else {
            setToast({ msg: `Failed to upload ${file.name}`, type: "error" });
            setLoading(false);
            return;
          }
        } else {
          uploadedFiles.push({ url: file.url, name: file.name, type: file.type });
        }
      }
      
      await addDoc(collection(db, "lectures"), {
        date, title, subject, description: desc,
        files: uploadedFiles,
        createdAt: serverTimestamp(),
      });
      setTitle(""); setSubject(""); setDesc(""); setFiles([]);
      setToast({ msg: "Lecture published!", type: "success" });
    } catch (e) { setToast({ msg: "Error: " + e.message, type: "error" }); }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    try { await deleteDoc(doc(db, "lectures", id)); setToast({ msg: "Deleted", type: "success" }); }
    catch (e) { setToast({ msg: "Error deleting", type: "error" }); }
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
            <TextArea label="Description *" value={desc} onChange={setDesc} placeholder="Topics covered today…" />
            <div>
              <label style={{ color: C.muted, fontSize: 12, fontWeight: 600, letterSpacing: ".8px", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Attachment (optional)</label>
            {files.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 8 }}>
                  {files.map((f, i) => (
                    <div key={i} style={{ background: C.surface, borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", border: `1px solid ${C.border}` }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Icon name={f.type.startsWith("image/") ? "image" : "pdf"} size={20} color={C.amber} />
                        <span style={{ fontSize: 13, color: C.text }}>{f.name}</span>
                      </div>
                      <button onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))} style={{ background: "none", border: "none", cursor: "pointer" }}>
                        <Icon name="close" size={18} color={C.danger} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <button onClick={() => fileRef.current?.click()} style={{ width: "100%", padding: "12px", background: C.surface, border: `1px dashed ${C.border}`, borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: C.muted, fontSize: 13, fontFamily: "inherit" }}>
                <Icon name="upload" size={18} color={C.muted} /> {files.length > 0 ? "Add More Files" : "Upload Images or PDF"}
              </button>
              <input ref={fileRef} type="file" accept="image/*,.pdf" multiple style={{ display: "none" }} onChange={handleFile} />
          
            </div>
            <Btn onClick={handleSend} disabled={loading} full icon="send">{loading ? "Publishing…" : "Send Lecture"}</Btn>
          </div>
        </div>
      )}
    <div style={{ fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 14 }}>
        {lectures.length > 0 ? `${lectures.length} Lecture${lectures.length > 1 ? "s" : ""}` : "No lectures yet"}
      </div>
      {selectedLec && <LectureDetail lec={selectedLec} isOwner={session.role === "owner"} onClose={() => setSelectedLec(null)} onDelete={handleDelete} />}
      {lectures.length === 0 && (
        <div style={{ textAlign: "center", padding: 48, color: C.muted }}>
          <Icon name="book" size={48} color={C.border} />
          <div style={{ marginTop: 12, fontSize: 15 }}>No lectures published yet</div>
        </div>
      )}
      {sortedDates.map(date => (
        <div key={date} style={{ marginBottom: 24 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 10, marginBottom: 12,
          }}>
            <div style={{
              background: C.accent, color: C.white, borderRadius: 10,
              padding: "4px 12px", fontSize: 12, fontWeight: 700,
            }}>
              {new Date(date).toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
            </div>
            <div style={{ flex: 1, height: 1, background: C.border }} />
          </div>
          {groupedLectures[date].map(l => (
            <LectureCard key={l.id} lec={l} isOwner={session.role === "owner"} onDelete={handleDelete} onClick={() => setSelectedLec(l)} />
          ))}
        </div>
      ))}
    </div>
  );
};

// ─── Notices Screen ───────────────────────────────────────────────────────────
const NoticesScreen = ({ session, setToast }) => {
  const [notices, setNotices] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [subject, setSubject] = useState("");
  const [desc, setDesc] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = queryFirestore(collection(db, "notices"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, snap => setNotices(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return unsub;
  }, []);

  const handlePublish = async () => {
    if (!subject || !desc) { setToast({ msg: "Fill all required fields", type: "error" }); return; }
    setLoading(true);
    try {
      await addDoc(collection(db, "notices"), { date, subject, description: desc, createdAt: serverTimestamp() });
      setSubject(""); setDesc("");
      setToast({ msg: "Notice published!", type: "success" });
    } catch (e) { setToast({ msg: "Error: " + e.message, type: "error" }); }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    try { await deleteDoc(doc(db, "notices", id)); setToast({ msg: "Deleted", type: "success" }); }
    catch (e) { setToast({ msg: "Error deleting", type: "error" }); }
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
            <Btn onClick={handlePublish} disabled={loading} full variant="amber" icon="send">{loading ? "Publishing…" : "Publish Notice"}</Btn>
          </div>
        </div>
      )}
      <div style={{ fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 14 }}>
        {notices.length > 0 ? `${notices.length} Notice${notices.length > 1 ? "s" : ""}` : "No notices"}
      </div>
     {(() => {
        const groupedNotices = notices.reduce((groups, n) => {
          const date = n.date || "Unknown";
          if (!groups[date]) groups[date] = [];
          groups[date].push(n);
          return groups;
        }, {});
        const sortedDates = Object.keys(groupedNotices).sort((a, b) => new Date(b) - new Date(a));
        return sortedDates.map(date => (
          <div key={date} style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{ background: C.amber, color: C.bg, borderRadius: 10, padding: "4px 12px", fontSize: 12, fontWeight: 700 }}>
                {new Date(date).toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
              </div>
              <div style={{ flex: 1, height: 1, background: C.border }} />
            </div>
            {groupedNotices[date].map(n => (
              <NoticeCard key={n.id} notice={n} isOwner={session.role === "owner"} onDelete={handleDelete} />
            ))}
          </div>
        ));
      })()}
      {notices.length === 0 && (
        <div style={{ textAlign: "center", padding: 48, color: C.muted }}>
          <Icon name="bell" size={48} color={C.border} />
          <div style={{ marginTop: 12, fontSize: 15 }}>No notices yet</div>
        </div>
      )}
    </div>
  );
};

// ─── Profile Screen ───────────────────────────────────────────────────────────
const ProfileScreen = ({ session, onUpdateSession }) => {
  const p = session.profile;
  const fileRef = useRef(null);

  const handleAvatarChange = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = async (ev) => {
      const updated = { ...session, profile: { ...session.profile, avatar: ev.target.result } };
      await setDoc(doc(db, "users", session.uid), { profile: updated.profile }, { merge: true });
      onUpdateSession(updated);
    };
    r.readAsDataURL(f);
  };

  return (
    <div style={{ padding: "32px 20px", maxWidth: 480, margin: "0 auto" }}>
      <div style={{ background: C.card, borderRadius: 20, overflow: "hidden", border: `1px solid ${C.border}` }}>
        <div style={{ background: `linear-gradient(135deg, ${C.accentDim}, ${C.bg})`, height: 100 }} />
        <div style={{ padding: "0 24px 24px", marginTop: -44 }}>
          <div onClick={() => fileRef.current?.click()} style={{ width: 80, height: 80, borderRadius: "50%", border: `3px solid ${C.card}`, background: p?.avatar ? "none" : C.accentDim, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            {p?.avatar ? <img src={p.avatar} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 28, color: C.white, fontWeight: 700 }}>{(p?.name || session.email)[0].toUpperCase()}</span>}
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarChange} />
          <div style={{ fontSize: 11, color: C.accent, marginTop: 6, cursor: "pointer" }} onClick={() => fileRef.current?.click()}>Tap to change photo</div>
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: C.text }}>{p?.name || session.email}</div>
            {session.role === "owner" ? <div style={{ fontSize: 13, color: C.amber, fontWeight: 600, marginTop: 2 }}>Owner</div> : <div style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>Student</div>}
          </div>
          <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 12 }}>
            {[["Email", session.email], ...(p?.rollNumber ? [["Roll Number", p.rollNumber]] : []), ["Role", session.role === "owner" ? "Owner / Administrator" : "Student / User"]].map(([label, value]) => (
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

// ─── About Screen ─────────────────────────────────────────────────────────────
const AboutScreen = () => (
  <div style={{ padding: "32px 20px", maxWidth: 480, margin: "0 auto" }}>
    <div style={{ background: C.card, borderRadius: 20, padding: 24, border: `1px solid ${C.border}` }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ width: 64, height: 64, borderRadius: 18, background: `linear-gradient(135deg, ${C.accent}, ${C.accentDim})`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", fontSize: 28, fontWeight: 900, color: C.white }}>U</div>
        <div style={{ fontSize: 24, fontWeight: 800, color: C.text }}>Updater</div>
        <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>Version 2.0.0 — Firebase Edition</div>
      </div>
      {[
        ["Purpose", "Updater is a one-way information broadcasting app for educators to share lectures and notices with students in real-time."],
        ["Backend", "Powered by Firebase — Authentication, Firestore database, and real-time sync across all devices."],
        ["Role System", "A single Owner can publish content. Students register and receive updates instantly. Owner access is protected by restricted credentials."],
        ["Developer", "Yash Bhagat"],
      ].map(([title, text]) => (
        <div key={title} style={{ marginBottom: 16, padding: "14px", background: C.surface, borderRadius: 12, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 12, color: C.accent, fontWeight: 700, letterSpacing: ".8px", textTransform: "uppercase", marginBottom: 6 }}>{title}</div>
          <div style={{ fontSize: 13.5, color: C.muted, lineHeight: 1.6 }}>{text}</div>
        </div>
      ))}
    </div>
  </div>
);

// ─── Search Screen ────────────────────────────────────────────────────────────
const SearchScreen = ({ session }) => {
  const [query, setQuery] = useState("");
  const [lectures, setLectures] = useState([]);
  const [selectedLec, setSelectedLec] = useState(null);

  useEffect(() => {
    const q = queryFirestore(collection(db, "lectures"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, snap => setLectures(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return unsub;
  }, []);

  const filtered = lectures.filter(l => {
    const q = query.toLowerCase();
    return (
      l.title?.toLowerCase().includes(q) ||
      l.subject?.toLowerCase().includes(q) ||
      l.description?.toLowerCase().includes(q) ||
      l.date?.includes(q)
    );
  });

  return (
    <div style={{ padding: "20px 16px", maxWidth: 600, margin: "0 auto" }}>
      <div style={{ fontWeight: 700, fontSize: 18, color: C.text, marginBottom: 16 }}>Search Lectures</div>
      <div style={{ position: "relative", marginBottom: 20 }}>
        <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}>
          <Icon name="search" size={18} color={C.muted} />
        </div>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by title, subject, date..."
          style={{
            width: "100%", padding: "12px 14px 12px 40px",
            background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 12, fontSize: 14, color: C.text,
            fontFamily: "inherit", outline: "none", boxSizing: "border-box",
          }}
          onFocus={e => e.target.style.borderColor = C.accent}
          onBlur={e => e.target.style.borderColor = C.border}
        />
      </div>

      {query.length === 0 && (
        <div style={{ textAlign: "center", padding: 48, color: C.muted }}>
          <Icon name="search" size={48} color={C.border} />
          <div style={{ marginTop: 12, fontSize: 15 }}>Type to search lectures</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>Search by title, subject or date</div>
        </div>
      )}

      {query.length > 0 && filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: 48, color: C.muted }}>
          <Icon name="search" size={48} color={C.border} />
          <div style={{ marginTop: 12, fontSize: 15 }}>No results found</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>Try a different search term</div>
        </div>
      )}

      {selectedLec && <LectureDetail lec={selectedLec} isOwner={session.role === "owner"} onClose={() => setSelectedLec(null)} onDelete={() => {}} />}
      {filtered.map(l => <LectureCard key={l.id} lec={l} isOwner={false} onDelete={() => {}} onClick={() => setSelectedLec(l)} />)}
    </div>
  );
};
// ─── Bottom Nav ───────────────────────────────────────────────────────────────
const BottomNav = ({ page, onNavigate, newLectures, newNotices }) => {
  const tabs = [
    { id: "lectures", icon: "book", label: "Lectures", badge: newLectures },
    { id: "notices", icon: "bell", label: "Notices", badge: newNotices },
    { id: "search", icon: "search", label: "Search", badge: false },
    { id: "profile", icon: "user", label: "Profile", badge: false },
    { id: "about", icon: "info", label: "About", badge: false },
  ];
  return (
    <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: C.surface, borderTop: `1px solid ${C.border}`, display: "flex", padding: "8px 0 12px", zIndex: 100 }}>
      {tabs.map(t => {
        const active = page === t.id;
        return (
          <button key={t.id} onClick={() => onNavigate(t.id)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", padding: "4px 0", color: active ? C.accent : C.muted, fontSize: 11, fontWeight: 600, fontFamily: "inherit", transition: "color .15s" }}>
            <div style={{ position: "relative" }}>
              <Icon name={t.icon} size={22} color={active ? C.accent : C.muted} />
              {t.badge && !active && (
                <div style={{ position: "absolute", top: -2, right: -4, width: 8, height: 8, borderRadius: "50%", background: C.danger, border: `2px solid ${C.surface}` }} />
              )}
            </div>
            {t.label}
          </button>
        );
      })}
    </div>
  );
};

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [page, setPage] = useState("lectures");
  const [toast, setToast] = useState(null);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [newLectures, setNewLectures] = useState(false);
  const [newNotices, setNewNotices] = useState(false);
  const lastSeenLecture = useRef(localStorage.getItem("lastSeenLecture") || null);
  const lastSeenNotice = useRef(localStorage.getItem("lastSeenNotice") || null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const data = userDoc.data();
        if (data) {
          const sess = { uid: user.uid, email: user.email, role: data.role || "user", profile: data.profile || null };
          setSession(sess);
          setNeedsProfile(!data.profile && data.role !== "owner");
        } else {
          setSession(null);
        }
      } else {
        setSession(null);
      }
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  const handleAuth = (sess) => {
    setSession(sess);
    setNeedsProfile(sess.isNew || (!sess.profile && sess.role !== "owner"));
  };

  const handleProfileComplete = (profile) => {
    setSession(prev => ({ ...prev, profile }));
    setNeedsProfile(false);
  };
  useEffect(() => {
    const q = queryFirestore(collection(db, "lectures"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, snap => {
      if (snap.docs.length > 0) {
        const latest = snap.docs[0].id;
        if (lastSeenLecture.current !== latest) setNewLectures(true);
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    const q = queryFirestore(collection(db, "notices"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, snap => {
      if (snap.docs.length > 0) {
        const latest = snap.docs[0].id;
        if (lastSeenNotice.current !== latest) setNewNotices(true);
      }
    });
    return unsub;
  }, []);
  useEffect(() => {
    const handleBackButton = () => {
      if (page === "search") {
        setPage("lectures");
        window.history.pushState(null, "", window.location.href);
      } else {
        window.history.back();
      }
    };
    window.addEventListener("popstate", handleBackButton);
    window.history.pushState(null, "", window.location.href);
    return () => window.removeEventListener("popstate", handleBackButton);
  }, [page]);
  const handleLogout = () => { signOut(auth); setSession(null); setPage("lectures"); };

  const handleNavigate = (p) => {
    if (p === "lectures") {
      setNewLectures(false);
      if (lastSeenLecture.current) localStorage.setItem("lastSeenLecture", lastSeenLecture.current);
    }
    if (p === "notices") {
      setNewNotices(false);
      if (lastSeenNotice.current) localStorage.setItem("lastSeenNotice", lastSeenNotice.current);
    }
    setPage(p);
  };

  if (authLoading) return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: C.accent, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", fontSize: 22, fontWeight: 900, color: C.white }}>U</div>
        <div style={{ color: C.muted, fontSize: 14 }}>Loading…</div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: C.text, maxWidth: 768, margin: "0 auto", position: "relative" }}>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      {!session ? (
        <AuthScreen onAuth={handleAuth} setToast={setToast} />
      ) : needsProfile ? (
        <ProfileSetup session={session} onComplete={handleProfileComplete} setToast={setToast} />
      ) : (
        <>
          <Header session={session} onNavigate={handleNavigate} onLogout={handleLogout} />
          <div style={{ paddingBottom: 80 }}>
            {page === "lectures" && <LecturesScreen session={session} setToast={setToast} />}
            {page === "notices" && <NoticesScreen session={session} setToast={setToast} />}
            {page === "search" && <SearchScreen session={session} />}
            {page === "profile" && <ProfileScreen session={session} onUpdateSession={setSession} />}
            {page === "about" && <AboutScreen />}
          </div>
          <BottomNav page={page} onNavigate={handleNavigate} newLectures={newLectures} newNotices={newNotices} />
        </>
      )}
    </div>
  );
}
