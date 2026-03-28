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
        time: new Date().toLocaleTimeString("ar-E
