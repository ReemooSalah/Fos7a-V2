import { useState, useCallback } from "react";

const AGE_GROUPS = [
  { id: "3-5",   label: "٣ - ٥ سنوات",  emoji: "🌱", color: "#FF9F43", desc: "روضة" },
  { id: "6-8",   label: "٦ - ٨ سنوات",  emoji: "🌿", color: "#48DBFB", desc: "الصف الأول والثاني" },
  { id: "9-11",  label: "٩ - ١١ سنة",   emoji: "🌳", color: "#FF6B9D", desc: "الصف الثالث والرابع" },
  { id: "12-14", label: "١٢ - ١٤ سنة",  emoji: "🚀", color: "#A29BFE", desc: "الصف الخامس والسادس" },
];

const SUBJECTS = [
  { id: "arabic",  label: "اللغة العربية",     emoji: "📖" },
  { id: "english", label: "اللغة الإنجليزية",  emoji: "🔤" },
  { id: "math",    label: "الرياضيات",          emoji: "🔢" },
];

const CONTENT_TYPES = [
  { id: "letters",  label: "الحروف",       emoji: "✍️" },
  { id: "lesson",   label: "درس تعليمي",   emoji: "📚" },
  { id: "story",    label: "قصة قصيرة",    emoji: "📖" },
  { id: "quiz",     label: "اختبار قصير",  emoji: "🎯" },
  { id: "activity", label: "نشاط تفاعلي",  emoji: "🎨" },
];

function buildSystemPrompt(ageGroup, subject, contentType) {
  const ageInstructions = {
    "3-5": `أنت معلم متخصص للأطفال من عمر 3-5 سنوات (مرحلة الروضة).
- استخدم جملاً قصيرة جداً (3-5 كلمات)
- استخدم كلمات بسيطة ومألوفة جداً
- أضف إيموجي كثيرة لجعل المحتوى ممتعاً 🎉
- ركّز على الحواس: الألوان، الأشكال، الأصوات
- لا تستخدم مصطلحات معقدة أبداً`,
    "6-8": `أنت معلم متخصص للأطفال من عمر 6-8 سنوات.
- استخدم جملاً قصيرة ومفهومة
- قدّم أمثلة من الحياة اليومية
- استخدم القصص القصيرة لشرح المفاهيم
- أضف أسئلة بسيطة لتشجيع التفكير`,
    "9-11": `أنت معلم متخصص للأطفال من عمر 9-11 سنة.
- استخدم لغة واضحة مع مصطلحات أساسية
- اشرح المفاهيم بأمثلة متعددة
- شجّع على التفكير النقدي
- أضف تحديات بسيطة`,
    "12-14": `أنت معلم متخصص للطلاب من عمر 12-14 سنة.
- استخدم لغة أكاديمية مناسبة
- قدّم شرحاً متعمقاً للمفاهيم
- ربط المعلومات بالسياق الأوسع
- تحدّ الطالب بأسئلة تحليلية`,
  };

  const subjectInstructions = {
    arabic:  "المادة: اللغة العربية. ركّز على الحروف والمفردات والقواعد البسيطة حسب المستوى.",
    english: "المادة: اللغة الإنجليزية. استخدم العربية للشرح مع تقديم المحتوى الإنجليزي.",
    math:    "المادة: الرياضيات. قدّم الأعداد والعمليات بطريقة بصرية وممتعة.",
  };

  const contentInstructions = {
    letters:  `اكتب محتوى عن حرف أو مجموعة حروف. تضمّن: الحرف بشكله، كلمات تبدأ به (3-5)، جملة قصيرة، نشاط بسيط.`,
    lesson:   `صمّم درساً تعليمياً: عنوان + أهداف (2-3) + شرح تفصيلي + أمثلة تطبيقية + ملخص.`,
    story:    `اكتب قصة قصيرة تعليمية: عنوان جذاب + شخصيات محببة + حبكة بسيطة + سؤال للتفكير.`,
    quiz:     `صمّم اختباراً قصيراً: 5 أسئلة متنوعة (اختيار + صح/خطأ + تكميل) + الإجابات + تشجيع.`,
    activity: `صمّم نشاطاً تفاعلياً: اسم النشاط + الهدف + الخطوات + معيار النجاح.`,
  };

  return `${ageInstructions[ageGroup]}

${subjectInstructions[subject]}

${contentInstructions[contentType]}

قواعد مهمة:
- اكتب بالعربية الفصحى البسيطة
- نسّق المحتوى بشكل جميل باستخدام رموز ✅ ⭐ 🌟 💡
- اجعل المحتوى ممتعاً وتفاعلياً
- ابدأ مباشرة بالمحتوى بدون مقدمة`;
}

async function generateContent(ageGroup, subject, contentType, customPrompt) {
  const systemPrompt = buildSystemPrompt(ageGroup, subject, contentType);
  const subjectLabel = SUBJECTS.find(s => s.id === subject)?.label;
  const ageLabel = AGE_GROUPS.find(a => a.id === ageGroup)?.label;
  const typeLabel = CONTENT_TYPES.find(c => c.id === contentType)?.label;
  const userMessage = customPrompt || `ولّد ${typeLabel} في مادة ${subjectLabel} لأطفال ${ageLabel}`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || "خطأ في التوليد");
  return data.content?.[0].[0]?.text || "";
}

export default function FOS7AAgent() {
  const [ageGroup, setAgeGroup]         = useState("3-5");
  const [subject, setSubject]           = useState("arabic");
  const [contentType, setContentType]   = useState("letters");
  const [customPrompt, setCustomPrompt] = useState("");
  const [result, setResult]             = useState("");
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState("");
  const [history, setHistory]           = useState([]);
  const [copied, setCopied]             = useState(false);

  const handleGenerate = useCallback(async () => {
    setLoading(true);
    setError("");
    setResult("");
    try {
      const content = await generateContent(ageGroup, subject, contentType, customPrompt);
      setResult(content);
      const ag = AGE_GROUPS.find(a => a.id === ageGroup);
      const s  = SUBJECTS.find(s => s.id === subject);
      const ct = CONTENT_TYPES.find(c => c.id === contentType);
      setHistory(prev => [{
        ageGroup, subject, contentType, content,
        label: `${s?.emoji} ${ag?.label} — ${ct?.label}`,
        time: new Date().toLocaleTimeString("ar-EG"),
        color: ag?.color,
      }, ...prev.slice(0, 4)]);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [ageGroup, subject, contentType, customPrompt]);

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const selectedAge = AGE_GROUPS.find(a => a.id === ageGroup);
  const accentColor = selectedAge?.color || "#FF9F43";

  return (
    <div dir="rtl" style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #0d0d1a 0%, #1a1a2e 50%, #16213e 100%)",
      fontFamily: "'Segoe UI', Tahoma, Arial, sans-serif",
      padding: "28px 16px 40px",
      color: "#fff",
    }}>
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <div style={{ fontSize: 52, marginBottom: 4 }}>🌟</div>
        <h1 style={{
          fontSize: 28, fontWeight: 900, margin: "0 0 6px",
          background: `linear-gradient(90deg, ${accentColor}, #FF6B9D, #48DBFB)`,
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>
          فُسحة — محرك المحتوى
        </h1>
        <p style={{ color: "#7070a0", fontSize: 13, margin: 0 }}>
          Agent ذكي يولّد محتوى تعليمياً مخصصاً لكل طفل
        </p>
      </div>

      <div style={{ maxWidth: 700, margin: "0 auto" }}>
        <Card>
          <Label>👶 الفئة العمرية</Label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
            {AGE_GROUPS.map(ag => (
              <button key={ag.id} onClick={() => setAgeGroup(ag.id)} style={{
                padding: "14px 10px", borderRadius: 14,
                border: `2px solid ${ageGroup === ag.id ? ag.color : "rgba(255,255,255,0.08)"}`,
                background: ageGroup === ag.id ? `${ag.color}18` : "rgba(255,255,255,0.03)",
                color: ageGroup === ag.id ? ag.color : "#999",
                cursor: "pointer", textAlign: "center",
                transition: "all 0.2s", fontFamily: "inherit",
              }}>
                <div style={{ fontSize: 22 }}>{ag.emoji}</div>
                <div style={{ fontSize: 13, fontWeight: 700, margin: "4px 0 2px" }}>{ag.label}</div>
                <div style={{ fontSize: 11, opacity: 0.7 }}>{ag.desc}</div>
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <Label>📚 المادة الدراسية</Label>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {SUBJECTS.map(s => (
              <Chip key={s.id} label={`${s.emoji} ${s.label}`}
                active={subject === s.id} color={accentColor}
                onClick={() => setSubject(s.id)} />
            ))}
          </div>
        </Card>

        <Card>
          <Label>✨ نوع المحتوى</Label>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {CONTENT_TYPES.map(c => (
              <Chip key={c.id} label={`${c.emoji} ${c.label}`}
                active={contentType === c.id} color={accentColor}
                onClick={() => setContentType(c.id)} />
            ))}
          </div>
        </Card>

        <Card>
          <Label>💬 طلب مخصص (اختياري)</Label>
          <textarea
            value={customPrompt}
            onChange={e => setCustomPrompt(e.target.value)}
            placeholder="مثال: درس عن حرف الباء مع كلمات من عالم الحيوانات..."
            style={{
              width: "100%", minHeight: 72, padding: "12px 14px",
              borderRadius: 12, resize: "vertical",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "#e0e0f0", fontSize: 14, outline: "none",
              fontFamily: "inherit", lineHeight: 1.6, boxSizing: "border-box",
            }}
          />
        </Card>

        <button onClick={handleGenerate} disabled={loading} style={{
          width: "100%", padding: "17px", borderRadius: 16, border: "none",
          background: loading ? "rgba(255,255,255,0.08)" : `linear-gradient(135deg, ${accentColor} 0%, #FF6B9D 100%)`,
          color: loading ? "#666" : "#fff", fontSize: 17, fontWeight: 800,
          cursor: loading ? "not-allowed" : "pointer", marginBottom: 24,
          boxShadow: loading ? "none" : `0 8px 28px ${accentColor}40`,
          transition: "all 0.3s", fontFamily: "inherit",
        }}>
          {loading ? "⏳ جاري التوليد..." : "✨ ولّد المحتوى الآن"}
        </button>

        {error && (
          <div style={{
            background: "rgba(255,71,87,0.15)", border: "1px solid rgba(255,71,87,0.3)",
            borderRadius: 12, padding: "14px 18px", marginBottom: 20,
            color: "#ff6b6b", textAlign: "center", fontSize: 14,
          }}>
            ⚠️ {error}
          </div>
        )}

        {result && (
          <div style={{
            background: "rgba(255,255,255,0.05)",
            border: `1px solid ${accentColor}33`,
            borderRadius: 20, padding: 24, marginBottom: 24,
          }}>
            <div style={{
              display: "flex", justifyContent: "space-between",
              alignItems: "center", marginBottom: 18,
              borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: 14,
            }}>
              <span style={{ color: accentColor, fontWeight: 800, fontSize: 15 }}>🎉 المحتوى المُولَّد</span>
              <button onClick={handleCopy} style={{
                background: copied ? `${accentColor}22` : "rgba(255,255,255,0.08)",
                border: `1px solid ${copied ? accentColor : "rgba(255,255,255,0.12)"}`,
                borderRadius: 8, padding: "6px 14px",
                color: copied ? accentColor : "#aaa",
                cursor: "pointer", fontSize: 12, fontFamily: "inherit",
              }}>
                {copied ? "✅ تم النسخ" : "📋 نسخ"}
              </button>
            </div>
            <div style={{ whiteSpace: "pre-wrap", lineHeight: 2.2, fontSize: 15, color: "#dde0f0" }}>
              {result}
            </div>
          </div>
        )}

        {history.length > 0 && (
          <Card>
            <Label>🕐 آخر المحتويات المُولَّدة</Label>
            {history.map((h, i) => (
              <div key={i} onClick={() => setResult(h.content)} style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 10, padding: "11px 14px", marginBottom: 8,
                cursor: "pointer", display: "flex",
                justifyContent: "space-between", alignItems: "center",
              }}>
                <span style={{ fontSize: 13, color: h.color || "#ccc" }}>{h.label}</span>
                <span style={{ fontSize: 11, color: "#555" }}>{h.time}</span>
              </div>
            ))}
          </Card>
        )}
      </div>
    </div>
  );
}

function Card({ children }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 18, padding: "18px 20px", marginBottom: 16,
    }}>
      {children}
    </div>
  );
}

function Label({ children }) {
  return (
    <div style={{ fontSize: 13, fontWeight: 700, color: "#8080b0", marginBottom: 12 }}>
      {children}
    </div>
  );
}

function Chip({ label, active, color, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: "9px 18px", borderRadius: 100,
      border: `2px solid ${active ? color : "rgba(255,255,255,0.1)"}`,
      background: active ? `${color}18` : "rgba(255,255,255,0.04)",
      color: active ? color : "#999",
      cursor: "pointer", fontSize: 13,
      fontWeight: active ? 700 : 400,
      transition: "all 0.2s", fontFamily: "inherit",
    }}>
      {label}
    </button>
  );
}
