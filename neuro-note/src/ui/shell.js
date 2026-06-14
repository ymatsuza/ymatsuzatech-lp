// メイン画面のDOMを構築し、各部品への参照を返す。
export function buildShell(root) {
  root.innerHTML = `
  <div class="nn-book">
    <header class="nn-top">
      <span class="nn-chapter" id="nn-chapter">第1章</span>
      <span class="nn-title" id="nn-title">―</span>
      <span class="nn-metrics" id="nn-metrics"></span>
      <button class="nn-homebtn" id="nn-help-btn" title="help">❓</button>
      <button class="nn-homebtn" id="nn-lang-btn">EN</button>
      <button class="nn-homebtn" id="nn-mute-btn" title="sound on/off">🔊</button>
      <button class="nn-homebtn" id="nn-home-btn">🗺</button>
    </header>
    <div class="nn-main">
      <div class="nn-stage">
        <div class="nn-goal" id="nn-goal"></div>
        <div class="nn-vizrow">
          <div class="nn-panel nn-boundary">
            <div class="nn-cap">決定境界（青=クラス0 / 赤=クラス1）</div>
            <canvas id="nn-boundary" width="340" height="340"></canvas>
          </div>
          <div class="nn-panel nn-network">
            <div class="nn-cap">ネットワーク（線の太さ=重み）</div>
            <svg id="nn-network" viewBox="0 0 360 210" xmlns="http://www.w3.org/2000/svg"></svg>
          </div>
        </div>
        <div class="nn-overlay hidden" id="nn-decision"></div>
        <div class="nn-overlay hidden" id="nn-cleared"></div>
      </div>
      <div class="nn-side">
        <div class="nn-panel nn-chart">
          <div class="nn-cap">損失(赤) / 正解率(青)</div>
          <canvas id="nn-chart" width="230" height="96"></canvas>
        </div>
        <div>
          <div class="nn-cap" style="margin-bottom:4px">いま学んだ用語</div>
          <div class="nn-termcard" id="nn-termcard"><span class="nn-empty">学習を始めると、ここに用語が現れます。</span></div>
        </div>
        <button class="nn-glossbtn" id="nn-gloss-btn">📖 用語集</button>
      </div>
    </div>
    <footer class="nn-controls" id="nn-controls"></footer>
    <div class="nn-home hidden" id="nn-home"></div>
  </div>
  <div class="nn-modal hidden" id="nn-gloss-modal"></div>
  <div class="nn-modal hidden" id="nn-draw-modal"></div>
  <div class="nn-modal hidden" id="nn-help-modal"></div>
  `;

  const $ = (id) => root.querySelector(id);
  return {
    chapterEl: $("#nn-chapter"),
    titleEl: $("#nn-title"),
    metricsEl: $("#nn-metrics"),
    goalEl: $("#nn-goal"),
    boundaryCanvas: $("#nn-boundary"),
    networkSvg: $("#nn-network"),
    chartCanvas: $("#nn-chart"),
    termcardEl: $("#nn-termcard"),
    glossBtn: $("#nn-gloss-btn"),
    glossModal: $("#nn-gloss-modal"),
    controlsEl: $("#nn-controls"),
    decisionOverlay: $("#nn-decision"),
    clearedOverlay: $("#nn-cleared"),
    homeEl: $("#nn-home"),
    homeBtn: $("#nn-home-btn"),
    muteBtn: $("#nn-mute-btn"),
    langBtn: $("#nn-lang-btn"),
    helpBtn: $("#nn-help-btn"),
    drawModal: $("#nn-draw-modal"),
    helpModal: $("#nn-help-modal"),
  };
}
