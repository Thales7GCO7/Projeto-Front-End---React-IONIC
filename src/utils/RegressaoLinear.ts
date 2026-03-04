export function regressaoLinear(data: number[]) {
  const n = data.length;
  const xSum = data.reduce((sum, _, i) => sum + i, 0);
  const ySum = data.reduce((sum, y) => sum + y, 0);
  const xySum = data.reduce((sum, y, i) => sum + i * y, 0);
  const xxSum = data.reduce((sum, _, i) => sum + i * i, 0);

  const inclinacao = (n * xySum - xSum * ySum) / (n * xxSum - xSum * xSum);
  const intercept = (ySum - inclinacao * xSum) / n;

  return { inclinacao, intercept };
}