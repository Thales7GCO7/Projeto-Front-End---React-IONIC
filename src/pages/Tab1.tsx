import { IonContent, IonPage } from '@ionic/react';
import { useEffect, useState } from "react";
import { Chart } from "react-google-charts";
import { buscarAcao, StockPoint } from "../services/AlphaVantage.service";
import {
  analyzeStock, AnalysisResult, calculateSMA,
  calculateRSIArray, calculateMACDArray
} from "../utils/investmentCalculations";
import { generateReport, InvestmentReport } from "../utils/investmentReport";
import "./Tab1.css";

const Tab1: React.FC = () => {
  const [simbolo, setSimbolo] = useState("NVDA");
  const [inputSimbolo, setInputSimbolo] = useState("NVDA");
  const [dataPoints, setDataPoints] = useState<StockPoint[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [report, setReport] = useState<InvestmentReport | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [mostrarRelatorio, setMostrarRelatorio] = useState(false);

  useEffect(() => {
    async function carregar() {
      setCarregando(true);
      setMostrarRelatorio(false);
      const resultado = await buscarAcao(simbolo);
      setDataPoints(resultado);
      setCarregando(false);
    }
    carregar();
  }, [simbolo]);

  useEffect(() => {
    if (dataPoints.length >= 2) {
      const result = analyzeStock(dataPoints);
      setAnalysis(result);
      if (result) {
        setReport(generateReport(result));
      }
    }
  }, [dataPoints]);

  function handleSearch() {
    if (inputSimbolo.trim() !== "") {
      setSimbolo(inputSimbolo.trim().toUpperCase());
    }
  }

  const prices = dataPoints.map(d => d.close);
  const sma20Arr = calculateSMA(prices, 20);
  const sma50Arr = calculateSMA(prices, 50);
  const rsiArr = calculateRSIArray(prices, 14);
  const macdArr = calculateMACDArray(prices);

  const priceChartData = () => {
    if (dataPoints.length < 2 || !analysis) return [];
    const rows = dataPoints.map((dp, index) => [
      new Date(dp.date),
      dp.close,
      isNaN(sma20Arr[index]) ? null : sma20Arr[index],
      isNaN(sma50Arr[index]) ? null : sma50Arr[index],
      analysis.upperBollinger,
      analysis.lowerBollinger,
    ]);
    return [
      ["Data", "Preço", "SMA20", "SMA50", "Bollinger Sup", "Bollinger Inf"],
      ...rows,
    ];
  };

  const volumeChartData = () => {
    if (dataPoints.length < 2) return [];
    const rows = dataPoints.map((dp) => [new Date(dp.date), dp.volume]);
    return [["Data", "Volume"], ...rows];
  };

  const rsiChartData = () => {
    if (dataPoints.length < 2) return [];
    const rows = dataPoints.map((dp, index) => [
      new Date(dp.date),
      rsiArr[index],
    ]);
    return [["Data", "RSI"], ...rows];
  };

  const macdChartData = () => {
    if (dataPoints.length < 2) return [];
    const rows = dataPoints.map((dp, index) => [
      new Date(dp.date),
      macdArr.macd[index],
      macdArr.signal[index],
      macdArr.histogram[index],
    ]);
    return [["Data", "MACD", "Sinal", "Histograma"], ...rows];
  };

  const baseChartTheme = {
    backgroundColor: "transparent",
    chartArea: { width: "92%", height: "72%" },
    legend: { position: "top" as const, textStyle: { color: "#b0bec5", fontSize: 11 } },
    hAxis: {
      format: "dd/MM",
      textStyle: { color: "#78909c", fontSize: 10 },
      gridlines: { color: "#1a2332" },
      minorGridlines: { color: "#111b26" },
    },
    vAxis: {
      textStyle: { color: "#78909c", fontSize: 10 },
      gridlines: { color: "#1a2332" },
      minorGridlines: { color: "#111b26" },
    },
  };

  const priceOptions = {
    ...baseChartTheme,
    title: `${simbolo} — Preço & Indicadores`,
    titleTextStyle: { color: "#eceff1", fontSize: 13 },
    legend: { position: "top" as const, textStyle: { color: "#b0bec5", fontSize: 11 } },
    colors: ["#4dd0e1", "#ffb74d", "#ab47bc", "#37474f", "#37474f"],
    series: {
      1: { lineDashStyle: [6, 3] as number[] },
      2: { lineDashStyle: [3, 3] as number[] },
      3: { lineDashStyle: [1, 2] as number[], enableInteractivity: false, color: "#455a64" },
      4: { lineDashStyle: [1, 2] as number[], enableInteractivity: false, color: "#455a64" },
    },
    curveType: "function" as const,
    lineWidth: 2,
    areaOpacity: 0.04,
    vAxis: {
      ...baseChartTheme.vAxis,
      title: "Preço (USD)",
      titleTextStyle: { color: "#90a4ae", fontSize: 11 },
    },
    hAxis: {
      ...baseChartTheme.hAxis,
      title: "",
    },
    explorer: { actions: ["dragToZoom", "rightClickToReset"], keepInBounds: true },
  };

  const volumeOptions = {
    ...baseChartTheme,
    title: "Volume",
    titleTextStyle: { color: "#eceff1", fontSize: 11 },
    legend: "none" as const,
    colors: ["#4dd0e1"],
    vAxis: {
      ...baseChartTheme.vAxis,
      format: "compact",
      title: "",
    },
    hAxis: {
      ...baseChartTheme.hAxis,
      title: "",
    },
    enableInteractivity: false,
  };

  const rsiOptions = {
    ...baseChartTheme,
    title: "RSI (14)",
    titleTextStyle: { color: "#eceff1", fontSize: 11 },
    legend: "none" as const,
    colors: ["#ce93d8"],
    curveType: "function" as const,
    lineWidth: 1.5,
    vAxis: {
      ...baseChartTheme.vAxis,
      title: "",
      minValue: 0,
      maxValue: 100,
      viewWindow: { min: 0, max: 100 },
    },
    hAxis: {
      ...baseChartTheme.hAxis,
      title: "",
    },
    chartArea: { width: "92%", height: "65%" },
    series: {
      0: { areaOpacity: 0.08 },
    },
  };

  const macdOptions = {
    ...baseChartTheme,
    title: "MACD",
    titleTextStyle: { color: "#eceff1", fontSize: 11 },
    legend: { position: "top" as const, textStyle: { color: "#b0bec5", fontSize: 10 } },
    colors: ["#4dd0e1", "#ffb74d", "#78909c"],
    series: {
      0: { lineWidth: 1.5 },
      1: { lineWidth: 1, lineDashStyle: [3, 3] as number[] },
      2: { lineWidth: 0, visibleInLegend: false },
    },
    curveType: "function" as const,
    vAxis: {
      ...baseChartTheme.vAxis,
      title: "",
    },
    hAxis: {
      ...baseChartTheme.hAxis,
      title: "",
    },
    chartArea: { width: "92%", height: "65%" },
  };

  function formatCurrency(value: number): string {
    return value.toLocaleString("en-US", { style: "currency", currency: "USD" });
  }

  function formatPercent(value: number): string {
    return (value >= 0 ? "+" : "") + (value * 100).toFixed(2) + "%";
  }

  return (
    <IonPage>
      <IonContent fullscreen className="invest-page">
        <div className="invest-container">
          {/* Header */}
          <div className="invest-header">
            <div className="invest-header-top">
              <h1 className="invest-title">Análise de Investimentos</h1>
              <div className="invest-search">
                <input
                  className="invest-search-input"
                  value={inputSimbolo}
                  onChange={(e) => setInputSimbolo(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="Ticker (ex: AAPL, TSLA, NVDA)"
                />
                <button className="invest-search-btn" onClick={handleSearch}>
                  Buscar
                </button>
              </div>
            </div>
          </div>

          {carregando && (
            <div className="invest-loading">
              <div className="spinner" />
              <span>Carregando dados de {simbolo}...</span>
            </div>
          )}

          {!carregando && analysis && report && (
            <>
              {/* Ticker Banner */}
              <div className="invest-ticker-banner">
                <div className="ticker-symbol">{simbolo}</div>
                <div className="ticker-price">
                  {formatCurrency(analysis.currentPrice)}
                  <span className={`ticker-change ${analysis.priceChange >= 0 ? "positive" : "negative"}`}>
                    {formatPercent(analysis.priceChangePercent)}
                  </span>
                </div>
                <div className={`ticker-trend trend-${analysis.trendDirection}`}>
                  Tendência de {analysis.trendDirection === "alta" ? "Alta ↗" : analysis.trendDirection === "baixa" ? "Baixa ↘" : "Lateral →"}
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="invest-metrics">
                <div className="metric-card">
                  <span className="metric-label">Máxima</span>
                  <span className="metric-value">{formatCurrency(analysis.highPrice)}</span>
                </div>
                <div className="metric-card">
                  <span className="metric-label">Mínima</span>
                  <span className="metric-value">{formatCurrency(analysis.lowPrice)}</span>
                </div>
                <div className="metric-card">
                  <span className="metric-label">ROI Total</span>
                  <span className={`metric-value ${analysis.roi >= 0 ? "positive" : "negative"}`}>
                    {formatPercent(analysis.roi)}
                  </span>
                </div>
                <div className="metric-card">
                  <span className="metric-label">CAGR</span>
                  <span className={`metric-value ${analysis.cagr >= 0 ? "positive" : "negative"}`}>
                    {formatPercent(analysis.cagr)}
                  </span>
                </div>
                <div className="metric-card">
                  <span className="metric-label">RSI (14)</span>
                  <span className={`metric-value ${analysis.rsi > 70 ? "negative" : analysis.rsi < 30 ? "positive" : ""}`}>
                    {analysis.rsi.toFixed(1)}
                  </span>
                </div>
                <div className="metric-card">
                  <span className="metric-label">Sharpe</span>
                  <span className={`metric-value ${analysis.sharpeRatio >= 1 ? "positive" : "negative"}`}>
                    {analysis.sharpeRatio.toFixed(2)}
                  </span>
                </div>
                <div className="metric-card">
                  <span className="metric-label">Volatilidade</span>
                  <span className="metric-value">{(analysis.volatility * 100).toFixed(2)}%</span>
                </div>
                <div className="metric-card">
                  <span className="metric-label">Max Drawdown</span>
                  <span className="metric-value negative">{(analysis.maxDrawdown * 100).toFixed(1)}%</span>
                </div>
              </div>

              {/* Multi-panel charts */}
              <div className="chart-panels">
                {/* Main Price Chart */}
                <div className="chart-panel panel-price">
                  <Chart
                    chartType="LineChart"
                    width="100%"
                    height="400px"
                    data={priceChartData()}
                    options={priceOptions}
                    loader={<div className="chart-loader">Carregando...</div>}
                  />
                </div>

                {/* Volume Chart */}
                <div className="chart-panel panel-volume">
                  <Chart
                    chartType="ColumnChart"
                    width="100%"
                    height="100px"
                    data={volumeChartData()}
                    options={volumeOptions}
                    loader={<div className="chart-loader">Carregando...</div>}
                  />
                </div>

                {/* RSI Chart */}
                <div className="chart-panel panel-rsi">
                  <Chart
                    chartType="LineChart"
                    width="100%"
                    height="140px"
                    data={rsiChartData()}
                    options={rsiOptions}
                    loader={<div className="chart-loader">Carregando...</div>}
                  />
                </div>

                {/* MACD Chart */}
                <div className="chart-panel panel-macd">
                  <Chart
                    chartType="LineChart"
                    width="100%"
                    height="140px"
                    data={macdChartData()}
                    options={macdOptions}
                    loader={<div className="chart-loader">Carregando...</div>}
                  />
                </div>
              </div>

              {/* MACD + RSI Row */}
              <div className="invest-indicators-row">
                <div className="indicator-card">
                  <span className="indicator-title">Médias Móveis</span>
                  <div className="indicator-values">
                    <div className="indicator-item">
                      <span className="indicator-label">SMA20</span>
                      <span className="indicator-val">{formatCurrency(analysis.sma20)}</span>
                    </div>
                    <div className="indicator-item">
                      <span className="indicator-label">SMA50</span>
                      <span className="indicator-val">{formatCurrency(analysis.sma50)}</span>
                    </div>
                    <div className="indicator-item">
                      <span className="indicator-label">SMA200</span>
                      <span className="indicator-val">{formatCurrency(analysis.sma200)}</span>
                    </div>
                  </div>
                  <span className={`indicator-status ${analysis.currentPrice > analysis.sma50 ? "bullish" : "bearish"}`}>
                    Preço {analysis.currentPrice > analysis.sma50 ? "acima" : "abaixo"} da SMA50
                  </span>
                </div>
                <div className="indicator-card">
                  <span className="indicator-title">Bollinger Bands</span>
                  <div className="indicator-values">
                    <div className="indicator-item">
                      <span className="indicator-label">Superior</span>
                      <span className="indicator-val">{formatCurrency(analysis.upperBollinger)}</span>
                    </div>
                    <div className="indicator-item">
                      <span className="indicator-label">Inferior</span>
                      <span className="indicator-val">{formatCurrency(analysis.lowerBollinger)}</span>
                    </div>
                    <div className="indicator-item">
                      <span className="indicator-label">Largura</span>
                      <span className="indicator-val">{formatCurrency(analysis.upperBollinger - analysis.lowerBollinger)}</span>
                    </div>
                  </div>
                  <span className="indicator-status info">
                    {analysis.currentPrice >= analysis.upperBollinger * 0.98
                      ? "▲ Toca superior"
                      : analysis.currentPrice <= analysis.lowerBollinger * 1.02
                      ? "▼ Toca inferior"
                      : "◆ Dentro das bandas"}
                  </span>
                </div>
                <div className="indicator-card">
                  <span className="indicator-title">MACD</span>
                  <div className="indicator-values">
                    <div className="indicator-item">
                      <span className="indicator-label">MACD</span>
                      <span className={`indicator-val ${analysis.macd >= 0 ? "positive" : "negative"}`}>
                        {analysis.macd.toFixed(4)}
                      </span>
                    </div>
                    <div className="indicator-item">
                      <span className="indicator-label">Sinal</span>
                      <span className="indicator-val">{analysis.macdSignal.toFixed(4)}</span>
                    </div>
                    <div className="indicator-item">
                      <span className="indicator-label">Histograma</span>
                      <span className={`indicator-val ${analysis.macdHistogram >= 0 ? "positive" : "negative"}`}>
                        {analysis.macdHistogram.toFixed(4)}
                      </span>
                    </div>
                  </div>
                  <span className={`indicator-status ${analysis.macd > analysis.macdSignal ? "bullish" : "bearish"}`}>
                    {analysis.macd > analysis.macdSignal ? "▲ Altista" : "▼ Baixista"}
                  </span>
                </div>
              </div>

              {/* Report Section */}
              <div className="invest-report-section">
                <button
                  className={`report-toggle ${mostrarRelatorio ? "active" : ""}`}
                  onClick={() => setMostrarRelatorio(!mostrarRelatorio)}
                >
                  <span className="report-toggle-icon">{mostrarRelatorio ? "▾" : "▸"}</span>
                  Relatório de Análise por IA
                  <span className="report-score-badge" data-score={report.overallVerdict}>
                    Score: {report.overallScore}/100 — {report.overallVerdict}
                  </span>
                </button>

                {mostrarRelatorio && (
                  <div className="report-content">
                    <p className="report-summary">{report.summary}</p>

                    <div className="report-timeframes">
                      <div className="timeframe-card short">
                        <h4>Curto Prazo (semanas)</h4>
                        <span className="timeframe-verdict">{report.shortTerm.verdict}</span>
                        <span className={`timeframe-confidence conf-${report.shortTerm.confidence.toLowerCase()}`}>
                          Confiança: {report.shortTerm.confidence}
                        </span>
                        <p>{report.shortTerm.reasoning}</p>
                      </div>
                      <div className="timeframe-card medium">
                        <h4>Médio Prazo (meses)</h4>
                        <span className="timeframe-verdict">{report.mediumTerm.verdict}</span>
                        <span className={`timeframe-confidence conf-${report.mediumTerm.confidence.toLowerCase()}`}>
                          Confiança: {report.mediumTerm.confidence}
                        </span>
                        <p>{report.mediumTerm.reasoning}</p>
                      </div>
                      <div className="timeframe-card long">
                        <h4>Longo Prazo (anos)</h4>
                        <span className="timeframe-verdict">{report.longTerm.verdict}</span>
                        <span className={`timeframe-confidence conf-${report.longTerm.confidence.toLowerCase()}`}>
                          Confiança: {report.longTerm.confidence}
                        </span>
                        <p>{report.longTerm.reasoning}</p>
                      </div>
                    </div>

                    <div className="report-lists">
                      {report.keyStrengths.length > 0 && (
                        <div className="report-list positives">
                          <h4>✓ Pontos Fortes</h4>
                          <ul>
                            {report.keyStrengths.map((s, i) => <li key={i}>{s}</li>)}
                          </ul>
                        </div>
                      )}
                      {report.keyRisks.length > 0 && (
                        <div className="report-list risks">
                          <h4>✗ Riscos</h4>
                          <ul>
                            {report.keyRisks.map((r, i) => <li key={i}>{r}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className={`report-recommendation rec-${report.overallVerdict.toLowerCase()}`}>
                      <strong>Recomendação:</strong> {report.recommendation}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {!carregando && !analysis && dataPoints.length === 0 && (
            <div className="invest-empty">
              <div className="empty-icon">📊</div>
              <h2>Busque um ativo para começar</h2>
              <p>Digite o ticker de uma ação (ex: AAPL, NVDA, TSLA) e clique em "Buscar" para ver a análise completa.</p>
            </div>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Tab1;
