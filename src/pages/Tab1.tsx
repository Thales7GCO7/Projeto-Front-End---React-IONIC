import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import { useEffect, useState } from "react";
import { Chart } from "react-google-charts";
import { buscarAcao, StockPoint } from "../services/AlphaVantage.service";
import { regressaoLinear } from "../utils/RegressaoLinear";

const Tab1: React.FC = () => {
  const [simbolo, setSimbolo] = useState("NVDA");
  const [inputsimbolo, setInputsimbolo] = useState("NVDA");

  const [dataPoints, setDataPoints] = useState<StockPoint[]>([]);
  const [trendValue, setTrendValue] = useState<number>(0);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    async function carregar() {
      setCarregando(true);
      const resultado = await buscarAcao(simbolo);
      setDataPoints(resultado);
      setCarregando(false);
    }
    carregar();
  }, [simbolo]);


  useEffect(() => {
    if(dataPoints.length >= 2){
    const prices = dataPoints.map(d => d.close);
    const {inclinacao} = regressaoLinear(prices);
    setTrendValue(inclinacao);
    }
  }, [dataPoints]);

  const chartData = () => {
    if (dataPoints.length < 2) return [];

    const prices = dataPoints.map(d => d.close);
    const { inclinacao, intercept } = regressaoLinear(prices);

    const rows = dataPoints.map((dp, index) => [
      dp.date,
      dp.close,
      inclinacao * index + intercept
    ]);

    return [
      ["Data", "Preço", "Tendência"],
      ...rows
    ];
  };

  const options = {
    title: "Histórico de Preços",
    curveType: "function",
    legend: { position: "top" },
    colors: ["#4fc3ff", "#ff9800"],
    series: {
      1: { lineDashStyle: [6, 4] }
    },
    backgroundColor: "transparent",
    hAxis: { title: "Data" },
    vAxis: { title: "Preço (USD)" }
  };

  function trendLabel(value: number) {
    if (value > 0.05) return "Tendência de Alta";
    if (value < -0.05) return "Tendência de Baixa";
    return "Tendência Lateral";
  }

  function handleSearch() {
    if (inputsimbolo.trim() !== "") {
      setSimbolo(inputsimbolo.trim().toUpperCase());
    }
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Análise de Ativos - Ações</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="stock-page">
        <div className="stock-card">

          {/* Barra de busca */}
          <div className="stock-search">
            <input
              value={inputsimbolo}
              onChange={(e) => setInputsimbolo(e.target.value)}
              placeholder="Digite o ticker (ex: AAPL, TSLA, NVDA)"
            />
            <button onClick={handleSearch}>Buscar</button>
          </div>

          {/* Cabeçalho */}
          <div className="stock-header">
            <div className="stock-simbolo">{simbolo}</div>
            <div className="stock-company">
              Coeficiente de tendência: {trendValue.toFixed(4)} <br />
              {trendLabel(trendValue)}
            </div>
          </div>

          {/* Gráfico */}
          {!carregando && dataPoints.length >= 2 && (
            <Chart
              chartType="LineChart"
              width="100%"
              height="400px"
              data={chartData()}
              options={options}
              loader={<p>Carregando gráfico...</p>}
            />
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Tab1;
