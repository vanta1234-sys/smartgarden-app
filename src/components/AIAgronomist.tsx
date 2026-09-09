import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  Sprout, 
  AlertCircle, 
  CheckCircle2, 
  Droplets, 
  Sun, 
  RotateCcw,
  Stethoscope,
  MessageSquare,
  ChevronRight
} from 'lucide-react';
import { ChatMessage, Language } from '../types';
import { AGRONOMIST_QUICK_PROMPTS } from '../data/mockData';

interface AIAgronomistProps {
  lang: Language;
  onOpenTelemetry: () => void;
}

export const AIAgronomist: React.FC<AIAgronomistProps> = ({ lang, onOpenTelemetry }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'bot',
      text: lang === 'el'
        ? 'Γεια σας! Είμαι ο AI Γεωπόνος του SmartGarden.gr. Μπορώ να διαγνώσω ασθένειες φυτών, να προτείνω δοσολογίες ποτίσματος με βάση τη σημερινή εξάτμιση, ή να σας βοηθήσω να φτιάξετε τον ιδανικό λαχανόκηπο στο μπαλκόνι σας. Τι φυτό σας απασχολεί σήμερα;'
        : 'Hello! I am SmartGarden.gr\'s AI Agronomist. I can diagnose plant diseases, calculate irrigation doses based on today\'s local evapotranspiration, or guide your balcony gardening setup. How can I help with your plants today?',
      timestamp: '12:00'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Diagnostic Wizard State
  const [selectedPlant, setSelectedPlant] = useState('gardenia');
  const [selectedSymptom, setSelectedSymptom] = useState('yellow_leaves');
  const [selectedSun, setSelectedSun] = useState('full_sun');
  const [diagnosisResult, setDiagnosisResult] = useState<any>(null);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setIsTyping(true);

    // Dynamic Botanical AI Response Generator
    setTimeout(() => {
      let botResponse = '';
      const lower = text.toLowerCase();

      if (lower.includes('γαρδένι') || lower.includes('gardenia') || lower.includes('κίτριν') || lower.includes('yellow')) {
        botResponse = lang === 'el'
          ? `🌿 **Διάγνωση για Γαρδένια / Χλώρωση:**\n\n1. **Αιτία:** Τα κίτρινα φύλλα με πράσινα νεύρα οφείλονται σε έλλειψη σιδήρου (Χλώρωση), επειδή το σκληρό νερό της βρύσης ανεβάζει το pH του χώματος.\n\n2. **Άμεση Λύση:**\n• Εφαρμόστε **Χηλικό Σίδηρο EDDHA** (1 κουταλάκι σε 2 λίτρα νερό) μία φορά κάθε 15 ημέρες.\n• Αδειάζετε πάντα το πιατάκι 10 λεπτά μετά το πότισμα για να μην σαπίσουν οι ρίζες.\n• Μεταφέρετε τη γαρδένια σε σημείο με πρωινό φως και προστασία από τον καυτό μεσημεριανό ήλιο.`
          : `🌿 **Gardenia Diagnosis / Iron Chlorosis:**\n\n1. **Cause:** Yellowing leaf blade with vivid green veins indicates Iron Chlorosis caused by alkaline tap water raising soil pH.\n\n2. **Action Plan:**\n• Apply **EDDHA Chelated Iron** (1 teaspoon in 2L water) every 14 days.\n• Empty drainage saucers 10 minutes after watering to prevent root rot.\n• Relocate to morning sun with afternoon shade.`;
      } else if (lower.includes('πότισ') || lower.includes('water') || lower.includes('εξάτμισ') || lower.includes('λίτρ')) {
        botResponse = lang === 'el'
          ? `💧 **Υπολογισμός Ποτίσματος (Σημερινή Τηλεμετρία ET 6.8mm):**\n\n• **Ώρα:** Ποτίστε **05:30 - 06:45 π.μ.** Το νερό παραμένει στη ριζόσφαιρα αντί να εξατμιστεί ακαριαία.\n• **Πήλινες γλάστρες (Ø 30cm):** Χρειάζονται ~1.5 με 2 λίτρα ανά ημέρα.\n• **Πλαστικές ζαρντινιέρες:** Χρειάζονται ~0.8 με 1.2 λίτρα ανά ημέρα.\n• **Tip:** Ελέγξτε με το δάχτυλο σε βάθος 3 εκατοστών πριν ποτίσετε.`
          : `💧 **Irrigation Calculation (Today's ET 6.8mm):**\n\n• **Timing:** Water strictly between **05:30 - 06:45 AM**.\n• **Terracotta pots (Ø 30cm):** Require ~1.5 to 2.0 Liters daily.\n• **Plastic planters:** Require ~0.8 to 1.2 Liters daily.`;
      } else if (lower.includes('ντομάτ') || lower.includes('tomato') || lower.includes('λαχαν')) {
        botResponse = lang === 'el'
          ? `🍅 **Συμβουλή για Ντοματίνια Μπαλκονιού:**\n\n• **Αποτροπή Σκασίματος (Cracking):** Διατηρήστε σταθερό ρυθμό ποτίσματος με αυτόματο σταλάκτη 2L/h. Οι απότομες μεταβολές υγρασίας σκίζουν τη φλούδα.\n• **Βιολογική Προστασία:** Ψεκάστε με σαπουνόνερο (1 λίτρο νερό + 1 κουταλάκι πράσινο σαπούνι) το σούρουπο κατά του τετράνυχου.\n• **Συγκαλλιέργεια:** Βάλτε 1 ρίζα βασιλικό δίπλα στη ντομάτα.`
          : `🍅 **Balcony Tomato Strategy:**\n\n• **Prevent Fruit Splitting:** Keep consistent hydration with a steady 2L/h drip system.\n• **Organic Defense:** Spray potassium soap solution at dusk against spider mites.\n• **Companion planting:** Place a sweet basil plant adjacent to the tomato root.`;
      } else if (lower.includes('mower') || lower.includes('ρομπότ') || lower.includes('χλοοκοπτικ')) {
        botResponse = lang === 'el'
          ? `🤖 **Πρόταση Ρομποτικού Χλοοκοπτικού:**\n\n• Για κήπους έως 500τμ με δέντρα: **Segway Navimow i105E** (RTK-GPS + AI Camera χωρίς καλώδιο, ~€999).\n• Για κήπους με έντονες κλίσεις (>35%) και πυκνή σκιά: **Dreame A1 Pro** (LiDAR Laser 3D) ή **Husqvarna Automower**.\n• Όλα υποστηρίζουν live χαρτογράφηση και αυτόματο mulching.`
          : `🤖 **Robotic Lawnmower Recommendation:**\n\n• For lawns up to 500m²: **Segway Navimow i105E** (Wire-Free RTK + AI camera, ~€999).\n• For steep slopes (>35%) and dense tree canopy: **Dreame A1 Pro** (3D LiDAR).`;
      } else {
        botResponse = lang === 'el'
          ? `🌱 **Απάντηση AI Γεωπόνου:**\n\nΕξέτασα το ερώτημά σας: "${text}". Στις κλιματικές συνθήκες της Μεσογείου (έντονη ηλιοφάνεια, υψηλό UV), συνιστούμε:\n1. Εξασφάλιση καλής αποστράγγισης με περλίτη ή ελαφρόπετρα στον πυθμένα.\n2. Χρήση βιολογικών σκευασμάτων (εκχύλισμα τσουκνίδας, φύκια) νωρίς το πρωί.\n3. Πότισμα αποκλειστικά τις πρώτες πρωινές ώρες για αποφυγή ασθενειών.`
          : `🌱 **AI Agronomist Response:**\n\nAnalyzing your inquiry: "${text}". Under Mediterranean climate conditions, always prioritize proper soil drainage, organic bio-stimulants, and early morning irrigation to avoid heat-stress.`;
      }

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: botResponse,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 900);
  };

  const handleRunDiagnosis = () => {
    let diag = {
      plantName: selectedPlant === 'gardenia' ? 'Γαρδένια (Gardenia jasminoides)' :
                 selectedPlant === 'tomato' ? 'Ντοματιά / Ντοματίνια (Solanum lycopersicum)' :
                 selectedPlant === 'basil' ? 'Βασιλικός (Ocimum basilicum)' :
                 selectedPlant === 'olive' ? 'Ελιά σε Γλάστρα (Olea europaea)' : 'Λεμονιά (Citrus limon)',
      cause: '',
      urgency: 'medium',
      treatment: [] as string[],
      irrigationAction: ''
    };

    if (selectedSymptom === 'yellow_leaves') {
      diag.cause = lang === 'el' ? 'Χλώρωση Σιδήρου / Αλκαλικό Υπόστρωμα από σκληρό νερό' : 'Iron Chlorosis / High pH from tap water';
      diag.treatment = lang === 'el' ? [
        'Προσθέστε 5g Χηλικού Σιδήρου (EDDHA) στη ρίζα',
        'Ελέγξτε αν κρατάει νερό το πιατάκι της γλάστρας',
        'Μειώστε την έκθεση στον απογευματινό καύσωνα'
      ] : [
        'Apply 5g EDDHA Iron Chelate to root zone',
        'Empty drainage tray within 15 min of watering',
        'Shield from harsh afternoon heat'
      ];
      diag.irrigationAction = lang === 'el' ? 'Μειώστε τη συχνότητα, αυξήστε την αποστράγγιση' : 'Reduce frequency, enhance drainage';
    } else if (selectedSymptom === 'wilting') {
      diag.cause = lang === 'el' ? 'Θερμικό Σοκ / Υψηλή Εξατμισοδιαπνοή (>6.5mm)' : 'Heat Stress / High Evapotranspiration (>6.5mm)';
      diag.treatment = lang === 'el' ? [
        'Μεταφέρετε σε φωτεινό ημισκιερό σημείο',
        'Ποτίστε άμεσα με δροσερό (όχι παγωμένο) νερό',
        'Τοποθετήστε φλοιό πεύκου 3cm στην επιφάνεια του χώματος'
      ] : [
        'Move to bright morning light / partial shade',
        'Water immediately with ambient temperature water',
        'Add 3cm pine bark mulch on top of soil'
      ];
      diag.irrigationAction = lang === 'el' ? 'Πρωινό πότισμα στις 06:00 π.μ.' : 'Morning watering at 06:00 AM';
    } else {
      diag.cause = lang === 'el' ? 'Προσβολή από Τετράνυχο ή Αφίδες (Μελίγκρα)' : 'Spider Mite or Aphid Infestation';
      diag.treatment = lang === 'el' ? [
        'Ψεκασμός με βιολογικό πράσινο σαπούνι + οινόπνευμα το σούρουπο',
        'Πλύνετε καλά την κάτω επιφάνεια των φύλλων με πίεση νερού',
        'Απομονώστε τη γλάστρα από άλλα υγιή φυτά'
      ] : [
        'Spray with potassium soap + alcohol solution at dusk',
        'Wash undersides of leaves with water spray',
        'Isolate pot from nearby healthy plants'
      ];
      diag.irrigationAction = lang === 'el' ? 'Διατηρήστε φυσιολογικό ρυθμό άρδευσης' : 'Maintain standard irrigation';
    }

    setDiagnosisResult(diag);
  };

  return (
    <section id="ai-agronomist-section" className="py-14 sm:py-20 bg-white dark:bg-neutral-900 border-t border-neutral-200/80 dark:border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold mb-3 shadow-2xs">
            <Bot className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{lang === 'el' ? 'Τεχνητή Νοημοσύνη & Βοτανική Επιστήμη' : 'AI Plant Doctor & Botany'}</span>
          </div>

          <h2 id="agronomist-title" className="text-3xl sm:text-4xl font-extrabold text-neutral-900 dark:text-slate-100 tracking-tight">
            {lang === 'el' ? 'Ρώτησε τον AI Γεωπόνο του SmartGarden' : 'Ask SmartGarden\'s AI Agronomist'}
          </h2>

          <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-300 mt-3 leading-relaxed">
            {lang === 'el'
              ? 'Άμεση διάγνωση ασθενειών για φυτά μπαλκονιού, πρόγραμμα άρδευσης με βάση τον σημερινό καιρό και συμβουλές βιολογικής κηπουρικής.'
              : 'Instant plant disease diagnosis, microclimate irrigation calculators, and organic gardening solutions.'}
          </p>
        </div>

        {/* 2-Column Layout: Left Quick Diagnostic Tool + Right Interactive Chat */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Quick Diagnostic Wizard */}
          <div className="lg:col-span-5 bg-neutral-50 dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-750 rounded-3xl p-6 sm:p-7 shadow-sm">
            <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-neutral-200/80 dark:border-neutral-700">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
                <Stethoscope className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-slate-100">
                  {lang === 'el' ? 'Γρήγορη Διάγνωση Φυτού (Express Tool)' : 'Quick Plant Diagnostic Tool'}
                </h3>
                <p className="text-[11px] text-neutral-500">
                  {lang === 'el' ? 'Επιλέξτε συμπτώματα για άμεση οδηγία' : 'Select symptoms for instant action plan'}
                </p>
              </div>
            </div>

            {/* Plant selection */}
            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  1. {lang === 'el' ? 'Επιλογή Φυτού:' : 'Select Plant:'}
                </label>
                <select
                  id="diag-select-plant"
                  value={selectedPlant}
                  onChange={(e) => setSelectedPlant(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="gardenia">{lang === 'el' ? 'Γαρδένια (Gardenia)' : 'Gardenia'}</option>
                  <option value="tomato">{lang === 'el' ? 'Ντοματιά / Ντοματίνια' : 'Cherry Tomatoes'}</option>
                  <option value="basil">{lang === 'el' ? 'Βασιλικός (Basil)' : 'Basil'}</option>
                  <option value="lemon">{lang === 'el' ? 'Λεμονιά σε γλάστρα' : 'Potted Lemon Tree'}</option>
                  <option value="olive">{lang === 'el' ? 'Ελιά σε γλάστρα' : 'Potted Olive Tree'}</option>
                </select>
              </div>

              {/* Symptom selection */}
              <div>
                <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  2. {lang === 'el' ? 'Κύριο Σύμπτωμα:' : 'Main Symptom:'}
                </label>
                <select
                  id="diag-select-symptom"
                  value={selectedSymptom}
                  onChange={(e) => setSelectedSymptom(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="yellow_leaves">{lang === 'el' ? 'Κίτρινα φύλλα με πράσινα νεύρα' : 'Yellowing leaves with green veins'}</option>
                  <option value="wilting">{lang === 'el' ? 'Μαρασμός / Πεσμένα φύλλα παρά το πότισμα' : 'Wilting despite regular watering'}</option>
                  <option value="pests">{lang === 'el' ? 'Μικρά έντομα / ιστός τετράνυχου' : 'Spider mites / Aphids / Webbing'}</option>
                </select>
              </div>

              {/* Sun exposure */}
              <div>
                <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  3. {lang === 'el' ? 'Έκθεση στον Ήλιο:' : 'Sunlight Exposure:'}
                </label>
                <select
                  id="diag-select-sun"
                  value={selectedSun}
                  onChange={(e) => setSelectedSun(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="full_sun">{lang === 'el' ? 'Άμεσος ήλιος (>6 ώρες/μέρα)' : 'Direct sunlight (>6 hrs/day)'}</option>
                  <option value="partial_shade">{lang === 'el' ? 'Πρωινός ήλιος & απογευματινή σκιά' : 'Morning sun & afternoon shade'}</option>
                  <option value="full_shade">{lang === 'el' ? 'Πλήρης σκιά / Βόρειο μπαλκόνι' : 'Full shade / North veranda'}</option>
                </select>
              </div>

              <button
                id="run-diag-btn"
                onClick={handleRunDiagnosis}
                className="w-full py-2.5 mt-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{lang === 'el' ? 'Εκτέλεση Διάγνωσης & Πλάνου' : 'Run Diagnosis & Action Plan'}</span>
              </button>
            </div>

            {/* Diagnosis Result Card */}
            {diagnosisResult && (
              <div className="mt-5 p-4 rounded-2xl bg-white dark:bg-neutral-800 border border-emerald-300 dark:border-emerald-700/80 shadow-xs animate-in fade-in">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-xs font-bold mb-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{diagnosisResult.plantName}</span>
                </div>

                <p className="text-xs text-neutral-800 dark:text-neutral-200 font-semibold">
                  <strong>{lang === 'el' ? 'Πιθανή Αιτία:' : 'Likely Cause:'}</strong> {diagnosisResult.cause}
                </p>

                <div className="mt-3 space-y-1.5">
                  <span className="text-[11px] font-bold uppercase text-neutral-500 dark:text-neutral-400">
                    {lang === 'el' ? 'Βήματα Αντιμετώπισης:' : 'Action Steps:'}
                  </span>
                  {diagnosisResult.treatment.map((step: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-1.5 text-xs text-neutral-700 dark:text-neutral-300">
                      <span className="text-emerald-600 font-bold">•</span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-3 pt-2.5 border-t border-neutral-100 dark:border-neutral-700 flex items-center gap-2 text-[11px] text-blue-600 dark:text-blue-400">
                  <Droplets className="w-3.5 h-3.5" />
                  <span>{diagnosisResult.irrigationAction}</span>
                </div>
              </div>
            )}

            {/* Quick Prompts below diagnostic */}
            <div className="mt-6 pt-4 border-t border-neutral-200 dark:border-neutral-700">
              <span className="text-[11px] font-bold uppercase text-neutral-500 dark:text-neutral-400 block mb-2">
                {lang === 'el' ? 'Συχνές Ερωτήσεις με 1 Κλικ:' : 'Quick 1-Click Questions:'}
              </span>
              <div className="space-y-1.5">
                {AGRONOMIST_QUICK_PROMPTS.map((qp) => (
                  <button
                    key={qp.id}
                    onClick={() => handleSendMessage(qp.prompt[lang])}
                    className="w-full text-left p-2 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:border-emerald-500 dark:hover:border-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-400 transition-all flex items-center justify-between group"
                  >
                    <span>{qp.label[lang]}</span>
                    <ChevronRight className="w-3 h-3 text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column: Live Chat Interface */}
          <div className="lg:col-span-7 bg-white dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-750 rounded-3xl overflow-hidden shadow-lg flex flex-col h-[580px]">
            
            {/* Chat Header */}
            <div className="p-4 sm:px-6 bg-emerald-900 text-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-700 flex items-center justify-center text-emerald-200 border border-emerald-500/50">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold tracking-tight">SmartGarden AI Assistant</h4>
                  <p className="text-[11px] text-emerald-200 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    {lang === 'el' ? 'Συνδεδεμένος με Live ET Μικροκλίματος' : 'Connected to Live Microclimate ET'}
                  </p>
                </div>
              </div>

              <button
                id="reset-chat-btn"
                onClick={() => setMessages([{
                  id: 'msg-welcome-new',
                  sender: 'bot',
                  text: lang === 'el' ? 'Η συνομιλία ανανεώθηκε. Πώς μπορώ να βοηθήσω τον κήπο σας;' : 'Chat cleared. How may I assist your garden today?',
                  timestamp: '12:00'
                }])}
                className="p-2 rounded-lg bg-emerald-800/80 hover:bg-emerald-800 text-emerald-200 hover:text-white transition-colors"
                title="Reset Chat"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Chat Messages Area */}
            <div ref={chatContainerRef} className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-neutral-50/50 dark:bg-neutral-900/50">
              {messages.map((msg) => {
                const isUser = msg.sender === 'user';
                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}
                  >
                    {!isUser && (
                      <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs shrink-0 mt-0.5">
                        <Bot className="w-3.5 h-3.5" />
                      </div>
                    )}

                    <div
                      className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed shadow-2xs whitespace-pre-line ${
                        isUser
                          ? 'bg-emerald-800 text-white rounded-tr-none'
                          : 'bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200/80 dark:border-neutral-700 rounded-tl-none'
                      }`}
                    >
                      {msg.text}
                      <div className={`text-[10px] mt-1 text-right ${isUser ? 'text-emerald-200' : 'text-neutral-400'}`}>
                        {msg.timestamp}
                      </div>
                    </div>
                  </div>
                );
              })}

              {isTyping && (
                <div className="flex items-center gap-2 text-xs text-neutral-500">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs">
                    <Bot className="w-3 h-3" />
                  </div>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.4s]"></span>
                  </span>
                </div>
              )}
            </div>

            {/* Chat Input Bar */}
            <div className="p-3 sm:p-4 bg-white dark:bg-neutral-850 border-t border-neutral-200 dark:border-neutral-750">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  id="agronomist-chat-input"
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={lang === 'el' ? 'Ρωτήστε για οποιοδήποτε φυτό, πότισμα ή σύμπτωμα...' : 'Ask about any plant, watering schedule, or symptom...'}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs sm:text-sm text-neutral-900 dark:text-slate-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  id="send-agronomist-msg-btn"
                  type="submit"
                  disabled={!inputText.trim() || isTyping}
                  className="px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{lang === 'el' ? 'Αποστολή' : 'Send'}</span>
                </button>
              </form>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
