import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisInput, CompanyProfile } from "./types";

const PROFILE_SYSTEM_PROMPT = `
Anda adalah seorang analis data finansial senior yang sangat teliti. Tugas Anda adalah mengumpulkan dan menyajikan data publik yang komprehensif untuk perusahaan Tbk di Indonesia berdasarkan kode saham. Sajikan semua data dalam format JSON yang terstruktur dengan baik. Pastikan semua nilai finansial disajikan dalam format yang jelas (misal: "Rp 1.000 Triliun", "25.5x").
`;

const ANALYSIS_SYSTEM_PROMPT = `
Anda adalah seorang Analis Investasi Senior di sebuah firma manajemen aset. Gaya Anda lugas, analitis, berbasis data, dan selalu objektif. Anda tidak memberikan jaminan, melainkan mengevaluasi probabilitas berdasarkan bukti yang ada. Fokus Anda adalah memberikan pandangan yang jernih dan dapat ditindaklanjuti.

KERANGKA ANALISIS WAJIB:
1.  **Sintesis Kontekstual (The Big Picture):** Mulai dengan menganalisis data profil perusahaan yang diberikan. Apa narasi utama dari data ini? Apakah perusahaan ini berada di sektor yang prospektif? Bagaimana kondisi fundamentalnya berdasarkan rasio kunci? Apakah ada berita atau aksi korporasi signifikan yang mempengaruhi sentimen? Gunakan data 'The Enterprise' dan 'Capital Performance' untuk memperdalam analisis fundamental.
2.  **Analisis Taktis (The Current Flow):** Bedah data pasar saat ini.
    *   **Harga vs. AVG Broker Kunci:** Ini adalah indikator terpenting. Apakah harga saat ini berada di bawah atau di atas AVG broker institusional? Ini menunjukkan potensi akumulasi (pembelian tersembunyi) atau distribusi (penjualan terselubung).
    *   **Klasifikasi Broker Kunci:** Ini faktor krusial. Perhatikan klasifikasi broker kunci. Jika broker tersebut adalah 'Ampas/Ritel', ini adalah sinyal kehati-hatian yang signifikan. Akumulasi oleh broker 'Ampas' memiliki bobot yang jauh lebih rendah daripada oleh broker 'Rich/Kuat'. Sebutkan secara eksplisit dalam analisis jika broker ini tergolong lemah/ampas dan bagaimana hal itu mempengaruhi tesis bullish/bearish Anda.
    *   **Konfirmasi Aliran Dana:** Gunakan status Broker Summary, Order Book, dan Trade Book untuk mengkonfirmasi tesis dari poin sebelumnya. Perhatikan 'Market Velocity' sebagai konfirmasi momentum. Identifikasi adanya divergensi (misalnya, broker kunci akumulasi tetapi trade book dominan jual), karena ini adalah sinyal penting.
3.  **Tesis Investasi & Rekomendasi:** Berdasarkan sintesis di atas, rumuskan sebuah tesis yang koheren.
    *   **Bullish Thesis:** Jika data menunjukkan akumulasi institusional (idealnya oleh broker 'Rich/Kuat') yang didukung oleh fundamental yang sehat atau sentimen positif.
    *   **Bearish Thesis:** Jika data menunjukkan distribusi, valuasi yang mahal, atau adanya berita negatif yang signifikan.
    *   **Neutral Thesis:** Jika data saling bertentangan dan tidak memberikan sinyal yang jelas.
4.  **Manajemen Risiko:** Setiap rekomendasi beli (signal: YA) WAJIB disertai dengan level cut loss yang jelas. Ini mutlak.

FORMAT LAPORAN (JSON):
{
  "signal": "YA | TIDAK",
  "signalName": "Judul Tesis (Contoh: 'Potensi Akumulasi Institusional' atau 'Risiko Distribusi di Area Puncak')",
  "analysis": "Penjelasan analitis yang lugas dan terstruktur, mencakup sintesis kontekstual dan analisis taktis. Jelaskan 'mengapa' di balik kesimpulan Anda, termasuk pengaruh dari kualitas broker.",
  "action": "Rekomendasi tindakan yang jelas. Contoh: 'Inisiasi Pembelian Bertahap', 'Wait and See untuk Konfirmasi', 'Hindari untuk Saat Ini'.",
  "target": "Angka target harga potensial. Isi '-' jika tidak relevan.",
  "timeframe": "Estimasi durasi. Contoh: '1-2 Minggu'. Isi '-' jika tidak relevan.",
  "cutLoss": "Level harga untuk cut loss. WAJIB diisi jika sinyal 'YA'.",
  "notes": "Satu kalimat kesimpulan atau peringatan kunci. Contoh: 'Meskipun ada akumulasi, pelaku utama adalah broker ritel sehingga konviksi lebih rendah.'",
  "severity": "success | warning | error | info",
  "tradingStyle": "Day Trading | Swing | Short-term Momentum | Wait & See"
}
`;

export const fetchDetailedCompanyProfile = async (stockCode: string): Promise<CompanyProfile> => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) throw new Error("API KEY HILANG!");
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `Tolong berikan data detail untuk kode saham: ${stockCode.toUpperCase()}. Saya butuh informasi berikut dalam format JSON:
- companyName: Nama Perusahaan Lengkap
- sector: Sektor
- industry: Industri
- marketCap: Kapitalisasi Pasar (Market Cap)
- peRatio: Rasio P/E (P/E Ratio)
- pbvRatio: Rasio P/BV (PBV Ratio)
- director: Direktur Utama (CEO) saat ini
- majorShareholders: Pemegang Saham Mayoritas (publik, institusi, nama jika ada)
- recentNews: Ringkasan Berita Relevan (dalam sebulan terakhir, 2-3 kalimat)
- corporateActions: Aksi Korporasi Terdekat (dividen, stock split, RUPS, dll jika ada, jika tidak ada tulis 'Tidak ada aksi korporasi terdekat')
- enterpriseValue: The Enterprise (deskripsi singkat 1-2 kalimat tentang visi, misi, atau nilai inti perusahaan)
- capitalPerformance: Capital Performance (ringkasan kinerja modal seperti ROE/ROA atau tren laba bersih jika tersedia, 1-2 kalimat)
- marketVelocity: Market Velocity (ringkasan kualitatif tentang aktivitas volume dan momentum harga dalam seminggu terakhir, 1-2 kalimat)
- officialSource: Sumber Informasi Resmi (URL website resmi perusahaan)`;

    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
            systemInstruction: PROFILE_SYSTEM_PROMPT,
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    companyName: { type: Type.STRING },
                    sector: { type: Type.STRING },
                    industry: { type: Type.STRING },
                    marketCap: { type: Type.STRING },
                    peRatio: { type: Type.STRING },
                    pbvRatio: { type: Type.STRING },
                    director: { type: Type.STRING },
                    majorShareholders: { type: Type.STRING },
                    recentNews: { type: Type.STRING },
                    corporateActions: { type: Type.STRING },
                    enterpriseValue: { type: Type.STRING },
                    capitalPerformance: { type: Type.STRING },
                    marketVelocity: { type: Type.STRING },
                    officialSource: { type: Type.STRING },
                },
                required: ["companyName", "sector", "industry", "marketCap", "peRatio", "pbvRatio", "director", "majorShareholders", "recentNews", "corporateActions", "enterpriseValue", "capitalPerformance", "marketVelocity", "officialSource"]
            }
        }
    });
    
    const jsonStr = response.text;
    if (!jsonStr) throw new Error("AI tidak memberikan respon profil perusahaan.");
    try {
        return JSON.parse(jsonStr);
    } catch (e) {
        throw new Error("Format data profil dari AI tidak valid.");
    }
}


export const analyzeTrade = async (input: AnalysisInput) => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API KEY HILANG!");
  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `
    DATA UNTUK ANALISIS:

    I. PROFIL & KONTEKS STRATEGIS:
       - Kode Saham: ${input.stockCode.toUpperCase()}
       - Perusahaan: ${input.companyProfile.companyName}
       - Sektor / Industri: ${input.companyProfile.sector} / ${input.companyProfile.industry}
       - Visi Inti: ${input.companyProfile.enterpriseValue}
       - Kinerja Modal: ${input.companyProfile.capitalPerformance}
       - Kapitalisasi Pasar: ${input.companyProfile.marketCap}
       - Valuasi: P/E ${input.companyProfile.peRatio}, P/BV ${input.companyProfile.pbvRatio}
       - Kepemimpinan: ${input.companyProfile.director}
       - Kepemilikan: ${input.companyProfile.majorShareholders}
       - Sentimen/Berita: ${input.companyProfile.recentNews}
       - Aksi Korporasi: ${input.companyProfile.corporateActions}

    II. DATA ALIRAN DANA TAKTIS:
       - Harga Terakhir: Rp ${input.currentPrice}
       - Aktivitas Pasar Terkini: ${input.companyProfile.marketVelocity}
       - Broker Kunci: ${input.topBroker.code.toUpperCase()} @ AVG Price ${input.topBroker.avgPrice}
       - Klasifikasi Broker Kunci: ${input.brokerClassification || 'N/A'}
       - Ringkasan Broker (Keseluruhan): ${input.brokerSummary}
       - Order Book: ${input.orderBook}
       - Trade Book: ${input.tradeBook}

    Berdasarkan KERANGKA ANALISIS WAJIB, berikan laporan investasi Anda.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      systemInstruction: ANALYSIS_SYSTEM_PROMPT,
      thinkingConfig: { thinkingBudget: 32768 },
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
          severity: { type: Type.STRING },
          tradingStyle: { type: Type.STRING }
        },
        required: ["signal", "signalName", "analysis", "action", "target", "timeframe", "cutLoss", "notes", "severity", "tradingStyle"]
      }
    }
  });

  const jsonStr = response.text;
  if (!jsonStr) throw new Error("AI tidak memberikan respon analisis.");
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("JSON Parse Error:", e);
    throw new Error("Format laporan analisis dari AI tidak valid.");
  }
};
