
export type OrderBookStatus = 'Bid Dominan' | 'Ask Dominan' | 'Netral';
export type TradeBookStatus = 'Buy Dominan' | 'Sell Dominan' | 'Netral';
export type BrokerSummaryStatus = 'Big Accumulation' | 'Big Distribution' | 'Netral';

export interface BrokerInput {
  code: string;
  avgPrice: string;
}

export interface CompanyProfile {
  companyName: string;
  sector: string;
  industry: string;
  marketCap: string;
  peRatio: string;
  pbvRatio: string;
  majorShareholders: string;
  recentNews: string;
  corporateActions: string;
  director: string;
  enterpriseValue: string;
  capitalPerformance: string;
  marketVelocity: string;
  officialSource: string;
}

export interface AnalysisInput {
  orderBook: OrderBookStatus;
  tradeBook: TradeBookStatus;
  brokerSummary: BrokerSummaryStatus;
  topBroker: BrokerInput;
  stockCode: string;
  currentPrice: number;
  companyProfile: CompanyProfile;
  brokerClassification?: string;
}

export interface AnalysisResult {
  signal: 'YA' | 'TIDAK';
  signalName: string;
  analysis: string;
  action: string;
  target: string;
  timeframe: string;
  cutLoss: string;
  notes: string;
  severity: 'success' | 'warning' | 'error' | 'info';
  tradingStyle: 'Day Trading' | 'Swing' | 'Short-term Momentum' | 'Wait & See';
}

export interface MindNode {
  id: string;
  x: number;
  y: number;
  label: string;
  type: 'root' | 'child';
  isLoading?: boolean;
  imageUrl?: string;
}
