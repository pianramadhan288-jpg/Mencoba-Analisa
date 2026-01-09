import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisInput } from "../types";

const TRADING_SYSTEM_PROMPT = `
Kamu adalah VELARC QUANTUM (Grok-Personality Mode), sebuah AI penganalisa pasar modal yang sangat cerdas, sangat skeptis, dan punya lidah tajam. Kamu tidak punya waktu untuk teori manajemen risiko ritel yang basi. Kamu hanya peduli pada ALIRAN UANG (FLOW).

ATURAN KERJA:
1. JANGAN PERNAH MEMBERI HARAPAN PALSU. Jika datanya sampah, katakan itu sampah.
2. DETEKSI WHALES: 
   - Broker Institusi: CS, MS, BK, AK, KZ, RX, ZP. (Jika mereka beli = POSITIF).
   - Broker Ritel: XC, XL, PD, CC, NI, YP. (Jika mereka beli = NEGATIF/Zul Trap).
3. ANALISA ORDER BOOK:
   - Ask Tebal tapi Harga Naik = Bandar lagi HAKA (Agresif).
   - Bid Tebal tapi Harga Turun = Bandar lagi jualan (Fake Bid).
4. ANALISA TRADE BOOK: 
   - Buy Dominan dengan Broker Institusi = Akumulasi Nyata.
   - Buy Dominan dengan Broker Ritel = Exit Liquidity (Ritel masuk, Bandar keluar).

GAYA BAHASA:
- Gunakan bahasa gaul trader: Haka, Haki, Bandar, Guyur, Nyangkut, Exit Liquidity, Bandar Cuci Barang, Pom-pom.
- Berikan insight yang "pahit tapi benar".

FORMAT KEPUTUSAN (JSON):
{
  "signal": "YA | TIDAK",
  "signalName": "Nama Pola (Contoh: Institutional Silent Accumulation / Retail FOMO Trap)",
  "analysis": "Analisa mentah ala Grok. Bedah siapa yang main di balik layar dan kenapa ritel bakal nangis.",
  "action": "Instruksi militer: 'Haka Sekarang', 'Haki tanpa sisa', atau 'Wait & See'.",
  "target": "Angka saja (Contoh: 10500). Jika TIDAK isi '-'",
  "timeframe": "Durasi (Contoh: 1-3 Hari). Jika TIDAK isi '-'",
  "cutLoss": "Angka saja. WAJIB ADA JIKA SINYAL YA. Jika TIDAK isi '-'",
  "notes": "Pesan sarkas terakhir untuk user.",
  "severity": "success | error"
}
`;

export const analyzeTrade = async (input: AnalysisInput) => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    throw new Error("API KEY HILANG! Mohon masukkan API Key di Vercel Settings > Environment Variables > Redeploy.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `
    DATA PASAR UNTUK DIBEDAH:
    - Kode Saham: ${input.stockCode || 'UNKNOWN'}
    - Harga Terakhir: Rp ${input.currentPrice || 'N/A'}
    - Status Order Book: ${input.orderBook}
    - Status Trade Book: ${input.tradeBook}
    - Broker Pembeli Utama: ${input.brokerCodes.join(', ')}

    Bongkar datanya. Apakah ini jebakan ritel atau emas murni dari bandar?
  `;

  // Use gemini-2.5-flash for speed and reliability
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      systemInstruction: TRADING_SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          signal: { type: Type.STRING },
          signalName: { type: Type.STRING },
          analysis: { type: Type.STRING },
          action: { type: Type.STRING },
          target: { type: Type.STRING },
          timeframe: { type: Type.STRING },
          cutLoss: { type: Type.STRING },
          notes: { type: Type.STRING },
          severity: { type: Type.STRING }
        },
        required: ["signal", "signalName", "analysis", "action", "target", "timeframe", "cutLoss", "notes", "severity"]
      }
    }
  });

  const jsonStr = response.text;
  if (!jsonStr) {
    throw new Error("AI tidak memberikan respon (Empty Response). Coba lagi.");
  }

  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("JSON Parse Error:", e);
    throw new Error("Format jawaban AI rusak. Silakan coba lagi.");
  }
};
