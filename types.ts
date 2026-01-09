
export type OrderBookStatus = 'Bid Dominan' | 'Ask Dominan' | 'Netral';
export type TradeBookStatus = 'Buy Dominan' | 'Sell Dominan' | 'Netral';

export interface AnalysisInput {
  orderBook: OrderBookStatus;
  tradeBook: TradeBookStatus;
  brokerCodes: string[];
  stockCode?: string;
  currentPrice?: number;
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
}

/**
 * MindNode interface representing a node in a mind map or visualization.
 * Fixes: Module '"../types"' has no exported member 'MindNode'.
 */
export interface MindNode {
  id: string;
  label: string;
  x: number;
  y: number;
  type: 'root' | 'child' | string;
  isLoading?: boolean;
  imageUrl?: string;
}
