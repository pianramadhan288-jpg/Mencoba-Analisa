import React, { useState, useMemo, ReactElement, useEffect } from 'react';
import { 
  TrendingUp, BarChart3, ShieldAlert, Target, Zap, ChevronDown, AlertCircle,
  Loader2, RefreshCcw, Search, CheckCircle2, DollarSign, XCircle, TrendingDown,
  Info, Share2, Check, AlertTriangle, Briefcase, Users, Building, FileText,
  Rocket, Scale, Wind, Link as LinkIcon, ShieldCheck, Paintbrush
} from 'lucide-react';
import { analyzeTrade, fetchDetailedCompanyProfile } from './gemini';
import { AnalysisInput, AnalysisResult, OrderBookStatus, TradeBookStatus, BrokerInput, CompanyProfile, BrokerSummaryStatus } from './types';

const BROKER_CLASSIFICATIONS = {
  'Rich/Kuat': ['CS', 'MS', 'UB', 'BK', 'AK', 'YP', 'ZP', 'HD', 'RX', 'DU', 'CG', 'KZ', 'DR', 'LH', 'AH', 'GW', 'RB', 'TP', 'KK', 'LS'],
  'Konglo Spesial': ['HP', 'DX', 'LG', 'MU', 'ES'],
  'Ampas/Ritel': ['XL', 'XC', 'PD', 'CC', 'CP', 'NI', 'IF', 'BB', 'SS', 'BQ', 'GR', 'SA', 'SC', 'SF', 'SH', 'SQ', 'TF', 'TS', 'TX', 'XA', 'YB', 'YJ', 'YO', 'ZR'],
};

// --- THEME HELPER FUNCTIONS ---
const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : null;
};

const lightenHex = (hex: string, percent: number) => {
    const rgb = hexToRgb(hex);
    if (!rgb) return hex;
    let { r, g, b } = rgb;
    r = Math.min(255, Math.floor(r * (1 + percent / 100)));
    g = Math.min(255, Math.floor(g * (1 + percent / 100)));
    b = Math.min(255, Math.floor(b * (1 + percent / 100)));
    const toHex = (c: number) => `0${c.toString(16)}`.slice(-2);
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const generateThemeFromColor = (mainColor: string) => {
    const rgb = hexToRgb(mainColor);
    if (!rgb) return generateThemeFromColor('#FFC107'); // Fallback to gold
    return {
        main: mainColor,
        background: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)`,
        border: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2)`,
        shadow: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2)`,
        focusRing: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.5)`,
        gradientFrom: mainColor,
        gradientTo: lightenHex(mainColor, 10),
    };
};
// --- END THEME HELPERS ---

const getBrokerClassification = (code: string): { type: string; color: string } | null => {
  const upperCode = code.toUpperCase();
  for (const type in BROKER_CLASSIFICATIONS) {
    if (BROKER_CLASSIFICATIONS[type as keyof typeof BROKER_CLASSIFICATIONS].includes(upperCode)) {
      let color = 'text-neutral-400 bg-neutral-700/20';
      if (type === 'Rich/Kuat') color = 'text-emerald-400 bg-emerald-500/10';
      if (type === 'Konglo Spesial') color = 'text-amber-400 bg-amber-500/10';
      if (type === 'Ampas/Ritel') color = 'text-rose-400 bg-rose-500/10';
      return { type, color };
    }
  }
  return { type: 'Campuran', color: 'text-neutral-400 bg-neutral-700/20' };
};

const App = (): ReactElement => {
  // --- STATE MANAGEMENT ---
  const [activeTab, setActiveTab] = useState<'intel' | 'tactical'>('intel');
  const [stockCode, setStockCode] = useState('');
  const [isFetchingProfile, setIsFetchingProfile] = useState(false);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const [orderBook, setOrderBook] = useState<OrderBookStatus>('Netral');
  const [tradeBook, setTradeBook] = useState<TradeBookStatus>('Netral');
  const [brokerSummary, setBrokerSummary] = useState<BrokerSummaryStatus>('Netral');
  const [topBroker, setTopBroker] = useState<BrokerInput>({ code: '', avgPrice: '' });
  const [currentPrice, setCurrentPrice] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  const [accentColor, setAccentColor] = useState('#FFC107'); // Default to gold
  const activeTheme = useMemo(() => generateThemeFromColor(accentColor), [accentColor]);
  const [showColorPicker, setShowColorPicker] = useState(false);

  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.innerHTML = `
      .focus-ring:focus {
        box-shadow: 0 0 0 2px ${activeTheme.focusRing};
      }
      ::selection {
        background-color: ${activeTheme.background};
      }
    `;
    document.head.appendChild(styleElement);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', activeTheme.main);
    return () => {
      document.head.removeChild(styleElement);
    };
  }, [activeTheme]);
  
  const brokerClassification = useMemo(() => getBrokerClassification(topBroker.code), [topBroker.code]);

  const handleReset = () => {
    setActiveTab('intel'); setStockCode(''); setIsFetchingProfile(false); setCompanyProfile(null);
    setOrderBook('Netral'); setTradeBook('Netral'); setBrokerSummary('Netral');
    setTopBroker({ code: '', avgPrice: '' }); setCurrentPrice(''); setLoading(false);
    setResult(null); setError(null);
  };

  const handleFetchProfile = async () => {
    if (!stockCode) return;
    setIsFetchingProfile(true); setError(null); setResult(null); setCompanyProfile(null);
    try {
      const profile = await fetchDetailedCompanyProfile(stockCode);
      setCompanyProfile(profile);
      setActiveTab('tactical');
    } catch (err: unknown) {
      if (err instanceof Error) { setError(err.message); } else { setError("Gagal mengambil profil perusahaan."); }
    } finally {
      setIsFetchingProfile(false);
    }
  };

  const handleAnalyze = async () => {
    if (!stockCode || !currentPrice || !companyProfile || !topBroker.code || !topBroker.avgPrice) return;
    setLoading(true); setResult(null); setError(null);
    const brokerClass = getBrokerClassification(topBroker.code);
    try {
      const input: AnalysisInput = { orderBook, tradeBook, brokerSummary, topBroker, stockCode, companyProfile, currentPrice: parseFloat(currentPrice), brokerClassification: brokerClass?.type };
      const data = await analyzeTrade(input);
      setResult(data);
    } catch (err: unknown) {
      if (err instanceof Error) { setError(err.message); } else { setError("Terjadi kesalahan yang tidak diketahui."); }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!result) return;
    const text = `*VELARC QUANTUM ANALYSIS: ${stockCode.toUpperCase()}*\n\nSignal: ${result.signal} (${result.signalName})\n\nAnalisa: ${result.analysis}\n\nAction: ${result.action}\nStyle: ${result.tradingStyle}\nTarget: ${result.target}\nStop Loss: ${result.cutLoss}\n\n_Generated by Velarc AI_`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const severityColors = { success: activeTheme.main, warning: activeTheme.main, error: '#f43f5e', info: activeTheme.main };
  const severityBg = {
    success: {backgroundImage: `linear-gradient(to bottom, ${activeTheme.background}, transparent)`, borderColor: activeTheme.border},
    warning: {backgroundImage: `linear-gradient(to bottom, ${activeTheme.background}, transparent)`, borderColor: activeTheme.border},
    error: {backgroundImage: 'linear-gradient(to bottom, rgba(244, 63, 94, 0.1), transparent)', borderColor: 'rgba(244, 63, 94, 0.3)'},
    info: {backgroundImage: `linear-gradient(to bottom, ${activeTheme.background}, transparent)`, borderColor: activeTheme.border},
  };

  return (
    <div className="min-h-screen text-neutral-200 font-sans pb-12">
      <div className="relative max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <header className="flex flex-row justify-between items-center gap-4 mb-8 md:mb-12">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="p-2.5 rounded-xl shadow-lg" style={{ background: `linear-gradient(to bottom right, ${activeTheme.gradientFrom}, ${activeTheme.gradientTo})`, boxShadow: `0 4px 14px 0 ${activeTheme.shadow}` }}><Zap className="text-black" size={18} /></div>
            <div><h1 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2">Velarc <span style={{color: activeTheme.main}}>AI</span> <span className="text-[10px] px-1.5 py-0.5 rounded font-black" style={{color: activeTheme.main, backgroundColor: activeTheme.background, borderColor: activeTheme.border, borderWidth: 1}}>PRO</span></h1></div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button onClick={() => setShowColorPicker(prev => !prev)} title="Customize Theme" className="flex items-center justify-center p-2 bg-neutral-900 border border-neutral-800 rounded-lg hover:bg-neutral-800 transition-all text-neutral-500 hover:text-neutral-300"><Paintbrush size={14} /></button>
              {showColorPicker && (
                <div className="absolute top-full right-0 mt-2 p-2 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200">
                   <input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="w-10 h-10 p-0 border-none rounded-md cursor-pointer bg-transparent" />
                </div>
              )}
            </div>
            <button onClick={handleReset} title="Reset All" className="flex items-center justify-center p-2 bg-neutral-900 border border-neutral-800 rounded-lg hover:bg-neutral-800 transition-all text-neutral-500 hover:text-neutral-300"><RefreshCcw size={14} /></button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start">
          <div className="lg:col-span-5 space-y-6">
            <div className="p-1.5 bg-neutral-900 border border-neutral-800 rounded-3xl flex gap-1.5">
              <button onClick={() => setActiveTab('intel')} className={`w-1/2 py-3 text-sm font-bold rounded-2xl transition-all ${activeTab === 'intel' ? 'text-neutral-500' : 'text-neutral-500 hover:bg-neutral-800/50'}`} style={activeTab === 'intel' ? {backgroundColor: activeTheme.background, color: activeTheme.main} : {}}>1. Company Intelligence</button>
              <button onClick={() => setActiveTab('tactical')} disabled={!companyProfile} className={`w-1/2 py-3 text-sm font-bold rounded-2xl transition-all ${activeTab === 'tactical' ? '' : 'text-neutral-700 cursor-not-allowed'}`} style={activeTab === 'tactical' ? {backgroundColor: activeTheme.background, color: activeTheme.main} : {}}>2. Tactical Analysis</button>
            </div>

            <div className={`p-5 md:p-6 bg-neutral-900/80 backdrop-blur-sm border border-neutral-800 rounded-[2rem] shadow-2xl space-y-6 ${activeTab !== 'intel' && 'hidden'}`}>
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2" style={{color: activeTheme.main}}><FileText size={14} /> Intelligence Gathering</h2>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-2"><Search size={12} /> Ticker Saham</label>
                <div className="flex gap-2">
                  <input type="text" maxLength={5} value={stockCode} onChange={(e) => setStockCode(e.target.value.toUpperCase())} placeholder="BBCA" className="w-full bg-black/50 border border-neutral-800 rounded-2xl px-4 py-4 text-white transition-all font-mono text-lg font-bold focus-ring"/>
                  <button onClick={handleFetchProfile} disabled={isFetchingProfile || !stockCode} className="px-5 text-black font-bold rounded-2xl transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed" style={{backgroundColor: activeTheme.main}}>{isFetchingProfile ? <Loader2 className="animate-spin" size={20}/> : <Search size={20} />}</button>
                </div>
              </div>
              {isFetchingProfile && <div className="text-center text-xs font-bold animate-pulse" style={{color: activeTheme.main}}>Memuat data intelijen perusahaan...</div>}
              {companyProfile && activeTab === 'intel' && (
                <div className="space-y-4 pt-4 border-t border-neutral-800 animate-in fade-in duration-500">
                   <h3 className="font-bold text-lg text-white uppercase">{companyProfile.companyName}</h3>
                   <div className="p-4 bg-black/50 border border-neutral-800 rounded-2xl space-y-2 text-xs">
                     <p className="flex items-start gap-3"><Rocket size={14} style={{color: activeTheme.main}} className="mt-0.5 shrink-0"/><span><strong className="text-neutral-400">The Enterprise:</strong> {companyProfile.enterpriseValue}</span></p>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                     <div className="p-4 bg-black/50 border border-neutral-800 rounded-2xl space-y-2 text-xs"><h4 className="font-bold text-neutral-500 text-[10px] uppercase tracking-wider flex items-center gap-2"><Scale size={12}/>Valuasi</h4><div className="font-mono space-y-1 pt-1 text-white"><p><strong>MCAP:</strong> {companyProfile.marketCap}</p><p><strong>P/E:</strong> {companyProfile.peRatio}</p><p><strong>P/BV:</strong> {companyProfile.pbvRatio}</p></div></div>
                     <div className="p-4 bg-black/50 border border-neutral-800 rounded-2xl space-y-2 text-xs"><h4 className="font-bold text-neutral-500 text-[10px] uppercase tracking-wider flex items-center gap-2"><Wind size={12}/>Kinerja</h4><div className="space-y-1 pt-1 text-neutral-300"><p>{companyProfile.capitalPerformance}</p><p className="mt-2 text-neutral-400">{companyProfile.marketVelocity}</p></div></div>
                   </div>
                   <div className="p-4 bg-black/50 border border-neutral-800 rounded-2xl space-y-2 text-xs text-neutral-300"><p><strong className="text-neutral-500">Berita:</strong> {companyProfile.recentNews}</p><p><strong className="text-neutral-500">Aksi Korporasi:</strong> {companyProfile.corporateActions}</p></div>
                   {companyProfile.officialSource && <a href={companyProfile.officialSource} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 py-2 text-xs transition-colors" style={{color: activeTheme.main}}><LinkIcon size={12}/> Kunjungi Situs Resmi</a>}
                </div>
              )}
            </div>
            
            <div className={`p-5 md:p-6 bg-neutral-900/80 backdrop-blur-sm border border-neutral-800 rounded-[2rem] shadow-2xl space-y-4 ${activeTab !== 'tactical' && 'hidden'}`}>
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2" style={{color: activeTheme.main}}><BarChart3 size={14} /> Tactical Data Input</h2>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2"><label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Order Book</label><div className="relative"><select value={orderBook} onChange={(e) => setOrderBook(e.target.value as OrderBookStatus)} className="w-full bg-black/50 border border-neutral-800 rounded-2xl px-4 py-3 text-white appearance-none transition-all font-bold text-sm focus-ring"><option>Netral</option><option>Bid Dominan</option><option>Ask Dominan</option></select><ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" /></div></div>
                 <div className="space-y-2"><label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Trade Book</label><div className="relative"><select value={tradeBook} onChange={(e) => setTradeBook(e.target.value as TradeBookStatus)} className="w-full bg-black/50 border border-neutral-800 rounded-2xl px-4 py-3 text-white appearance-none transition-all font-bold text-sm focus-ring"><option>Netral</option><option>Buy Dominan</option><option>Sell Dominan</option></select><ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none"/></div></div>
              </div>
              <div className="space-y-2"><label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider"><Users size={12} className="inline mr-1"/>Broker Summary</label><div className="relative"><select value={brokerSummary} onChange={(e) => setBrokerSummary(e.target.value as BrokerSummaryStatus)} className="w-full bg-black/50 border border-neutral-800 rounded-2xl px-4 py-3 text-white appearance-none transition-all font-bold text-sm focus-ring"><option>Netral</option><option>Big Accumulation</option><option>Big Distribution</option></select><ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" /></div></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider"><DollarSign size={12} className="inline mr-1"/>Last Price</label><input type="number" value={currentPrice} onChange={(e) => setCurrentPrice(e.target.value)} placeholder="9250" className="w-full bg-black/50 border border-neutral-800 rounded-2xl px-4 py-3 text-white font-mono text-base font-bold focus-ring"/></div>
                <div className="space-y-2"><div className="flex justify-between items-center mb-1 h-4"><label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Broker Kunci</label>{topBroker.code.length === 2 && brokerClassification && <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${brokerClassification.color}`}>{brokerClassification.type}</span>}</div><input type="text" maxLength={2} value={topBroker.code} onChange={(e) => setTopBroker({...topBroker, code: e.target.value.toUpperCase()})} placeholder="CODE" className="w-full bg-black/50 border border-neutral-800 rounded-2xl px-4 py-3 text-center text-white font-mono text-base font-bold uppercase focus-ring"/></div>
              </div>
              <div className="space-y-2"><label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">AVG Price Broker Kunci</label><input type="number" value={topBroker.avgPrice} onChange={(e) => setTopBroker({...topBroker, avgPrice: e.target.value})} placeholder="Avg. Price" className="w-full bg-black/50 border border-neutral-800 rounded-2xl px-4 py-3 text-white font-mono text-base font-bold focus-ring"/></div>
              <button onClick={handleAnalyze} disabled={loading || !currentPrice || !topBroker.code || !topBroker.avgPrice} className="w-full py-5 text-black font-black uppercase tracking-widest rounded-[1.5rem] shadow-2xl transition-all flex items-center justify-center gap-3 group active:scale-[0.98] mt-6 disabled:opacity-50 disabled:cursor-not-allowed" style={{background: `linear-gradient(to right, ${activeTheme.gradientFrom}, ${activeTheme.gradientTo})`, boxShadow: `0 8px 25px -5px ${activeTheme.shadow}`}}>{loading ? <><Loader2 className="animate-spin" size={20} /><span className="text-sm">Menganalisis...</span></> : <><span className="text-sm">Jalankan Analisis</span><TrendingUp size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" /></>}</button>
            </div>
          </div>

          <div className="lg:col-span-7">
            {error ? ( <div className="rounded-[2.5rem] border border-rose-500/30 bg-rose-500/10 p-1 shadow-2xl animate-in fade-in zoom-in duration-300"><div className="bg-neutral-900/80 backdrop-blur-3xl rounded-[2.3rem] p-8 md:p-12 text-center space-y-6"><div className="inline-flex p-4 rounded-full bg-rose-500/20 text-rose-500 mb-2"><AlertTriangle size={48} /></div><h3 className="text-2xl font-black text-white uppercase tracking-tight">Analisis Gagal</h3><div className="p-4 bg-black/50 rounded-xl border border-rose-500/20 text-rose-300 font-mono text-sm break-words">{error}</div><p className="text-neutral-500 text-sm leading-relaxed max-w-md mx-auto">Pastikan API_KEY telah diatur di Vercel Settings dan lakukan <strong>Redeploy</strong> jika diperlukan.</p></div></div> ) : 
            result ? ( <div className={`rounded-[2.5rem] border p-1 shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-700`} style={severityBg[result.severity]}><div className="bg-neutral-900/80 backdrop-blur-3xl rounded-[2.3rem] p-6 md:p-8 space-y-8 relative overflow-hidden"><button onClick={copyToClipboard} className="absolute top-6 right-6 p-3 bg-black/50 border border-neutral-800 rounded-2xl text-neutral-400 hover:text-white transition-all active:scale-90">{copied ? <Check size={20} className="text-emerald-500" /> : <Share2 size={20} />}</button><div className="flex flex-col items-center md:items-start text-center md:text-left pt-4"><div className="flex flex-col md:flex-row items-center gap-6"><div className={`p-5 rounded-full border-4`} style={result.signal === 'YA' ? {backgroundColor: activeTheme.background, borderColor: activeTheme.border, color: activeTheme.main} : {backgroundColor: 'rgba(244, 63, 94, 0.1)', borderColor: 'rgba(244, 63, 94, 0.2)', color: '#f43f5e'}}>{result.signal === 'YA' ? <CheckCircle2 size={48} /> : <XCircle size={48} />}</div><div><div className={`text-[10px] font-black uppercase tracking-[0.4em] mb-2`} style={{color: severityColors[result.severity]}}>Rekomendasi</div><h3 className={`text-4xl md:text-5xl font-black tracking-tight text-white uppercase`}>{result.signalName}</h3></div></div></div><div className="space-y-3 pt-6 border-t border-neutral-800"><h4 className="text-neutral-500 text-[9px] font-black uppercase tracking-widest flex items-center gap-2"><BarChart3 size={12} style={{color: activeTheme.main}} /> Laporan Analisis</h4><p className="text-neutral-200 leading-relaxed text-base whitespace-pre-line">{result.analysis}</p></div><div className="grid grid-cols-2 md:grid-cols-3 gap-4"><div className="md:col-span-3 p-5 bg-black/40 border border-neutral-800 rounded-3xl"><h4 className="text-neutral-500 text-[9px] font-black uppercase tracking-widest mb-3 flex items-center gap-2">{result.signal === 'YA' ? <TrendingUp size={12} style={{color: activeTheme.main}} /> : <TrendingDown size={12} className="text-rose-500" />} REKOMENDASI TAKTIS</h4><p className="text-white font-black text-xl md:text-2xl uppercase">{result.action}</p></div><div className="p-5 bg-black/40 border border-neutral-800 rounded-3xl"><h4 className="text-neutral-500 text-[9px] font-black uppercase tracking-widest mb-3 flex items-center gap-2"><Briefcase size={12} className="text-indigo-400" /> Trading Style</h4><p className={`font-bold ${result.tradingStyle === 'Wait & See' ? 'text-neutral-500' : 'text-white'}`}>{result.tradingStyle}</p></div><div className="p-5 bg-black/40 border border-neutral-800 rounded-3xl"><h4 className="text-neutral-500 text-[9px] font-black uppercase tracking-widest mb-3 flex items-center gap-2"><Target size={12} style={{color: activeTheme.main}}/> Target</h4><p className={`font-black text-2xl md:text-3xl`} style={{color: result.target === '-' ? '#404040' : activeTheme.main}}>{result.target}</p></div><div className="p-5 bg-rose-500/5 border border-rose-500/20 rounded-3xl"><h4 className="text-rose-400 text-[9px] font-black uppercase tracking-widest mb-3 flex items-center gap-2"><ShieldAlert size={12} /> Cut Loss</h4><p className={`font-black text-2xl md:text-3xl ${result.cutLoss === '-' ? 'text-neutral-700' : 'text-rose-500'}`}>{result.cutLoss}</p></div></div>
                  <div className="p-5 bg-black/50 border border-neutral-800 rounded-3xl flex gap-4 items-start"><AlertCircle style={{color: activeTheme.main}} className="shrink-0 mt-1" size={18} /><div><h5 className="text-neutral-500 text-[9px] font-black uppercase tracking-widest mb-1">Catatan Analis</h5><p className="text-neutral-400 text-xs leading-relaxed font-medium">{result.notes}</p></div></div>
                  <div className="p-5 bg-black/50 border border-indigo-500/20 rounded-3xl flex gap-4 items-start"><ShieldCheck className="text-indigo-400 shrink-0 mt-1" size={18} /><div><h5 className="text-neutral-500 text-[9px] font-black uppercase tracking-widest mb-1">Prinsip Operasional</h5><p className="text-neutral-400 text-xs leading-relaxed font-medium">Sistem ini adalah <strong>Alat Bantu Keputusan</strong>, bukan Peramal Otomatis. Akurasi output bergantung sepenuhnya pada kualitas input data Anda. Keputusan akhir dan segala risikonya adalah tanggung jawab Anda.</p></div></div>
                </div></div> ) : 
            ( <div className="h-full min-h-[400px] flex flex-col items-center justify-center p-8 md:p-12 bg-neutral-900/50 border-2 border-dashed border-neutral-800 rounded-[3rem] text-center space-y-6"><div className="p-8 bg-neutral-900 rounded-full border border-neutral-800 text-neutral-700"><Building size={64} /></div><div><h3 className="text-neutral-400 font-black text-xl md:text-2xl uppercase tracking-tighter">Sistem Menunggu Target</h3><p className="text-neutral-600 max-w-xs mx-auto text-xs md:text-sm leading-relaxed mt-2 font-medium">Mulai dengan memasukkan kode saham untuk proses pengumpulan intelijen awal.</p></div></div> )}
          </div>
        </div>

        <footer className="mt-16 md:mt-24 pt-8 border-t border-neutral-900 text-center flex flex-col items-center gap-2">
          <p className="text-neutral-700 text-[9px] uppercase tracking-[0.3em] font-black flex items-center justify-center gap-3"><span className="w-8 h-[1px] bg-neutral-800" />Quantum Engine v5.5 | Customizable Edition<span className="w-8 h-[1px] bg-neutral-800" /></p>
          <p className="text-[10px] font-black uppercase tracking-[0.6em] animate-pulse" style={{color: activeTheme.main + '66'}}>Engineered by Alfian</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
