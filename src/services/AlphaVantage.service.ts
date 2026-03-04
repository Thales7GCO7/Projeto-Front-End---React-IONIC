import axios from "axios";

export interface StockPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export async function buscarAcao(symbol: string): Promise<StockPoint[]> {
  try {
    const response = await axios.get(
      "https://alpha-vantage.p.rapidapi.com/query",
      {
        params: {
          function: "TIME_SERIES_DAILY_ADJUSTED",
          symbol: symbol,
          outputsize: "compact",
          datatype: "json"
        },
        headers:{
          "x-rapidapi-key": "6f78819a48msh4e69ccf798572edp1fc4d1jsnd0abd86abd52",
          "x-rapidapi-host": "alpha-vantage.p.rapidapi.com"
        }
      }
    );

    const series = response.data["Time Series (Daily)"];
    if (!series) return [];

    const result: StockPoint[] = Object.keys(series)
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
    .map(date => {
      const open = parseFloat(series[date]["1. open"]);
      const high = parseFloat(series[date]["2. high"]);
      const low = parseFloat(series[date]["3. low"]);
      const close = parseFloat(series[date]["4. close"]);
      const volume = parseInt(series[date]["5. volume"], 10);

      return { date, open, high, low, close, volume };
    });

    return result;

    } catch (error){
      console.error("Erro API:", error);
      return[];
    }
}