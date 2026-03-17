import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase";

// ─── Theme ────────────────────────────────────────────────────────
const C = {
  bg: "#0A0F1E", card: "#111827", card2: "#1a2436",
  accent: "#F5A800", green: "#10B981", red: "#EF4444",
  blue: "#3B82F6", purple: "#8B5CF6", text: "#F1F5F9", muted: "#64748B",
  border: "rgba(255,255,255,0.07)",
};

// ─── Subjects & Levels ────────────────────────────────────────────
const SUBJECTS = [
  { id: "arabic",  label: "عربي",    emoji: "📖", color: "#F5A800", desc: "حروف وكلمات وجمل" },
  { id: "english", label: "English", emoji: "🔤", color: "#3B82F6", desc: "Letters, Words & Sentences" },
  { id: "math",    label: "رياضيات", emoji: "🔢", color: "#10B981", desc: "أرقام وحساب ومنطق" },
];

const LEVELS = [
  { id: "easy",   label: "سهل",   emoji: "🌱", color: "#10B981" },
  { id: "medium", label: "متوسط", emoji: "⭐", color: "#F5A800" },
  { id: "hard",   label: "صعب",   emoji: "🔥", color: "#EF4444" },
];

// ─── Lessons Content ──────────────────────────────────────────────
const LESSONS = {
  math: [
    {
      id: "addition_basics",
      title: "الجمع — ١ + ١",
      emoji: "➕",
      level: "easy",
      concept: "الجمع هو إضافة شيء إلى شيء آخر",
      examples: [
        { visual: ["🍎", "🍎"], op: "+", visual2: ["🍊"], result: "٣", equation: "٢ + ١ = ٣" },
        { visual: ["🚗", "🚗"], op: "+", visual2: ["🚗", "🚗"], result: "٤", equation: "٢ + ٢ = ٤" },
        { visual: ["⭐"], op: "+", visual2: ["⭐", "⭐", "⭐"], result: "٤", equation: "١ + ٣ = ٤" },
      ]
    },
    {
      id: "subtraction_basics",
      title: "الطرح — ٣ - ١",
      emoji: "➖",
      level: "easy",
      concept: "الطرح هو أخذ شيء من مجموعة",
      examples: [
        { visual: ["🍎", "🍎", "🍎"], op: "-", visual2: ["🍎"], result: "٢", equation: "٣ - ١ = ٢" },
        { visual: ["🚗", "🚗", "🚗", "🚗"], op: "-", visual2: ["🚗", "🚗"], result: "٢", equation: "٤ - ٢ = ٢" },
      ]
    },
  ],
  arabic: [
    {
      id: "alef_ba",
      title: "حرف الألف والباء",
      emoji: "أ",
      level: "easy",
      concept: "الحروف الهجائية هي أساس اللغة العربية",
      examples: [
        { visual: ["أَسَد"], op: "=", visual2: ["🦁"], result: "أ", equation: "أَ — أَسَد" },
        { visual: ["بَطَّة"], op: "=", visual2: ["🦆"], result: "ب", equation: "بَ — بَطَّة" },
        { visual: ["تُفَّاح"], op: "=", visual2: ["🍎"], result: "ت", equation: "تَ — تُفَّاح" },
      ]
    },
  ],
  english: [
    {
      id: "abc_basics",
      title: "The Alphabet — A B C",
      emoji: "🔤",
      level: "easy",
      concept: "The alphabet is the foundation of English",
      examples: [
        { visual: ["Apple"], op: "=", visual2: ["🍎"], result: "A", equation: "A — Apple 🍎" },
        { visual: ["Ball"], op: "=", visual2: ["⚽"], result: "B", equation: "B — Ball ⚽" },
        { visual: ["Cat"], op: "=", visual2: ["🐱"], result: "C", equation: "C — Cat 🐱" },
      ]
    },
  ],
};

// ─── Security ─────────────────────────────────────────────────────
function sanitize(str) {
  if (typeof str !== "string") return "";
  return str.replace(/[<>&"'`]/g, "").trim().slice(0, 100);
}
function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function validateQuestions(parsed) {
  if (!Array.isArray(parsed) || parsed.length < 1 || parsed.length > 10) return false;
  return parsed.every(q =>
    typeof q.q === "string" && q.q.length < 300 &&
    Array.isArray(q.opts) && q.opts.length === 4 &&
    q.opts.every(o => typeof o === "string" && o.length < 100) &&
    typeof q.ans === "number" && q.ans >= 0 && q.ans <= 3 &&
    !["<script", "javascript:", "onclick"].some(b => (q.q + q.opts.join("")).toLowerCase().includes(b))
  );
}

// ─── Sound ────────────────────────────────────────────────────────
function playSound(type) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const now = ctx.currentTime;
    if (type === "correct") {
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.type = "sine"; o.frequency.value = freq;
        g.gain.setValueAtTime(0, now + i * 0.1);
        g.gain.linearRampToValueAtTime(0.3, now + i * 0.1 + 0.04);
        g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.25);
        o.start(now + i * 0.1); o.stop(now + i * 0.1 + 0.25);
      });
    } else if (type === "wrong") {
      [349.23, 261.63].forEach((freq, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.type = "sawtooth";
        o.frequency.setValueAtTime(freq, now + i * 0.18);
        o.frequency.linearRampToValueAtTime(freq * 0.82, now + i * 0.18 + 0.22);
        g.gain.setValueAtTime(0.2, now + i * 0.18);
        g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.18 + 0.28);
        o.start(now + i * 0.18); o.stop(now + i * 0.18 + 0.3);
      });
    } else if (type === "complete") {
      [523, 659, 784, 659, 784, 1046].forEach((freq, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.type = "sine"; o.frequency.value = freq;
        g.gain.setValueAtTime(0.28, now + i * 0.1);
        g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.22);
        o.start(now + i * 0.1); o.stop(now + i * 0.1 + 0.22);
      });
    } else if (type === "click") {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.value = 880;
      g.gain.setValueAtTime(0.1, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
      o.start(now); o.stop(now + 0.07);
    }
  } catch {}
}

// ─── GA Events ───────────────────────────────────────────────────
function gaEvent(name, params = {}) {
  try { window.gtag?.("event", name, params); } catch {}
}

// ─── AI Prompt ────────────────────────────────────────────────────
const QTYPES = {
  arabic:  ["الحروف الهجائية", "الكلمات البسيطة", "الألوان", "الحيوانات", "الفواكه", "أفراد الأسرة"],
  english: ["alphabet letters", "simple words", "colors", "animals", "fruits", "action words"],
  math:    ["جمع ١-١٠", "طرح ١-١٠", "عد الأشياء", "مقارنة الأعداد", "الأشكال الهندسية"],
};
function buildPrompt(subjectId, age, levelId) {
  if (!QTYPES[subjectId]) return null;
  const topic = QTYPES[subjectId][Math.floor(Math.random() * QTYPES[subjectId].length)];
  const ageLabel = age === "young" ? "٣ إلى ٦ سنوات" : "٦ إلى ١٠ سنوات";
  const diff = { easy: "بسيطة جداً", medium: "متوسطة", hard: "صعبة" }[levelId] || "بسيطة";
  const base = {
    arabic: `أنت مساعد تعليمي للأطفال السودانيين. اصنع 5 أسئلة باللغة العربية لطفل عمره ${ageLabel}. الموضوع: ${topic}. الصعوبة: ${diff}.`,
    english: `Educational assistant for Sudanese children. Create 5 English questions for a child aged ${ageLabel}. Topic: ${topic}. Difficulty: ${diff}.`,
    math: `مساعد تعليمي. اصنع 5 أسئلة رياضيات لطفل عمره ${ageLabel}. الموضوع: ${topic}. الصعوبة: ${diff}.`,
  };
  return `${base[subjectId]}\n\nJSON فقط:\n[{"q":"سؤال","opts":["أ","ب","ج","د"],"ans":0,"img":"🎯"}]\n- ans = رقم الإجابة (0-3)\n- محتوى آمن 100% للأطفال\n- لا HTML أو روابط`;
}

// ─── UI Atoms ─────────────────────────────────────────────────────
const Btn = ({ children, onClick, color = C.accent, outline, disabled, style = {}, full }) => (
  <button
    onClick={() => { if (!disabled) { playSound("click"); onClick?.(); } }}
    disabled={disabled}
    style={{
      background: outline ? "transparent" : disabled ? "#2a3547" : color,
      border: `2px solid ${disabled ? "#2a3547" : color}`,
      color: outline ? color : disabled ? C.muted : "#000",
      borderRadius: 14, padding: "13px 24px", fontWeight: 800, fontSize: 15,
      cursor: disabled ? "not-allowed" : "pointer", fontFamily: "inherit",
      transition: "all 0.2s", width: full ? "100%" : undefined,
      opacity: disabled ? 0.5 : 1, ...style
    }}>{children}</button>
);

const Card = ({ children, style = {}, onClick }) => (
  <div onClick={onClick} style={{
    background: C.card2, borderRadius: 20, padding: 20,
    border: `1px solid ${C.border}`, ...style,
    cursor: onClick ? "pointer" : undefined,
  }}>{children}</div>
);

function Input({ label, type = "text", value, onChange, placeholder, maxLength = 100 }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {label && <label style={{ color: C.muted, fontSize: 13, direction: "rtl" }}>{label}</label>}
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} maxLength={maxLength}
        style={{
          background: C.bg, border: `1.5px solid ${C.border}`, borderRadius: 12,
          padding: "13px 16px", color: C.text, fontSize: 16, fontFamily: "inherit",
          outline: "none", direction: "rtl", width: "100%", boxSizing: "border-box",
        }}
        onFocus={e => e.target.style.borderColor = C.accent}
        onBlur={e => e.target.style.borderColor = C.border}
      />
    </div>
  );
}

function Avatar({ src, name, size = 44, color = C.accent }) {
  if (src) return <img src={src} alt="" style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", border: `2px solid ${color}` }} />;
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: color + "22", border: `2px solid ${color}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.42, fontWeight: 900, color }}>
      {name?.[0] || "؟"}
    </div>
  );
}

function Badge({ label, color }) {
  return <span style={{ background: color + "20", color, border: `1px solid ${color}40`, borderRadius: 99, padding: "3px 10px", fontSize: 12, fontWeight: 700 }}>{label}</span>;
}

function ProgressBar({ pct, color, height = 8 }) {
  return (
    <div style={{ background: "#1e2d45", borderRadius: 99, height, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${Math.min(100, Math.max(0, pct))}%`, background: color, borderRadius: 99, transition: "width 0.6s ease" }} />
    </div>
  );
}

// ─── Auth Screen ──────────────────────────────────────────────────
function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("login"); // login | otp
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  async function sendOTP() {
    const clean = sanitize(email).toLowerCase();
    if (!validateEmail(clean)) { setError("يرجى إدخال بريد إلكتروني صحيح"); return; }
    setLoading(true); setError("");
    const { error: err } = await supabase.auth.signInWithOtp({ email: clean, options: { shouldCreateUser: true } });
    setLoading(false);
    if (err) { setError("تعذر إرسال الرمز. حاول مجدداً."); return; }
    setMsg(`تم إرسال رمز التحقق إلى ${clean}`);
    setMode("otp");
    gaEvent("send_otp");
  }

  async function verifyOTP() {
    if (otp.length < 6) { setError("الرمز يجب أن يكون 6 أرقام"); return; }
    setLoading(true); setError("");
    const { data, error: err } = await supabase.auth.verifyOtp({ email: sanitize(email).toLowerCase(), token: otp, type: "email" });
    setLoading(false);
    if (err) { setError("رمز غير صحيح أو منتهي الصلاحية"); return; }
    gaEvent("login_success");
    onAuth(data.user);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28, padding: "10px 0" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 64, marginBottom: 8 }}>🇸🇩</div>
        <h1 style={{ color: C.accent, fontWeight: 900, fontSize: 32, margin: "0 0 4px" }}>فسحة</h1>
        <p style={{ color: C.muted, fontSize: 14, direction: "rtl" }}>منصة تعليمية مجانية للأطفال السودانيين</p>
      </div>

      <Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 18, direction: "rtl" }}>
          {mode === "login" ? (
            <>
              <div>
                <h2 style={{ color: C.text, fontWeight: 800, fontSize: 20, marginBottom: 4 }}>مرحباً! 👋</h2>
                <p style={{ color: C.muted, fontSize: 13 }}>سجّل دخولك بالبريد الإلكتروني</p>
              </div>
              <Input label="البريد الإلكتروني" type="email" value={email} onChange={setEmail} placeholder="example@gmail.com" />
              {error && <p style={{ color: C.red, fontSize: 13, margin: 0 }}>{error}</p>}
              <Btn onClick={sendOTP} disabled={loading || !email} full>
                {loading ? "جاري الإرسال..." : "📨 إرسال رمز التحقق"}
              </Btn>
              <p style={{ color: C.muted, fontSize: 12, textAlign: "center" }}>
                سيتم إرسال رمز مكون من 6 أرقام إلى بريدك
              </p>
            </>
          ) : (
            <>
              <div>
                <h2 style={{ color: C.text, fontWeight: 800, fontSize: 20, marginBottom: 4 }}>تحقق من بريدك ✉️</h2>
                <p style={{ color: C.muted, fontSize: 13 }}>{msg}</p>
              </div>
              <Input label="رمز التحقق (6 أرقام)" type="text" value={otp} onChange={v => setOtp(v.replace(/\D/g, "").slice(0, 6))} placeholder="123456" />
              {error && <p style={{ color: C.red, fontSize: 13, margin: 0 }}>{error}</p>}
              <Btn onClick={verifyOTP} disabled={loading || otp.length < 6} full>
                {loading ? "جاري التحقق..." : "✅ تأكيد الدخول"}
              </Btn>
              <button onClick={() => { setMode("login"); setError(""); setOtp(""); }} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>
                ← تغيير البريد الإلكتروني
              </button>
            </>
          )}
        </div>
      </Card>

      <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.green }} />
        <span style={{ color: C.muted, fontSize: 12 }}>تسجيل دخول آمن بدون كلمة مرور</span>
      </div>
    </div>
  );
}

// ─── Setup Profile ────────────────────────────────────────────────
function SetupProfile({ user, onSave }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function save() {
    const clean = sanitize(name);
    if (!clean) return;
    setLoading(true);
    await supabase.from("profiles").upsert({ id: user.id, email: user.email, parent_name: clean, created_at: new Date().toISOString() });
    setLoading(false);
    onSave({ id: user.id, email: user.email, parent_name: clean });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 52 }}>👨‍👩‍👧</div>
        <h2 style={{ color: C.text, fontWeight: 900, fontSize: 22, direction: "rtl", margin: "8px 0 4px" }}>أهلاً بك في فسحة!</h2>
        <p style={{ color: C.muted, fontSize: 13, direction: "rtl" }}>كيف نناديك؟</p>
      </div>
      <Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, direction: "rtl" }}>
          <Input label="اسمك (الأهل)" value={name} onChange={setName} placeholder="مثال: أم أحمد" maxLength={50} />
          <Btn onClick={save} disabled={loading || !sanitize(name)} full>
            {loading ? "جاري الحفظ..." : "✅ ابدأ الرحلة"}
          </Btn>
        </div>
      </Card>
    </div>
  );
}

// ─── Home ─────────────────────────────────────────────────────────
function HomeScreen({ profile, children, onAddChild, onSelectChild, onSignOut }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button onClick={onSignOut} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>خروج</button>
        <div style={{ textAlign: "right" }}>
          <div style={{ color: C.accent, fontWeight: 900, fontSize: 22 }}>فسحة 🇸🇩</div>
          <div style={{ color: C.muted, fontSize: 12 }}>أهلاً {profile?.parent_name}!</div>
        </div>
      </div>

      {children.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <p style={{ color: C.muted, fontSize: 13, direction: "rtl", textAlign: "center" }}>من يريد التعلم اليوم؟ 🌟</p>
          {children.map(child => (
            <button key={child.id} onClick={() => { playSound("click"); onSelectChild(child); }}
              style={{ background: C.card2, border: `2px solid rgba(245,168,0,0.15)`, borderRadius: 18, padding: "16px 20px", cursor: "pointer", color: C.text, display: "flex", alignItems: "center", justifyContent: "space-between", direction: "rtl", fontFamily: "inherit", transition: "all 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = C.accent}
              onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(245,168,0,0.15)"}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Avatar name={child.name} size={50} color={SUBJECTS.find(s => s.id === child.fav_subject)?.color || C.accent} />
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 800, fontSize: 17 }}>{child.name}</div>
                  <div style={{ color: C.muted, fontSize: 12 }}>{child.age === "young" ? "٣-٦ سنوات" : "٦-١٠ سنوات"}</div>
                </div>
              </div>
              <span style={{ fontSize: 22 }}>←</span>
            </button>
          ))}
        </div>
      ) : (
        <Card style={{ textAlign: "center", padding: 32 }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>👶</div>
          <p style={{ color: C.muted, direction: "rtl", fontSize: 14 }}>أضف طفلك الأول وابدأوا رحلة التعلم معاً!</p>
        </Card>
      )}

      <Btn onClick={onAddChild} full>+ إضافة طفل</Btn>
    </div>
  );
}

// ─── Add Child ────────────────────────────────────────────────────
function AddChildScreen({ onSave, onBack, userId }) {
  const [name, setName] = useState("");
  const [age, setAge] = useState("old");
  const [loading, setLoading] = useState(false);

  async function save() {
    const clean = sanitize(name);
    if (!clean) return;
    setLoading(true);
    const { data } = await supabase.from("children").insert({ parent_id: userId, name: clean, age, created_at: new Date().toISOString() }).select().single();
    setLoading(false);
    if (data) { gaEvent("add_child"); onSave(data); }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onBack} style={{ background: "rgba(255,255,255,0.07)", border: "none", color: C.text, borderRadius: 10, padding: "8px 14px", cursor: "pointer" }}>← رجوع</button>
        <h2 style={{ color: C.text, fontWeight: 800, direction: "rtl", margin: 0 }}>إضافة طفل</h2>
      </div>
      <Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 18, direction: "rtl" }}>
          <Input label="اسم الطفل" value={name} onChange={setName} placeholder="مثال: أحمد" maxLength={30} />
          <div>
            <label style={{ color: C.muted, fontSize: 13, display: "block", marginBottom: 8 }}>الفئة العمرية</label>
            <div style={{ display: "flex", gap: 10 }}>
              {[{ v: "young", l: "٣ - ٦ سنوات", e: "🧒" }, { v: "old", l: "٦ - ١٠ سنوات", e: "👦" }].map(a => (
                <button key={a.v} onClick={() => setAge(a.v)} style={{ flex: 1, background: age === a.v ? C.accent + "22" : C.bg, border: `2px solid ${age === a.v ? C.accent : C.border}`, borderRadius: 14, padding: "14px 10px", cursor: "pointer", color: age === a.v ? C.accent : C.muted, fontWeight: 700, fontSize: 14, fontFamily: "inherit", transition: "all 0.2s" }}>
                  <div style={{ fontSize: 26, marginBottom: 4 }}>{a.e}</div>{a.l}
                </button>
              ))}
            </div>
          </div>
          <Btn onClick={save} disabled={loading || !sanitize(name)} full>
            {loading ? "جاري الحفظ..." : "✅ حفظ"}
          </Btn>
        </div>
      </Card>
    </div>
  );
}

// ─── Subject Home ─────────────────────────────────────────────────
function SubjectHome({ child, onPickSubject, onBack }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button onClick={onBack} style={{ background: "rgba(255,255,255,0.07)", border: "none", color: C.text, borderRadius: 10, padding: "8px 14px", cursor: "pointer" }}>← رجوع</button>
        <div style={{ textAlign: "right" }}>
          <div style={{ color: C.text, fontWeight: 800, fontSize: 18 }}>أهلاً {child.name}! 👋</div>
          <div style={{ color: C.muted, fontSize: 12, direction: "rtl" }}>اختر مادة للتعلم</div>
        </div>
        <Avatar name={child.name} size={44} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {SUBJECTS.map(s => (
          <button key={s.id} onClick={() => { playSound("click"); onPickSubject(s); gaEvent("select_subject", { subject: s.id }); }}
            style={{ background: `linear-gradient(135deg,${s.color}15,${s.color}05)`, border: `2px solid ${s.color}33`, borderRadius: 20, padding: "20px 22px", cursor: "pointer", color: C.text, display: "flex", alignItems: "center", justifyContent: "space-between", direction: "rtl", fontFamily: "inherit", transition: "all 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = s.color; e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = s.color + "33"; e.currentTarget.style.transform = "none"; }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{ fontSize: 38 }}>{s.emoji}</span>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 900, fontSize: 20, color: s.color }}>{s.label}</div>
                <div style={{ fontSize: 12, color: C.muted }}>{s.desc}</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Badge label="درس" color={s.color} />
              <Badge label="اختبار" color={C.muted} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Subject Menu (Lesson or Quiz) ────────────────────────────────
function SubjectMenu({ subject, child, onLesson, onQuiz, onBack }) {
  const subjectLessons = LESSONS[subject.id] || [];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onBack} style={{ background: "rgba(255,255,255,0.07)", border: "none", color: C.text, borderRadius: 10, padding: "8px 14px", cursor: "pointer" }}>← رجوع</button>
        <span style={{ color: subject.color, fontWeight: 800, fontSize: 20 }}>{subject.emoji} {subject.label}</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {/* Lessons */}
        <div>
          <p style={{ color: C.muted, fontSize: 13, direction: "rtl", marginBottom: 10, fontWeight: 700 }}>📚 الدروس</p>
          {subjectLessons.length > 0 ? subjectLessons.map(lesson => (
            <Card key={lesson.id} onClick={() => { playSound("click"); onLesson(lesson); }}
              style={{ marginBottom: 10, border: `2px solid ${subject.color}22`, cursor: "pointer", transition: "all 0.2s" }}
              onMouseEnter={e => e.currentTarget && (e.currentTarget.style.borderColor = subject.color)}
              onMouseLeave={e => e.currentTarget && (e.currentTarget.style.borderColor = subject.color + "22")}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, direction: "rtl" }}>
                <div style={{ width: 50, height: 50, borderRadius: 14, background: subject.color + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>{lesson.emoji}</div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 800, fontSize: 16, color: C.text }}>{lesson.title}</div>
                  <div style={{ fontSize: 12, color: C.muted }}>{lesson.concept}</div>
                </div>
              </div>
            </Card>
          )) : (
            <Card style={{ textAlign: "center", padding: 20 }}>
              <p style={{ color: C.muted, fontSize: 13, direction: "rtl" }}>دروس قادمة قريباً! 🚀</p>
            </Card>
          )}
        </div>

        {/* Quiz */}
        <div>
          <p style={{ color: C.muted, fontSize: 13, direction: "rtl", marginBottom: 10, fontWeight: 700 }}>🎯 الاختبارات</p>
          <Card onClick={() => { playSound("click"); onQuiz(); }} style={{ border: `2px solid ${C.purple}33`, cursor: "pointer", transition: "all 0.2s" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, direction: "rtl" }}>
              <div style={{ width: 50, height: 50, borderRadius: 14, background: C.purple + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>🎮</div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 800, fontSize: 16, color: C.text }}>اختبار AI تفاعلي</div>
                <div style={{ fontSize: 12, color: C.muted }}>أسئلة تولّدها الذكاء الاصطناعي</div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── Lesson Screen ────────────────────────────────────────────────
function LessonScreen({ lesson, subject, child, onComplete, onBack }) {
  const [step, setStep] = useState(0); // 0=intro, 1..n=examples, last=summary
  const examples = lesson.examples || [];
  const totalSteps = examples.length + 2; // intro + examples + summary
  const isIntro = step === 0;
  const isSummary = step === totalSteps - 1;
  const example = examples[step - 1];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button onClick={onBack} style={{ background: "rgba(255,255,255,0.07)", border: "none", color: C.text, borderRadius: 10, padding: "8px 14px", cursor: "pointer" }}>← رجوع</button>
        <span style={{ color: subject.color, fontWeight: 700 }}>{lesson.emoji} {lesson.title}</span>
        <Badge label={`${step + 1}/${totalSteps}`} color={subject.color} />
      </div>

      <ProgressBar pct={((step + 1) / totalSteps) * 100} color={subject.color} height={8} />

      {isIntro && (
        <Card style={{ textAlign: "center", padding: 32, border: `2px solid ${subject.color}33` }}>
          <div style={{ fontSize: 72, marginBottom: 16 }}>{lesson.emoji}</div>
          <h2 style={{ color: subject.color, fontWeight: 900, fontSize: 24, direction: "rtl", marginBottom: 12 }}>{lesson.title}</h2>
          <p style={{ color: C.text, fontSize: 16, direction: "rtl", lineHeight: 1.7 }}>{lesson.concept}</p>
        </Card>
      )}

      {!isIntro && !isSummary && example && (
        <Card style={{ border: `2px solid ${subject.color}33` }}>
          <p style={{ color: C.muted, fontSize: 13, direction: "rtl", textAlign: "center", marginBottom: 16 }}>مثال {step} من {examples.length}</p>
          <div style={{ textAlign: "center" }}>
            {/* Visual equation */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "center" }}>
                {example.visual.map((v, i) => <span key={i} style={{ fontSize: 36 }}>{v}</span>)}
              </div>
              <span style={{ fontSize: 32, color: subject.color, fontWeight: 900 }}>{example.op}</span>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "center" }}>
                {example.visual2.map((v, i) => <span key={i} style={{ fontSize: 36 }}>{v}</span>)}
              </div>
            </div>
            {/* Equation */}
            <div style={{ background: subject.color + "15", borderRadius: 16, padding: "16px 24px", display: "inline-block" }}>
              <span style={{ color: subject.color, fontWeight: 900, fontSize: 28, fontFamily: "Cairo, sans-serif" }}>{example.equation}</span>
            </div>
          </div>
        </Card>
      )}

      {isSummary && (
        <Card style={{ textAlign: "center", padding: 32, border: `2px solid ${C.green}44` }}>
          <div style={{ fontSize: 64, marginBottom: 12 }}>🎉</div>
          <h2 style={{ color: C.green, fontWeight: 900, fontSize: 22, direction: "rtl", marginBottom: 8 }}>أحسنت! انتهى الدرس</h2>
          <p style={{ color: C.muted, direction: "rtl", fontSize: 14 }}>الآن جاهز للاختبار؟</p>
        </Card>
      )}

      <div style={{ display: "flex", gap: 10 }}>
        {step > 0 && <Btn onClick={() => setStep(s => s - 1)} outline color={C.muted} style={{ flex: 1, color: C.muted }}>← السابق</Btn>}
        {!isSummary
          ? <Btn onClick={() => { playSound("correct"); setStep(s => s + 1); }} style={{ flex: 1 }}>التالي →</Btn>
          : <Btn onClick={onComplete} color={C.green} style={{ flex: 1 }}>🎯 ابدأ الاختبار</Btn>
        }
      </div>
      <style>{`@keyframes popIn{from{transform:scale(0.5);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
    </div>
  );
}

// ─── Level Selector ───────────────────────────────────────────────
function LevelSelector({ subject, onSelect, onBack }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onBack} style={{ background: "rgba(255,255,255,0.07)", border: "none", color: C.text, borderRadius: 10, padding: "8px 14px", cursor: "pointer" }}>← رجوع</button>
        <span style={{ color: subject.color, fontWeight: 700, fontSize: 18 }}>{subject.emoji} اختر المستوى</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {LEVELS.map(lv => (
          <button key={lv.id} onClick={() => { playSound("click"); onSelect(lv); gaEvent("select_level", { level: lv.id }); }}
            style={{ background: `linear-gradient(135deg,${lv.color}18,${lv.color}06)`, border: `2px solid ${lv.color}44`, borderRadius: 20, padding: "20px 24px", cursor: "pointer", color: C.text, display: "flex", alignItems: "center", gap: 16, direction: "rtl", fontFamily: "inherit", transition: "all 0.25s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = lv.color; e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = lv.color + "44"; e.currentTarget.style.transform = "none"; }}>
            <span style={{ fontSize: 40 }}>{lv.emoji}</span>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontWeight: 900, fontSize: 20, color: lv.color }}>{lv.label}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Loading ──────────────────────────────────────────────────────
function LoadingScreen({ subject }) {
  return (
    <div style={{ textAlign: "center", padding: "60px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
      <div style={{ fontSize: 64, animation: "spin 2s linear infinite" }}>{subject.emoji}</div>
      <p style={{ color: subject.color, fontWeight: 700, fontSize: 20, direction: "rtl" }}>Claude AI يحضّر أسئلتك…</p>
      <div style={{ display: "flex", gap: 8 }}>
        {[0, 1, 2].map(i => <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: subject.color, animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />)}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes pulse{0%,100%{transform:scale(0.6);opacity:0.4}50%{transform:scale(1.2);opacity:1}}`}</style>
    </div>
  );
}

// ─── Quiz ─────────────────────────────────────────────────────────
function QuizScreen({ subject, level, questions, onBack, onComplete }) {
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [shake, setShake] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const q = questions[idx];
  const isRTL = subject.id !== "english";

  function choose(i) {
    if (selected !== null) return;
    const correct = i === q.ans;
    setSelected(i); setFeedback(correct ? "correct" : "wrong");
    playSound(correct ? "correct" : "wrong");
    if (correct) setScore(s => s + 1);
    else { setShake(true); setTimeout(() => setShake(false), 500); }
    setTimeout(() => {
      setFeedback(null);
      if (idx + 1 < questions.length) { setIdx(idx + 1); setSelected(null); }
      else { playSound("complete"); onComplete(score + (correct ? 1 : 0)); }
    }, 1400);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button onClick={onBack} style={{ background: "rgba(255,255,255,0.07)", border: "none", color: C.text, borderRadius: 10, padding: "8px 14px", cursor: "pointer" }}>← رجوع</button>
        <Badge label={`${level.emoji} ${level.label}`} color={level.color} />
        <span style={{ background: subject.color + "22", color: subject.color, borderRadius: 10, padding: "6px 12px", fontWeight: 700, fontSize: 13 }}>{idx + 1}/{questions.length}</span>
      </div>
      <ProgressBar pct={((idx + 1) / questions.length) * 100} color={subject.color} height={10} />
      <Card style={{ textAlign: "center", animation: shake ? "shake 0.5s" : "none", border: `2px solid ${subject.color}33` }}>
        {feedback && <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 6, color: feedback === "correct" ? C.green : C.red }}>{feedback === "correct" ? "✅ ممتاز!" : "❌ حاول مرة أخرى!"}</div>}
        <div style={{ fontSize: 56, marginBottom: 10 }}>{q.img}</div>
        <p style={{ fontSize: 20, fontWeight: 700, color: C.text, direction: isRTL ? "rtl" : "ltr", lineHeight: 1.5, margin: 0 }}>{q.q}</p>
      </Card>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {q.opts.map((opt, i) => {
          let bg = C.card2, border = `2px solid ${C.border}`, color = C.text;
          if (selected !== null) {
            if (i === q.ans) { bg = "#10B98120"; border = "2px solid #10B981"; color = C.green; }
            else if (i === selected) { bg = "#EF444420"; border = "2px solid #EF4444"; color = C.red; }
          }
          return <button key={i} onClick={() => choose(i)} style={{ background: bg, border, color, borderRadius: 16, padding: "16px 10px", fontSize: isRTL ? 18 : 16, fontWeight: 700, cursor: selected ? "default" : "pointer", transition: "all 0.25s", direction: isRTL ? "rtl" : "ltr", fontFamily: "inherit", minHeight: 58 }}>{opt}</button>;
        })}
      </div>
      <style>{`@keyframes shake{0%,100%{transform:translateX(0)}25%,75%{transform:translateX(-8px)}50%{transform:translateX(8px)}}`}</style>
    </div>
  );
}

// ─── Result ───────────────────────────────────────────────────────
function ResultScreen({ score, total, subject, level, child, onRetry, onHome }) {
  const pct = Math.round((score / total) * 100);
  const stars = pct === 100 ? 5 : pct >= 80 ? 4 : pct >= 60 ? 3 : pct >= 40 ? 2 : 1;
  const msg = pct === 100 ? "مثالي! أنت نجم! 🌟" : pct >= 60 ? "أحسنت! استمر! 💪" : "لا تستسلم! 🔄";

  useEffect(() => { gaEvent("complete_session", { subject: subject.id, level: level.id, score: pct }); }, []);

  return (
    <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
      <div style={{ fontSize: 72 }}>{pct === 100 ? "🏆" : pct >= 60 ? "🎉" : "💡"}</div>
      <div style={{ display: "flex", gap: 4 }}>
        {[...Array(5)].map((_, i) => <span key={i} style={{ opacity: i < stars ? 1 : 0.2, fontSize: 24 }}>⭐</span>)}
      </div>
      <h2 style={{ fontSize: 22, color: subject.color, margin: 0, direction: "rtl" }}>{msg}</h2>
      <Card style={{ padding: "20px 30px", border: `2px solid ${subject.color}44`, width: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-around", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 40, fontWeight: 900, color: subject.color }}>{score}/{total}</div>
            <div style={{ color: C.muted, fontSize: 13, direction: "rtl" }}>إجابة صحيحة</div>
          </div>
          <div style={{ width: 1, height: 50, background: C.border }} />
          <div>
            <div style={{ fontSize: 40, fontWeight: 900, color: level.color }}>{pct}%</div>
            <Badge label={`${level.emoji} ${level.label}`} color={level.color} />
          </div>
        </div>
      </Card>
      <div style={{ display: "flex", gap: 10, width: "100%" }}>
        <Btn onClick={onRetry} style={{ flex: 1 }}>🔄 مجدداً</Btn>
        <Btn onClick={onHome} outline color={C.muted} style={{ flex: 1, color: C.muted }}>🏠 الرئيسية</Btn>
      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [children, setChildren] = useState([]);
  const [screen, setScreen] = useState("auth");
  const [activeChild, setActiveChild] = useState(null);
  const [activeSubject, setActiveSubject] = useState(null);
  const [activeLevel, setActiveLevel] = useState(null);
  const [activeLesson, setActiveLesson] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [finalScore, setFinalScore] = useState(0);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check session on load
  useEffect(() => {
    // Handle magic link token in URL hash
    const hashParams = new URLSearchParams(window.location.hash.replace("#", "?"));
    const accessToken = hashParams.get("access_token");
    const refreshToken = hashParams.get("refresh_token");

    async function init() {
      if (accessToken && refreshToken) {
        // Set session from magic link
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        // Clean URL
        window.history.replaceState(null, "", window.location.pathname);
        if (data?.user && !error) {
          setUser(data.user);
          await loadProfile(data.user);
          setLoading(false);
          return;
        }
      }
      // Normal session check
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        await loadProfile(session.user);
      } else {
        setScreen("auth");
      }
      setLoading(false);
    }

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        setUser(session.user);
        await loadProfile(session.user);
        setLoading(false);
      } else if (event === "SIGNED_OUT") {
        setUser(null); setProfile(null); setChildren([]); setScreen("auth");
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function loadProfile(u) {
    const { data: prof } = await supabase.from("profiles").select("*").eq("id", u.id).single();
    if (prof) {
      setProfile(prof);
      const { data: kids } = await supabase.from("children").select("*").eq("parent_id", u.id);
      setChildren(kids || []);
      setScreen("home");
    } else {
      setScreen("setup");
    }
  }

  const fetchQuestions = useCallback(async (subject, level) => {
    if (!SUBJECTS.find(s => s.id === subject.id)) return;
    if (!LEVELS.find(l => l.id === level.id)) return;
    setActiveSubject(subject); setActiveLevel(level);
    setScreen("loading"); setError(null);
    const prompt = buildPrompt(subject.id, activeChild?.age || "old", level.id);
    if (!prompt) { setError("خطأ في بناء الطلب"); setScreen("error"); return; }
    try {
      const res = await fetch("/api/ask", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, messages: [{ role: "user", content: prompt }] }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data?.content?.[0]?.text) throw new Error("Empty");
      const jsonStr = data.content[0].text.replace(/```json|```/gi, "").trim();
      if (jsonStr.length > 10000) throw new Error("Too large");
      const parsed = JSON.parse(jsonStr);
      if (!validateQuestions(parsed)) throw new Error("Invalid");
      setQuestions(parsed);
      setScreen("quiz");
    } catch {
      setError("مشكلة في توليد الأسئلة. تأكد من الاتصال.");
      setScreen("error");
    }
  }, [activeChild]);

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  function handleComplete(score) {
    setFinalScore(score);
    // Save session to Supabase
    if (activeChild?.id) {
      supabase.from("sessions").insert({
        child_id: activeChild.id,
        subject_id: activeSubject.id,
        level_id: activeLevel.id,
        score,
        total: questions.length,
        pct: Math.round((score / questions.length) * 100),
        created_at: new Date().toISOString(),
      });
    }
    setScreen("result");
  }

  if (loading) return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 52, animation: "spin 2s linear infinite" }}>🇸🇩</div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Tajawal','Cairo','Segoe UI',sans-serif", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 480, background: C.card, borderRadius: 32, padding: 26, boxShadow: "0 32px 100px rgba(0,0,0,0.6)", border: `1px solid ${C.border}` }}>

        {screen === "auth"    && <AuthScreen onAuth={async (u) => { setUser(u); await loadProfile(u); }} />}
        {screen === "setup"   && user && <SetupProfile user={user} onSave={p => { setProfile(p); setScreen("home"); }} />}
        {screen === "home"    && <HomeScreen profile={profile} children={children} onAddChild={() => setScreen("addChild")} onSelectChild={c => { setActiveChild(c); setScreen("subjects"); }} onSignOut={handleSignOut} />}
        {screen === "addChild" && user && <AddChildScreen userId={user.id} onSave={c => { setChildren(prev => [...prev, c]); setScreen("home"); }} onBack={() => setScreen("home")} />}
        {screen === "subjects" && activeChild && <SubjectHome child={activeChild} onPickSubject={s => { setActiveSubject(s); setScreen("subjectMenu"); }} onBack={() => setScreen("home")} />}
        {screen === "subjectMenu" && activeSubject && activeChild && <SubjectMenu subject={activeSubject} child={activeChild} onLesson={l => { setActiveLesson(l); setScreen("lesson"); }} onQuiz={() => setScreen("levels")} onBack={() => setScreen("subjects")} />}
        {screen === "lesson"  && activeLesson && activeSubject && <LessonScreen lesson={activeLesson} subject={activeSubject} child={activeChild} onComplete={() => setScreen("levels")} onBack={() => setScreen("subjectMenu")} />}
        {screen === "levels"  && activeSubject && <LevelSelector subject={activeSubject} onSelect={lv => fetchQuestions(activeSubject, lv)} onBack={() => setScreen("subjectMenu")} />}
        {screen === "loading" && activeSubject && <LoadingScreen subject={activeSubject} />}
        {screen === "quiz"    && questions.length > 0 && activeSubject && activeLevel && <QuizScreen subject={activeSubject} level={activeLevel} questions={questions} onBack={() => setScreen("levels")} onComplete={handleComplete} />}
        {screen === "result"  && activeSubject && activeLevel && activeChild && <ResultScreen score={finalScore} total={questions.length} subject={activeSubject} level={activeLevel} child={activeChild} onRetry={() => fetchQuestions(activeSubject, activeLevel)} onHome={() => setScreen("subjects")} />}
        {screen === "error"   && (
          <div style={{ textAlign: "center", padding: 32, display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
            <div style={{ fontSize: 56 }}>😕</div>
            <p style={{ color: C.red, fontWeight: 700, direction: "rtl" }}>{error}</p>
            <div style={{ display: "flex", gap: 10 }}>
              <Btn onClick={() => fetchQuestions(activeSubject, activeLevel)}>🔄 حاول مجدداً</Btn>
              <Btn onClick={() => setScreen("subjects")} outline color={C.muted} style={{ color: C.muted }}>رجوع</Btn>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
