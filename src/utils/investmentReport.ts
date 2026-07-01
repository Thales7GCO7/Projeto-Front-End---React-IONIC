import { AnalysisResult } from "./investmentCalculations";

export interface TimeframeOpinion {
  verdict: string;
  confidence: "Alta" | "Média" | "Baixa";
  reasoning: string;
}

export interface InvestmentReport {
  shortTerm: TimeframeOpinion;
  mediumTerm: TimeframeOpinion;
  longTerm: TimeframeOpinion;
  overallScore: number;
  overallVerdict: string;
  keyStrengths: string[];
  keyRisks: string[];
  recommendation: string;
  summary: string;
}

function confidenceLabel(score: number): "Alta" | "Média" | "Baixa" {
  if (score >= 7) return "Alta";
  if (score >= 4) return "Média";
  return "Baixa";
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function generateReport(analysis: AnalysisResult): InvestmentReport {
  let score = 50;
  const strengths: string[] = [];
  const risks: string[] = [];

  const smaBullish = analysis.currentPrice > analysis.sma50;
  const goldenCross = analysis.sma20 > analysis.sma50;
  const rsiOversold = analysis.rsi < 35;
  const rsiOverbought = analysis.rsi > 70;
  const macdBullish = analysis.macd > analysis.macdSignal;
  const lowVol = analysis.volatility < 0.015;
  const highVol = analysis.volatility > 0.03;
  const goodSharpe = analysis.sharpeRatio > 1;
  const poorSharpe = analysis.sharpeRatio < 0.5;
  const positiveROI = analysis.roi > 0;
  const highROI = analysis.roi > 0.3;
  const lowDrawdown = analysis.maxDrawdown < 0.15;
  const highDrawdown = analysis.maxDrawdown > 0.35;

  if (goldenCross) { score += 10; strengths.push("Cruzamento de médias positivo (SMA20 > SMA50) — tendência de alta de médio prazo."); }
  else { score -= 5; risks.push("SMA20 abaixo da SMA50 — possível tendência de baixa no médio prazo."); }

  if (smaBullish) { score += 5; strengths.push("Preço acima da SMA50 — viés de alta no médio prazo."); }
  else { score -= 5; risks.push("Preço abaixo da SMA50 — viés de baixa no médio prazo."); }

  if (rsiOversold) { score += 8; strengths.push("RSI em região de sobrevenda (" + analysis.rsi.toFixed(1) + ") — potencial de reversão altista."); }
  else if (rsiOverbought) { score -= 5; risks.push("RSI em região de sobrecompra (" + analysis.rsi.toFixed(1) + ") — risco de correção."); }
  else { score += 3; strengths.push("RSI neutro (" + analysis.rsi.toFixed(1) + ") — sem extremos de momento."); }

  if (macdBullish) { score += 8; strengths.push("MACD acima da linha de sinal — momento altista no curto prazo."); }
  else { score -= 5; risks.push("MACD abaixo da linha de sinal — momento baixista no curto prazo."); }

  if (goodSharpe) { score += 8; strengths.push("Índice Sharpe elevado (" + analysis.sharpeRatio.toFixed(2) + ") — boa relação risco/retorno."); }
  else if (poorSharpe) { score -= 5; risks.push("Índice Sharpe baixo (" + analysis.sharpeRatio.toFixed(2) + ") — retorno ajustado ao risco insuficiente."); }

  if (highROI) { score += 10; strengths.push("ROI expressivo de " + (analysis.roi * 100).toFixed(1) + "% — retorno acumulado relevante."); }
  else if (positiveROI) { score += 5; strengths.push("ROI positivo de " + (analysis.roi * 100).toFixed(1) + "% — retorno acumulado favorável."); }
  else { score -= 8; risks.push("ROI negativo de " + (analysis.roi * 100).toFixed(1) + "% — retorno acumulado desfavorável."); }

  if (lowVol) { score += 3; strengths.push("Baixa volatilidade (" + (analysis.volatility * 100).toFixed(2) + "%) — estabilidade nos preços."); }
  else if (highVol) { score -= 3; risks.push("Alta volatilidade (" + (analysis.volatility * 100).toFixed(2) + "%) — risco elevado de oscilações bruscas."); }

  if (lowDrawdown) { score += 5; strengths.push("Drawdown máximo controlado de " + (analysis.maxDrawdown * 100).toFixed(1) + "% — boa resiliência a quedas."); }
  else if (highDrawdown) { score -= 5; risks.push("Drawdown máximo elevado de " + (analysis.maxDrawdown * 100).toFixed(1) + "% — quedas profundas no período."); }

  score = clamp(score, 0, 100);

  const trendUp = analysis.trendDirection === "alta";

  let shortTermVerdict: string;
  let shortTermReasoning: string;
  if (macdBullish && analysis.rsi < 65) {
    shortTermVerdict = "Potencial de alta no curto prazo";
    shortTermReasoning = "MACD positivo e RSI em região confortável indicam momento favorável para valorização nas próximas semanas.";
  } else if (!macdBullish && rsiOverbought) {
    shortTermVerdict = "Risco de correção no curto prazo";
    shortTermReasoning = "MACD negativo combinado com RSI sobrecomprado sugere movimento corretivo iminente.";
  } else if (rsiOversold) {
    shortTermVerdict = "Possível recuperação no curto prazo";
    shortTermReasoning = "RSI em sobrevenda indica que o ativo pode estar barato, com potencial de recuperação técnica.";
  } else {
    shortTermVerdict = "Movimento lateral no curto prazo";
    shortTermReasoning = "Indicadores de curto prazo sem direção definida. Aguardar confirmação de tendência.";
  }

  let mediumTermVerdict: string;
  let mediumTermReasoning: string;
  if (trendUp && goldenCross) {
    mediumTermVerdict = "Tendência de alta consistente";
    mediumTermReasoning = "Cruzamento de médias móveis e tendência de alta por regressão linear indicam trajetória positiva para os próximos meses.";
  } else if (trendUp && !goldenCross) {
    mediumTermVerdict = "Recuperação gradual";
    mediumTermReasoning = "Tendência de alta incipiente, mas ainda sem confirmação de médias. Acompanhar evolução.";
  } else if (!trendUp && smaBullish) {
    mediumTermVerdict = "Sinais mistos no médio prazo";
    mediumTermReasoning = "Preço acima da média de 50 dias, mas tendência de longo prazo ainda indefinida. prudência.";
  } else {
    mediumTermVerdict = "Tendência de baixa no médio prazo";
    mediumTermReasoning = "Estrutura de médias e regressão linear apontam para baixa. Evitar exposição sem sinais de reversão.";
  }

  let longTermVerdict: string;
  let longTermReasoning: string;
  if (goodSharpe && positiveROI && lowDrawdown) {
    longTermVerdict = "Bom potencial de valorização no longo prazo";
    longTermReasoning = "Relação risco/retorno favorável, retorno positivo e resiliência a quedas indicam ativo com fundamentos sólidos para horizontes estendidos.";
  } else if (positiveROI && highDrawdown) {
    longTermVerdict = "Potencial com volatilidade elevada";
    longTermReasoning = "Retorno positivo no período, mas com quedas expressivas. Adequado para investidores com perfil arrojado.";
  } else {
    longTermVerdict = "Cautela no longo prazo";
    longTermReasoning = "Retorno ajustado ao risco abaixo do ideal. Recomenda-se diversificação e reavaliação periódica.";
  }

  let recommendation: string;
  if (score >= 70) {
    recommendation = "INVESTIMENTO RECOMENDADO. O ativo apresenta fundamentos técnicos sólidos, boa relação risco/retorno e indicadores favoráveis nos três horizontes. Adequado para compra com potencial de valorização.";
  } else if (score >= 45) {
    recommendation = "INVESTIMENTO COM RESSALVAS. O ativo possui pontos positivos, mas também riscos que merecem atenção. Recomenda-se entrada parcial com stops ajustados e monitoramento constante.";
  } else {
    recommendation = "NÃO RECOMENDADO NO MOMENTO. Os indicadores técnicos apontam mais riscos que oportunidades. Aguardar melhora no cenário antes de alocar capital.";
  }

  let summary: string;
  if (score >= 70) {
    summary = "Este ativo apresenta um cenário técnico favorável, com indicadores majoritariamente positivos. A tendência de " + analysis.trendDirection + ", combinada com " + (goldenCross ? "cruzamento de médias altista" : "preço acima das médias relevantes") + " e " + (goodSharpe ? "Sharpe elevado" : "risco controlado") + ", sugere potencial de valorização. O momento é oportuno para exposição, respeitando-se o gerenciamento de risco.";
  } else if (score >= 45) {
    summary = "O cenário para este ativo é misto. Aspectos positivos como " + (positiveROI ? "ROI positivo" : "tendência de " + analysis.trendDirection) + " são contrabalançados por riscos como " + (highVol ? "volatilidade elevada" : "sinais indicadores mistos") + ". A decisão de investimento deve considerar o perfil de risco e um plano de saída claro.";
  } else {
    summary = "O ativo enfrenta um momento desafiador segundo os indicadores técnicos. Riscos como " + (highDrawdown ? "drawdown elevado" : "tendência desfavorável") + " e " + (poorSharpe ? "Sharpe baixo" : "retorno negativo") + " sugerem cautela. Recomenda-se aguardar sinais de reversão ou realocar recursos para alternativas mais promissoras.";
  }

  return {
    shortTerm: {
      verdict: shortTermVerdict,
      confidence: confidenceLabel(score >= 50 ? Math.min(10, score / 10) : Math.max(3, score / 15)),
      reasoning: shortTermReasoning,
    },
    mediumTerm: {
      verdict: mediumTermVerdict,
      confidence: confidenceLabel(score >= 50 ? Math.min(9, score / 11) : Math.max(3, score / 14)),
      reasoning: mediumTermReasoning,
    },
    longTerm: {
      verdict: longTermVerdict,
      confidence: confidenceLabel(score >= 50 ? Math.min(8, score / 12) : Math.max(2, score / 20)),
      reasoning: longTermReasoning,
    },
    overallScore: score,
    overallVerdict: score >= 70 ? "Favorável" : score >= 45 ? "Neutro" : "Desfavorável",
    keyStrengths: strengths.slice(0, 4),
    keyRisks: risks.slice(0, 4),
    recommendation,
    summary,
  };
}
