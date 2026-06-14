// 損失（赤）と正解率（青）の推移を折れ線で描く。
export function createLossChart(canvas) {
  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;
  let loss = [];
  let acc = [];
  let testAcc = []; // 第6章: テスト精度（任意）
  const MAX = 240; // 表示する直近点数

  function push(m) {
    if (Number.isFinite(m.loss)) loss.push(m.loss);
    acc.push(m.accuracy);
    if (typeof m.testAccuracy === "number") testAcc.push(m.testAccuracy);
    if (loss.length > MAX) loss.shift();
    if (acc.length > MAX) acc.shift();
    if (testAcc.length > MAX) testAcc.shift();
  }
  function reset() { loss = []; acc = []; testAcc = []; ctx.clearRect(0, 0, W, H); }

  function render() {
    ctx.clearRect(0, 0, W, H);
    // 枠
    ctx.strokeStyle = "#e3d9c0";
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, W - 1, H - 1);

    // 正解率（0..1）青＝訓練
    drawLine(acc, 1, "#2c6e8f");
    // テスト精度（0..1）紫の点線（第6章。訓練と離れていくのが過学習）
    drawLine(testAcc, 1, "#7d3c98", [4, 3]);
    // 損失（0..maxLoss）赤
    const maxLoss = Math.max(0.0001, ...loss);
    drawLine(loss, maxLoss, "#c0392b");
  }

  function drawLine(arr, scale, color, dash) {
    if (arr.length < 2) return;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.setLineDash(dash || []);
    ctx.beginPath();
    arr.forEach((v, i) => {
      const x = (i / (arr.length - 1)) * (W - 4) + 2;
      const y = H - 2 - (Math.max(0, Math.min(scale, v)) / scale) * (H - 4);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.setLineDash([]);
  }

  return { push, render, reset };
}
