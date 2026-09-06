import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Sparkles, 
  Lock, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowUp, 
  ChevronDown, 
  LayoutDashboard
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';

interface PoojaDay {
  day: number;
  date: string;
  title: string;
  description: string;
  special_event?: string;
  time?: string;
}

interface DonorItem {
  id: number;
  name: string;
  title: string;
  amount?: string;
  details?: string;
  year?: string;
}

interface FestivalInfoData {
  id: number;
  festival_title: string;
  festival_year: number;
  tagline: string;
  sub_tagline: string;
  dates_text: string;
  location_text: string;
  status_text: string;
  idol_image_url: string;
  pooja_schedule: string;
  laddu_donors: string;
  idol_donors: string;
}

interface FinanceTransparencyData {
  total_donations: number;
  total_expenses: number;
  available_balance: number;
  recent_donations: Array<{
    name: string;
    amount: number;
    date: string;
    purpose?: string;
  }>;
  recent_expenses: Array<{
    name: string;
    amount: number;
    date: string;
    category?: string;
  }>;
}

// Fallback initial data if offline or backend is starting
const DEFAULT_FESTIVAL_INFO: FestivalInfoData = {
  id: 1,
  festival_title: "శ్రీ గణేష్ ఉత్సవం 2026",
  festival_year: 2026,
  tagline: "టీమ్ గరుడ",
  sub_tagline: "మన వీధి • మన పండుగ • మన గర్వం",
  dates_text: "సెప్టెంబర్ 15 – సెప్టెంబర్ 23, 2026",
  location_text: "నాగార్జున స్ట్రీట్, రాజోలు",
  status_text: "వైభవంగా కొనసాగుతోంది",
  idol_image_url: "/ganesh_idol_2026.jpg",
  pooja_schedule: JSON.stringify([
    {
      day: 1,
      date: "2026-09-15",
      title: "వినాయక చవితి - గణపతి ప్రాణ ప్రతిష్ఠ",
      description: "గణపతి హోమం, విగ్రహ ప్రాణ ప్రతిష్ఠ, ప్రథమ మహా పూజ & మోదక నైవేద్యం",
      special_event: "విశేష పుష్పాలంకరణ & మహా హారతి",
      time: "ఉదయం 8:30 & సాయంత్రం 7:00"
    },
    {
      day: 2,
      date: "2026-09-16",
      title: "శ్రీ గణపతి సహస్రనామ కుంకుమార్చన",
      description: "పంచామృతాభిషేకం, విశేష అర్చన & మహిళా భక్త బృందంచే కుంకుమార్చన",
      special_event: "లడ్డూ & పాయసం ప్రసాద వితరణ",
      time: "సాయంత్రం 6:30"
    },
    {
      day: 3,
      date: "2026-09-17",
      title: "సంకష్టహర చతుర్థి విశేష పూజ",
      description: "గణపతి అథర్వశీర్ష పారాయణం & నవగ్రహ శాంతి అభిషేకం",
      special_event: "విశేష చతుర్థి నైవేద్య సమర్పణ",
      time: "సాయంత్రం 7:00"
    },
    {
      day: 4,
      date: "2026-09-18",
      title: "గణపతి హోమం & భజన సంధ్య",
      description: "లోక కళ్యాణార్థం గణపతి హోమం & వీధి భక్త మండలిచే భక్తి సంకీర్తనలు",
      special_event: "భక్తి సంగీత కార్యక్రమం",
      time: "సాయంత్రం 6:00"
    },
    {
      day: 5,
      date: "2026-09-19",
      title: "విశేష బిల్వార్చన & పుష్పాభిషేకం",
      description: "21 రకాల పత్రాలతో ఏకవింశతి పూజ & సహస్ర నామార్చన",
      special_event: "పులిహోర & దద్దోజనం ప్రసాదం",
      time: "ఉదయం 9:00 & సాయంత్రం 7:00"
    },
    {
      day: 6,
      date: "2026-09-20",
      title: "శ్రీ లలితా సహస్రనామ పారాయణం",
      description: "మహిళలచే శ్రీ లలితా పారాయణం & సౌభాగ్య ద్రవ్యాల ప్రదానం",
      special_event: "మహిళా కుంకుమార్చన",
      time: "సాయంత్రం 6:30"
    },
    {
      day: 7,
      date: "2026-09-21",
      title: "దివ్య మహా హారతి & ప్రత్యేక అలంకరణ",
      description: "గణేశునికి విశేష పుష్ప రథ అలంకరణ & 108 దీపారాధన హారతి",
      special_event: "108 దీపారాధన మహోత్సవం",
      time: "సాయంత్రం 7:30"
    },
    {
      day: 8,
      date: "2026-09-22",
      title: "మహా అన్నదాన మహోత్సవం",
      description: "వీధి ప్రజలు మరియు భక్తులందరికీ స్వామివారి మహా అన్నప్రసాద వితరణ",
      special_event: "మహా అన్నదానం (మధ్యాహ్నం 12:00 నుండి)",
      time: "మధ్యాహ్నం 12:00 నుండి"
    },
    {
      day: 9,
      date: "2026-09-23",
      title: "గంగా నిమజ్జనోత్సవం & శోభాయాత్ర",
      description: "స్వామివారి మహా మంగళ హారతి, లడ్డూ ప్రసాద వేలం పాట & ఘన వీడ్కోలు శోభాయాత్ర",
      special_event: "లడ్డూ వేలం పాట & గంగా నిమజ్జనం",
      time: "మధ్యాహ్నం 3:00 నుండి"
    }
  ]),
  laddu_donors: JSON.stringify([
    {
      id: 1,
      name: "శ్రీ రాము గారు",
      title: "లడ్డు ప్రధాన దాత",
      amount: "మహా లడ్డూ ప్రసాదం సమర్పణ",
      year: "2026"
    },
    {
      id: 2,
      name: "శ్రీ వనమాల శ్రీను & చదలాడ శ్రీను గారు",
      title: "లడ్డు ప్రసాద దాతలు",
      amount: "పూరి & నైవేద్య అన్నదానం",
      year: "2026"
    },
    {
      id: 3,
      name: "శ్రీ గుబ్బల లక్ష్మి & దుర్గా ప్రసాద్ గారు",
      title: "విశేష నైవేద్య దాతలు",
      amount: "క్షీరాన్నం & ప్రసాద వితరణ",
      year: "2026"
    }
  ]),
  idol_donors: JSON.stringify([
    {
      id: 1,
      name: "టీమ్ గరుడ కమిటీ సభ్యులు & యువజన సంఘం",
      title: "వినాయక మహా విగ్రహ సమర్పణ",
      details: "2026 గరుడ గణేష్ ఉత్సవ ప్రధాన విగ్రహం",
      year: "2026"
    },
    {
      id: 2,
      name: "శ్రీ కంభంపాటి సూర్య తేజ & కుటుంబ సభ్యులు",
      title: "విగ్రహ అలంకరణ & మంటప దాతలు",
      details: "మంటప డెకరేషన్ & లైటింగ్ సహకారం",
      year: "2026"
    },
    {
      id: 3,
      name: "నాగార్జున స్ట్రీట్ వీధి పెద్దలు & భక్త బృందం",
      title: "ఉత్సవ ప్రోత్సాహక దాతలు",
      details: "రాజోలు నాగార్జున వీధి సమస్త భక్తులు",
      year: "2026"
    }
  ])
};

export const Home: React.FC = () => {
  const { role } = useAuth();
  const navigate = useNavigate();

  const [festivalInfo, setFestivalInfo] = useState<FestivalInfoData>(DEFAULT_FESTIVAL_INFO);
  const [financeData, setFinanceData] = useState<FinanceTransparencyData | null>(null);
  const [activeTab, setActiveTab] = useState<'donations' | 'expenses'>('donations');
  const [activeNav, setActiveNav] = useState<string>('home');
  const [expandedPoojaDay, setExpandedPoojaDay] = useState<number | null>(1);

  useEffect(() => {
    const fetchLandingData = async () => {
      try {
        const [festRes, finRes] = await Promise.allSettled([
          fetch(`${API_BASE_URL}/api/public/festival-info`),
          fetch(`${API_BASE_URL}/api/public/finance-transparency`)
        ]);

        if (festRes.status === 'fulfilled' && festRes.value.ok) {
          const festJson = await festRes.value.json();
          setFestivalInfo(festJson);
        }

        if (finRes.status === 'fulfilled' && finRes.value.ok) {
          const finJson = await finRes.value.json();
          setFinanceData(finJson);
        }
      } catch (err) {
        console.log('Using default festival data:', err);
      }
    };

    fetchLandingData();
  }, []);

  // Parse JSON data safely
  const poojaSchedule: PoojaDay[] = React.useMemo(() => {
    try {
      return JSON.parse(festivalInfo.pooja_schedule || '[]');
    } catch {
      return [];
    }
  }, [festivalInfo.pooja_schedule]);

  const ladduDonors: DonorItem[] = React.useMemo(() => {
    try {
      return JSON.parse(festivalInfo.laddu_donors || '[]');
    } catch {
      return [];
    }
  }, [festivalInfo.laddu_donors]);

  const idolDonors: DonorItem[] = React.useMemo(() => {
    try {
      return JSON.parse(festivalInfo.idol_donors || '[]');
    } catch {
      return [];
    }
  }, [festivalInfo.idol_donors]);

  const scrollToSection = (id: string) => {
    setActiveNav(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const isCommitteeOrAdmin = role === 'COMMITTEE' || role === 'ADMIN';

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#FFFDF8] text-[#2D241E] overflow-y-auto no-scrollbar scroll-smooth">
      
      {/* 1. COMPACT STICKY HEADER */}
      <header className="h-16 px-4 shrink-0 flex items-center justify-between border-b border-[#F2E8D5] bg-[#FFFDF8]/95 backdrop-blur-md sticky top-0 z-40 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-[#EA580C] to-[#9A3412] border border-[#F59E0B]/60 flex items-center justify-center shadow-md overflow-hidden shrink-0">
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
            />
          </div>
          <div className="flex flex-col">
            <h1 className="text-sm font-black font-serif tracking-wide text-[#9A3412] leading-tight flex items-center gap-1.5">
              <span>{festivalInfo.tagline}</span>
              <span className="text-[9px] font-bold bg-[#EA580C]/10 text-[#EA580C] px-1.5 py-0.5 rounded-full border border-[#EA580C]/20">
                {festivalInfo.festival_year}
              </span>
            </h1>
            <span className="text-[8px] font-bold tracking-widest uppercase text-[#A16207]">
              Sri Ganesha Krupa
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2">
          {isCommitteeOrAdmin ? (
            <button 
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-1.5 text-[11px] font-bold text-white bg-gradient-to-r from-[#EA580C] to-[#9A3412] px-3.5 py-1.5 rounded-full shadow-sm hover:opacity-95 active:scale-95 transition-all cursor-pointer"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>డ్యాష్‌బోర్డ్</span>
            </button>
          ) : (
            <button 
              onClick={() => navigate('/login')}
              className="flex items-center gap-1.5 text-[11px] font-bold text-[#9A3412] bg-[#EA580C]/10 hover:bg-[#EA580C]/15 px-3.5 py-1.5 rounded-full border border-[#EA580C]/30 shadow-2xs active:scale-95 transition-all cursor-pointer"
            >
              <Lock className="w-3 h-3 text-[#EA580C]" />
              <span>కమిటీ లాగిన్</span>
            </button>
          )}
        </div>
      </header>

      {/* QUICK CATEGORY NAVIGATION PILLS */}
      <nav className="bg-[#FAF3E0]/90 border-b border-[#F2E8D5] px-3 py-2 flex items-center justify-between gap-1.5 overflow-x-auto no-scrollbar shrink-0 sticky top-16 z-30 backdrop-blur-sm">
        <button 
          onClick={() => scrollToSection('hero-section')}
          className={`px-3 py-1 rounded-full text-[10px] font-extrabold whitespace-nowrap transition-all cursor-pointer ${
            activeNav === 'home' || activeNav === 'hero-section' 
              ? 'bg-[#EA580C] text-white shadow-xs' 
              : 'bg-white/80 text-[#7C2D12] hover:bg-white border border-[#E9D5B4]'
          }`}
        >
          🏠 Home
        </button>
        <button 
          onClick={() => scrollToSection('poojas-section')}
          className={`px-3 py-1 rounded-full text-[10px] font-extrabold whitespace-nowrap transition-all cursor-pointer ${
            activeNav === 'poojas' || activeNav === 'poojas-section' 
              ? 'bg-[#EA580C] text-white shadow-xs' 
              : 'bg-white/80 text-[#7C2D12] hover:bg-white border border-[#E9D5B4]'
          }`}
        >
          🪔 9 రోజుల పూజలు
        </button>
        <button 
          onClick={() => scrollToSection('donors-section')}
          className={`px-3 py-1 rounded-full text-[10px] font-extrabold whitespace-nowrap transition-all cursor-pointer ${
            activeNav === 'donors' || activeNav === 'donors-section' 
              ? 'bg-[#EA580C] text-white shadow-xs' 
              : 'bg-white/80 text-[#7C2D12] hover:bg-white border border-[#E9D5B4]'
          }`}
        >
          🥥 దాతలు
        </button>
        <button 
          onClick={() => scrollToSection('accounts-section')}
          className={`px-3 py-1 rounded-full text-[10px] font-extrabold whitespace-nowrap transition-all cursor-pointer ${
            activeNav === 'accounts' || activeNav === 'accounts-section' 
              ? 'bg-[#EA580C] text-white shadow-xs' 
              : 'bg-white/80 text-[#7C2D12] hover:bg-white border border-[#E9D5B4]'
          }`}
        >
          📊 లెక్కలు
        </button>
      </nav>

      {/* MAIN CONTENT CONTAINER */}
      <main className="flex-1 flex flex-col gap-7 px-4 pt-4 pb-14 max-w-md mx-auto w-full">

        {/* ========================================================= */}
        {/* 2. HERO SECTION — THIS YEAR'S GANESH */}
        {/* ========================================================= */}
        <section id="hero-section" className="flex flex-col items-center text-center gap-3.5 scroll-mt-28">
          
          {/* Main Festive Title */}
          <div className="flex flex-col items-center gap-1">
            <span className="text-[11px] font-extrabold tracking-widest text-[#D97706] uppercase flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[#F59E0B] fill-[#F59E0B]" />
              శ్రీ వినాయక చతుర్థి మహోత్సవములు
              <Sparkles className="w-3.5 h-3.5 text-[#F59E0B] fill-[#F59E0B]" />
            </span>
            <h2 className="text-2xl font-black font-serif tracking-tight text-[#7C2D12] leading-tight">
              {festivalInfo.festival_title}
            </h2>
          </div>

          {/* Large Lord Ganesh Idol Showcase Card */}
          <div className="relative w-full rounded-3xl overflow-hidden bg-gradient-to-b from-[#FFF4DF] to-[#FDE8C7] border-2 border-[#E9D0A7] shadow-xl p-2.5 flex flex-col group">
            
            {/* Ornate Top Arch & Accent Line */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#F59E0B] via-[#EA580C] to-[#F59E0B]" />

            {/* Image Container with Gold Border Frame */}
            <div className="relative w-full rounded-2xl overflow-hidden border border-[#D97706]/30 shadow-inner bg-[#2D1609] aspect-4/3 flex items-center justify-center">
              <img 
                src={festivalInfo.idol_image_url || "/ganesh_idol_2026.jpg"} 
                alt="Lord Ganesh Idol 2026"
                className="w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-500"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/ganesh_idol_2026.jpg";
                }}
              />
              
              {/* Bottom Subtle Gradient for Text Contrast */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10 pointer-events-none" />

              {/* Status Badge Over Image */}
              <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md border border-[#F59E0B]/50 px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-md">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-extrabold text-[#FEF3C7] tracking-wider">
                  {festivalInfo.status_text || "దర్శనం ప్రారంభం"}
                </span>
              </div>
            </div>

            {/* Below Idol Caption */}
            <div className="pt-3 pb-1 px-2 flex flex-col items-center">
              <h3 className="text-lg font-black font-serif text-[#9A3412] leading-tight tracking-wide">
                {festivalInfo.tagline}
              </h3>
              <p className="text-xs font-bold text-[#78350F] mt-0.5 tracking-wide">
                {festivalInfo.sub_tagline}
              </p>
            </div>
          </div>

          {/* Festival Key Info Badges */}
          <div className="w-full grid grid-cols-2 gap-2.5">
            <div className="bg-[#FFF8EC] border border-[#F3E2C4] p-3 rounded-2xl flex items-center gap-2.5 shadow-2xs text-left">
              <div className="w-8 h-8 rounded-xl bg-[#EA580C]/10 border border-[#EA580C]/20 flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4 text-[#EA580C]" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[9px] font-bold text-[#92400E] uppercase tracking-wider block">ఉత్సవ తేదీలు</span>
                <span className="text-[11px] font-extrabold text-[#451A03] truncate block">{festivalInfo.dates_text}</span>
              </div>
            </div>

            <div className="bg-[#FFF8EC] border border-[#F3E2C4] p-3 rounded-2xl flex items-center gap-2.5 shadow-2xs text-left">
              <div className="w-8 h-8 rounded-xl bg-[#D97706]/10 border border-[#D97706]/20 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4 text-[#D97706]" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[9px] font-bold text-[#92400E] uppercase tracking-wider block">ఉత్సవ స్థలం</span>
                <span className="text-[11px] font-extrabold text-[#451A03] truncate block">{festivalInfo.location_text}</span>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* IDOL DONORS PROMINENTLY UNDER THE LORD GANESH IDOL */}
          {/* ========================================================= */}
          {idolDonors.length > 0 && (
            <div className="w-full bg-gradient-to-br from-[#FFF8EC] via-[#FAF2E2] to-[#FFF5E5] border-2 border-[#EAD0A9] rounded-3xl p-3.5 flex flex-col gap-2.5 shadow-md text-left relative overflow-hidden">
              
              {/* Ornate Gold Accent Top Bar */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#D97706] via-[#EA580C] to-[#D97706]" />

              <div className="flex items-center justify-between border-b border-[#EAD0A9]/80 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🛕</span>
                  <div>
                    <h3 className="text-xs font-black font-serif text-[#7C2D12] tracking-wide uppercase leading-tight">
                      వినాయక విగ్రహ దాతలు
                    </h3>
                    <span className="text-[9px] font-bold text-[#A16207] block">
                      Lord Ganesh Idol Sponsors
                    </span>
                  </div>
                </div>
                <span className="text-[8px] font-black uppercase tracking-wider bg-[#EA580C]/12 text-[#9A3412] px-2 py-0.5 rounded-full border border-[#EA580C]/25 shadow-2xs">
                  మహా విగ్రహ సమర్పణ
                </span>
              </div>

              {/* Idol Donors List Cards */}
              <div className="flex flex-col gap-2 pt-0.5">
                {idolDonors.map((donor) => (
                  <div 
                    key={donor.id}
                    className="bg-white/90 backdrop-blur-sm border border-[#E9D2B2] rounded-2xl p-2.5 flex items-center justify-between gap-2.5 shadow-2xs hover:border-[#EA580C]/40 transition-all"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#EA580C]/15 to-[#9A3412]/15 border border-[#EA580C]/25 flex items-center justify-center shrink-0">
                        <span className="text-sm">🛕</span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <h4 className="text-xs font-black text-[#431407] truncate leading-tight">
                          {donor.name}
                        </h4>
                        <span className="text-[10px] font-bold text-[#9A3412] mt-0.5 truncate">
                          {donor.title || "విగ్రహ సమర్పణ దాత"}
                        </span>
                        {donor.details && (
                          <span className="text-[9px] font-medium text-[#78350F] truncate">
                            {donor.details}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 pr-1">
                      <CheckCircle2 className="w-4 h-4 text-[#D97706]" />
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

        </section>


        {/* ========================================================= */}
        {/* 3. 9 DAYS POOJA SECTION */}
        {/* ========================================================= */}
        <section id="poojas-section" className="flex flex-col gap-3.5 scroll-mt-28">
          
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-base">🪔</span>
                <h2 className="text-lg font-black font-serif text-[#7C2D12]">
                  9 రోజుల పూజా కార్యక్రమాలు
                </h2>
              </div>
              <span className="text-[10px] font-semibold text-[#92400E]">
                నవరాత్రుల దినసరి విశేష పూజలు & ప్రసాదాలు
              </span>
            </div>
            <span className="text-[9px] font-extrabold bg-[#EA580C]/10 text-[#EA580C] px-2 py-0.5 rounded-full border border-[#EA580C]/20">
              9 Days Schedule
            </span>
          </div>

          {/* Pooja Cards Accordion / List */}
          <div className="flex flex-col gap-2.5">
            {poojaSchedule.map((p) => {
              const isExpanded = expandedPoojaDay === p.day;
              return (
                <div 
                  key={p.day}
                  onClick={() => setExpandedPoojaDay(isExpanded ? null : p.day)}
                  className={`rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden ${
                    isExpanded 
                      ? 'bg-[#FFF9EE] border-[#EA580C]/50 shadow-md ring-1 ring-[#EA580C]/30' 
                      : 'bg-white border-[#EEDDC4] hover:border-[#E2C79F] shadow-2xs'
                  }`}
                >
                  {/* Top Bar of the Day Card */}
                  <div className="p-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      
                      {/* Day Pill */}
                      <div className={`w-12 h-11 rounded-xl flex flex-col items-center justify-center shrink-0 border font-extrabold ${
                        isExpanded
                          ? 'bg-[#EA580C] text-white border-[#C2410C]'
                          : 'bg-[#FAF2E1] text-[#9A3412] border-[#E9D3B0]'
                      }`}>
                        <span className="text-[8px] tracking-tighter uppercase leading-none opacity-90">Day</span>
                        <span className="text-sm leading-none mt-0.5">{p.day}</span>
                      </div>

                      {/* Day Title & Date */}
                      <div className="flex flex-col min-w-0">
                        <h4 className="text-xs font-black text-[#431407] truncate leading-tight">
                          {p.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-[#92400E]">
                          <span className="font-semibold">{p.date}</span>
                          {p.time && (
                            <>
                              <span className="text-[#D97706]">•</span>
                              <span className="flex items-center gap-1 font-medium">
                                <Clock className="w-3 h-3 text-[#EA580C]" />
                                {p.time}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 text-[#92400E]">
                      <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-[#EA580C]' : ''}`} />
                    </div>
                  </div>

                  {/* Expanded Details Body */}
                  {isExpanded && (
                    <div className="px-3.5 pb-3.5 pt-1 border-t border-[#F2E2C8] flex flex-col gap-2.5 text-xs">
                      <p className="text-[#5C2E0B] leading-relaxed font-medium bg-[#FFF3DC]/60 p-2.5 rounded-xl border border-[#F3E0BD]">
                        {p.description}
                      </p>

                      {p.special_event && (
                        <div className="flex items-center gap-2 bg-[#EA580C]/8 text-[#9A3412] px-3 py-1.5 rounded-xl border border-[#EA580C]/20 font-bold text-[11px]">
                          <Sparkles className="w-3.5 h-3.5 text-[#EA580C] shrink-0" />
                          <span>{p.special_event}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </section>


        {/* ========================================================= */}
        {/* 4. LADDU DONORS SECTION */}
        {/* ========================================================= */}
        <section id="donors-section" className="flex flex-col gap-3.5 scroll-mt-28">
          
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-base">🥥</span>
                <h2 className="text-lg font-black font-serif text-[#7C2D12]">
                  లడ్డు దాతలు
                </h2>
              </div>
              <span className="text-[10px] font-semibold text-[#92400E]">
                గణపతి మహా లడ్డు ప్రసాద సమర్పణ దాతలు
              </span>
            </div>
            <span className="text-[9px] font-extrabold bg-[#F59E0B]/15 text-[#92400E] px-2 py-0.5 rounded-full border border-[#F59E0B]/30">
              Laddu Donors
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {ladduDonors.map((donor) => (
              <div 
                key={donor.id}
                className="bg-gradient-to-r from-[#FFF9EE] via-[#FFFDF8] to-[#FFF6E5] border-2 border-[#F3DEC0] rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-2xs relative overflow-hidden"
              >
                {/* Decorative gold ribbon pill */}
                <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none overflow-hidden">
                  <div className="absolute transform rotate-45 bg-[#EA580C]/10 text-[#EA580C] text-[7px] font-black py-0.5 right-[-35px] top-[14px] w-[110px] text-center border-y border-[#EA580C]/20">
                    లడ్డు దాత
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#EA580C]/10 border border-[#EA580C]/25 flex items-center justify-center shrink-0 shadow-2xs">
                    <span className="text-xl">🥥</span>
                  </div>
                  <div className="flex flex-col min-w-0 pr-8">
                    <h4 className="text-xs font-black text-[#451A03] leading-tight">
                      {donor.name}
                    </h4>
                    <span className="text-[10px] font-bold text-[#B45309] mt-0.5">
                      {donor.title || "లడ్డు దాత"}
                    </span>
                    {donor.amount && (
                      <span className="text-[9px] font-medium text-[#78350F] mt-0.5">
                        {donor.amount}
                      </span>
                    )}
                  </div>
                </div>

              </div>
            ))}
          </div>

        </section>

        {/* ========================================================= */}
        {/* 5. DONATIONS AND EXPENSES DASHBOARD */}
        {/* ========================================================= */}
        <section id="accounts-section" className="flex flex-col gap-3.5 scroll-mt-28">
          
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-base">📊</span>
                <h2 className="text-lg font-black font-serif text-[#7C2D12]">
                  మన ఉత్సవ లెక్కలు
                </h2>
              </div>
              <span className="text-[10px] font-semibold text-[#92400E]">
                ఆదాయ-వ్యయాల సంపూర్ణ పారదర్శక సమాచారం
              </span>
            </div>
            <span className="text-[9px] font-extrabold bg-[#059669]/15 text-[#065F46] px-2 py-0.5 rounded-full border border-[#059669]/25">
              100% Transparent
            </span>
          </div>

          {/* 3 Prominent Summary Cards */}
          <div className="grid grid-cols-3 gap-2">
            
            {/* Total Donations */}
            <div className="bg-[#ECFDF5] border border-[#A7F3D0] p-3 rounded-2xl flex flex-col gap-1 shadow-2xs text-center">
              <span className="text-[9px] font-extrabold text-[#065F46] uppercase tracking-wider">మొత్తం విరాళాలు</span>
              <span className="text-sm font-black text-[#047857]">
                ₹{financeData ? Number(financeData.total_donations).toLocaleString('en-IN') : '0'}
              </span>
              <span className="text-[8px] font-semibold text-[#059669]">Donations</span>
            </div>

            {/* Total Expenses */}
            <div className="bg-[#FFF1F2] border border-[#FECDD3] p-3 rounded-2xl flex flex-col gap-1 shadow-2xs text-center">
              <span className="text-[9px] font-extrabold text-[#9F1239] uppercase tracking-wider">మొత్తం ఖర్చులు</span>
              <span className="text-sm font-black text-[#BE123C]">
                ₹{financeData ? Number(financeData.total_expenses).toLocaleString('en-IN') : '0'}
              </span>
              <span className="text-[8px] font-semibold text-[#E11D48]">Expenses</span>
            </div>

            {/* Balance */}
            <div className="bg-[#FFFBEB] border border-[#FDE68A] p-3 rounded-2xl flex flex-col gap-1 shadow-2xs text-center">
              <span className="text-[9px] font-extrabold text-[#92400E] uppercase tracking-wider">మిగిలిన మొత్తం</span>
              <span className="text-sm font-black text-[#B45309]">
                ₹{financeData ? Number(financeData.available_balance).toLocaleString('en-IN') : '0'}
              </span>
              <span className="text-[8px] font-semibold text-[#D97706]">Balance</span>
            </div>

          </div>

          {/* Transparent List Tabs */}
          <div className="bg-white border border-[#EEDEC8] rounded-3xl p-3 flex flex-col gap-3 shadow-sm">
            
            <div className="flex bg-[#FAF3E2] p-1 rounded-2xl">
              <button 
                onClick={() => setActiveTab('donations')}
                className={`flex-1 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                  activeTab === 'donations' 
                    ? 'bg-white text-[#9A3412] shadow-xs' 
                    : 'text-[#92400E] hover:text-[#7C2D12]'
                }`}
              >
                ఇటీవలి విరాళాలు ({financeData?.recent_donations?.length || 0})
              </button>
              <button 
                onClick={() => setActiveTab('expenses')}
                className={`flex-1 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                  activeTab === 'expenses' 
                    ? 'bg-white text-[#9A3412] shadow-xs' 
                    : 'text-[#92400E] hover:text-[#7C2D12]'
                }`}
              >
                ఇటీవలి ఖర్చులు ({financeData?.recent_expenses?.length || 0})
              </button>
            </div>

            {/* List Content */}
            <div className="flex flex-col divide-y divide-[#F4E8D6] max-h-56 overflow-y-auto no-scrollbar pr-1">
              {activeTab === 'donations' ? (
                financeData && financeData.recent_donations.length > 0 ? (
                  financeData.recent_donations.map((item, idx) => (
                    <div key={idx} className="py-2 flex items-center justify-between gap-2">
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-black text-[#431407] truncate">{item.name}</span>
                        <span className="text-[9px] text-[#92400E] font-medium">{item.date} • {item.purpose || "గణపతి చందా"}</span>
                      </div>
                      <span className="text-xs font-black text-[#047857] shrink-0">
                        +₹{Number(item.amount).toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="py-4 text-center text-xs text-[#92400E]">విరాళాల రికార్డులు త్వరలో అప్‌డేట్ చేయబడతాయి.</div>
                )
              ) : (
                financeData && financeData.recent_expenses.length > 0 ? (
                  financeData.recent_expenses.map((item, idx) => (
                    <div key={idx} className="py-2 flex items-center justify-between gap-2">
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-black text-[#431407] truncate">{item.name}</span>
                        <span className="text-[9px] text-[#92400E] font-medium">{item.date} • {item.category || "ఖర్చు"}</span>
                      </div>
                      <span className="text-xs font-black text-[#BE123C] shrink-0">
                        -₹{Number(item.amount).toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="py-4 text-center text-xs text-[#92400E]">ఖర్చుల రికార్డులు త్వరలో అప్‌డేట్ చేయబడతాయి.</div>
                )
              )}
            </div>

            {/* Transparency Trust Badge */}
            <div className="bg-[#FAF4E6] p-2.5 rounded-2xl flex items-center gap-2 border border-[#EBD7B8]">
              <ShieldCheck className="w-4 h-4 text-[#059669] shrink-0" />
              <p className="text-[10px] text-[#78350F] leading-tight font-medium">
                మా వీధి గణేష్ ఉత్సవ లెక్కలు ప్రతి పైసా పారదర్శకంగా నిర్వహించబడుతున్నాయి.
              </p>
            </div>

          </div>

        </section>


        {/* ========================================================= */}
        {/* 7. FOOTER */}
        {/* ========================================================= */}
        <footer className="pt-6 border-t border-[#F2E5D0] flex flex-col items-center text-center gap-3">
          
          <div className="flex items-center gap-2">
            <span className="text-sm">🚩</span>
            <h4 className="text-sm font-serif font-black text-[#7C2D12] tracking-wider uppercase">
              టీమ్ గరుడ • శ్రీ వినాయక ఉత్సవ కమిటీ
            </h4>
            <span className="text-sm">🚩</span>
          </div>

          <p className="text-[11px] font-bold text-[#92400E] font-serif">
            సర్వేజనాః సుఖినోభవంతు • గణపతి బప్పా మోరియా!
          </p>

          <span className="text-[9px] font-semibold text-[#A16207]">
            రాజోలు - నాగార్జున స్ట్రీట్ • {festivalInfo.festival_year}
          </span>

          <div className="flex items-center gap-3 mt-2">
            <button 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="text-[10px] font-bold text-[#EA580C] bg-[#EA580C]/10 hover:bg-[#EA580C]/20 px-3 py-1.5 rounded-full border border-[#EA580C]/20 flex items-center gap-1 cursor-pointer"
            >
              <ArrowUp className="w-3 h-3" />
              <span>పైకి వెళ్లండి</span>
            </button>
            
            <button 
              onClick={() => navigate(isCommitteeOrAdmin ? '/dashboard' : '/login')}
              className="text-[10px] font-bold text-[#7C2D12] bg-[#7C2D12]/10 hover:bg-[#7C2D12]/20 px-3 py-1.5 rounded-full border border-[#7C2D12]/20 flex items-center gap-1 cursor-pointer"
            >
              <Lock className="w-3 h-3" />
              <span>{isCommitteeOrAdmin ? 'డ్యాష్‌బోర్డ్' : 'కమిటీ లాగిన్'}</span>
            </button>
          </div>

        </footer>

      </main>
    </div>
  );
};
