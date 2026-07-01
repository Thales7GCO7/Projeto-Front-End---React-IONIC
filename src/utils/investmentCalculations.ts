import { StockPoint } from "../services/AlphaVantage.service";
import { regressaoLinear } from "./RegressaoLinear";

export interface AnalysisResult {
  currentPrice: number;
  priceChange: number;
  priceChangePercent: number;
  totalReturn: number;
  roi: number;
  cagr: number;
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  sma20: number;
  sma50: number;
  sma200: number;
  rsi: number;
  macd: number;
  macdSignal: number;
  macdHistogram: number;
  upperBollinger: number;
  lowerBollinger: number;
  avgDailyReturn: number;
  medianPrice: number;
  variance: number;
  trendStrength: number;
  trendDirection: "alta" | "baixa" | "lateral";
  volumeAvg: number;
  highPrice: number;
  lowPrice: number;
}

export function calculateReturns(prices: number[]): number[] {
  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
  }
  return returns;
}

export function calculateSMA(prices: number[], period: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      result.push(NaN);
    } else {
      const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      result.push(sum / period);
    }
  }
  return result;
}

export function calculateEMA(prices: number[], period: number): number[] {
  const result: number[] = [];
  const multiplier = 2 / (period + 1);
  const sma = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
  result.push(sma);
  for (let i = period; i < prices.length; i++) {
    const ema = (prices[i] - result[result.length - 1]) * multiplier + result[result.length - 1];
    result.push(ema);
  }
  return result;
}

export function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) return 50;
  const recent = prices.slice(-period - 1);
  let gains = 0;
  let losses = 0;
  for (let i = 1; i < recent.length; i++) {
    const diff = recent[i] - recent[i - 1];
    if (diff > 0) gains += diff;
    else losses -= diff;
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  return 100 - 100 / (1 + avgGain / avgLoss);
}

export function calculateMACD(prices: number[]): { macd: number; signal: number; histogram: number } {
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  if (ema12.length === 0 || ema26.length === 0) return { macd: 0, signal: 0, histogram: 0 };
  const macdLine = ema12[ema12.length - 1] - ema26[ema26.length - 1];
  const macdValues: number[] = [];
  const startIdx = Math.max(26, prices.length - 60);
  for (let i = startIdx; i < prices.length; i++) {
    const e12 = calculateEMA(prices.slice(0, i + 1), 12);
    const e26 = calculateEMA(prices.slice(0, i + 1), 26);
    if (e12.length > 0 && e26.length > 0) {
      macdValues.push(e12[e12.length - 1] - e26[e26.length - 1]);
    }
  }
  const signal = macdValues.length >= 9
    ? macdValues.slice(-9).reduce((a, b) => a + b, 0) / 9
    : macdValues.reduce((a, b) => a + b, 0) / macdValues.length;
  return { macd: macdLine, signal, histogram: macdLine - signal };
}

export function calculateRSIArray(prices: number[], period: number = 14): (number | null)[] {
  if (prices.length < period + 1) return prices.map(() => null);
  const result: (number | null)[] = new Array(period).fill(null);
  let gains = 0;
  let losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff > 0) gains += diff;
    else losses -= diff;
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;
  for (let i = period; i < prices.length; i++) {
    if (i > period) {
      const diff = prices[i] - prices[i - 1];
      avgGain = (avgGain * (period - 1) + (diff > 0 ? diff : 0)) / period;
      avgLoss = (avgLoss * (period - 1) + (diff < 0 ? -diff : 0)) / period;
    }
    if (avgLoss === 0) result.push(100);
    else result.push(100 - 100 / (1 + avgGain / avgLoss));
  }
  return result;
}

export function calculateMACDArray(prices: number[]): { macd: (number | null)[]; signal: (number | null)[]; histogram: (number | null)[] } {
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  const macdLine: (number | null)[] = [];
  const signalLine: (number | null)[] = [];
  const histogram: (number | null)[] = [];

  for (let i = 0; i < prices.length; i++) {
    if (i < 25) {
      macdLine.push(null);
      signalLine.push(null);
      histogram.push(null);
    } else {
      const val = ema12[i - 11] - ema26[i - 25];
      macdLine.push(val);
      if (i < 33) {
        signalLine.push(null);
        histogram.push(null);
      } else {
        const sig = macdLine.slice(-9).filter((v): v is number => v !== null).reduce((a, b) => a + b, 0) / 9;
        signalLine.push(sig);
        histogram.push(val - sig);
      }
    }
  }
  return { macd: macdLine, signal: signalLine, histogram };
}

export function calculateBollingerBands(prices: number[], period: number = 20): { upper: number; lower: number; middle: number } {
  const smaArr = calculateSMA(prices, period);
  const currentSMA = smaArr[smaArr.length - 1];
  if (isNaN(currentSMA)) return { upper: 0, lower: 0, middle: 0 };
  const recentPrices = prices.slice(-period);
  const variance = recentPrices.reduce((sum, p) => sum + Math.pow(p - currentSMA, 2), 0) / period;
  const stdDev = Math.sqrt(variance);
  return { upper: currentSMA + 2 * stdDev, lower: currentSMA - 2 * stdDev, middle: currentSMA };
}

export function calculateMaxDrawdown(prices: number[]): number {
  let peak = prices[0];
  let maxDD = 0;
  for (const price of prices) {
    if (price > peak) peak = price;
    const dd = (peak - price) / peak;
    if (dd > maxDD) maxDD = dd;
  }
  return maxDD;
}

export function calculateVolatility(prices: number[]): number {
  const returns = calculateReturns(prices);
  if (returns.length === 0) return 0;
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  return Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length);
}

export function calculateSharpeRatio(prices: number[], riskFreeRate: number = 0.05): number {
  const returns = calculateReturns(prices);
  if (returns.length === 0) return 0;
  const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const vol = calculateVolatility(prices);
  if (vol === 0) return 0;
  return (meanReturn * 252 - riskFreeRate) / (vol * Math.sqrt(252));
}

export function calculateCAGR(prices: number[]): number {
  if (prices.length < 2) return 0;
  const years = (prices.length - 1) / 252;
  if (years <= 0) return 0;
  return Math.pow(prices[prices.length - 1] / prices[0], 1 / years) - 1;
}

export function analyzeStock(data: StockPoint[]): AnalysisResult | null {
  if (data.length < 2) return null;

  const prices = data.map(d => d.close);
  const volumes = data.map(d => d.volume);
  const lastPrice = prices[prices.length - 1];
  const firstPrice = prices[0];

  const sma20Arr = calculateSMA(prices, 20);
  const sma50Arr = calculateSMA(prices, 50);
  const sma200Arr = calculateSMA(prices, 200);
  const sma20 = sma20Arr[sma20Arr.length - 1];
  const sma50 = sma50Arr[sma50Arr.length - 1];
  const sma200 = sma200Arr[sma200Arr.length - 1];

  const rsi = calculateRSI(prices);
  const { macd, signal, histogram } = calculateMACD(prices);
  const { upper, lower } = calculateBollingerBands(prices);
  const returns = calculateReturns(prices);
  const avgDailyReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;

  const sorted = [...prices].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];

  const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
  const variance = prices.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / prices.length;

  const { inclinacao } = regressaoLinear(prices);
  const trendStrength = prices.length > 1 ? inclinacao / firstPrice : 0;

  let trendDirection: "alta" | "baixa" | "lateral";
  if (trendStrength > 0.002) trendDirection = "alta";
  else if (trendStrength < -0.002) trendDirection = "baixa";
  else trendDirection = "lateral";

  const volumeAvg = volumes.reduce((a, b) => a + b, 0) / volumes.length;
  const highPrice = Math.max(...prices);
  const lowPrice = Math.min(...prices);
  const priceChange = lastPrice - firstPrice;
  const priceChangePercent = firstPrice !== 0 ? priceChange / firstPrice : 0;

  return {
    currentPrice: lastPrice,
    priceChange,
    priceChangePercent,
    totalReturn: (lastPrice - firstPrice) / firstPrice,
    roi: firstPrice !== 0 ? (lastPrice - firstPrice) / firstPrice : 0,
    cagr: calculateCAGR(prices),
    volatility: calculateVolatility(prices),
    sharpeRatio: calculateSharpeRatio(prices),
    maxDrawdown: calculateMaxDrawdown(prices),
    sma20: isNaN(sma20) ? lastPrice : sma20,
    sma50: isNaN(sma50) ? lastPrice : sma50,
    sma200: isNaN(sma200) ? lastPrice : sma200,
    rsi,
    macd,
    macdSignal: signal,
    macdHistogram: histogram,
    upperBollinger: upper,
    lowerBollinger: lower,
    avgDailyReturn,
    medianPrice: median,
    variance,
    trendStrength,
    trendDirection,
    volumeAvg,
    highPrice,
    lowPrice,
  };
}
