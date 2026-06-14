import { t } from "../i18n.js";

// 再生コントロール（再生/一時停止・速度・1ステップ・決断やり直し・手描き）。
export function createControls(host, h) {
  host.innerHTML = "";
  let running = false;

  const play = btn("nn-btn primary");
  const step = btn("nn-btn");
  const redo = btn("nn-btn");
  const draw = btn("nn-btn");
  draw.style.display = "none"; // 第7章でのみ表示
  const save = btn("nn-btn");
  save.textContent = "💾";
  const load = btn("nn-btn");
  load.textContent = "📂";

  const speeds = [
    { l: "🐢", v: 0.25 },
    { l: "×1", v: 1 },
    { l: "×4", v: 4 },
    { l: "×16", v: 16 },
  ];
  let activeIdx = 1;
  const speedWrap = document.createElement("div");
  speedWrap.className = "nn-speed";
  const sbtns = speeds.map((s, i) => {
    const b = document.createElement("button");
    b.textContent = s.l;
    if (i === activeIdx) b.classList.add("active");
    b.onclick = () => {
      activeIdx = i;
      sbtns.forEach((x) => x.classList.remove("active"));
      b.classList.add("active");
      h.onSpeed(s.v);
    };
    speedWrap.appendChild(b);
    return b;
  });

  play.onclick = () => h.onPlayToggle();
  step.onclick = () => h.onStep();
  redo.onclick = () => h.onRedecide();
  draw.onclick = () => h.onDraw && h.onDraw();
  save.onclick = () => h.onSaveBrain && h.onSaveBrain();
  load.onclick = () => h.onLoadBrain && h.onLoadBrain();

  const spacer = document.createElement("div");
  spacer.className = "spacer";
  const label = document.createElement("span");
  label.style.cssText = "font-size:12px;color:var(--muted)";

  function relabel() {
    play.textContent = running ? t("pause") : t("play");
    step.textContent = t("step");
    redo.textContent = t("redecide");
    draw.textContent = t("draw");
    label.textContent = t("speed");
    save.title = t("saveBrainTip");
    load.title = t("loadBrainTip");
  }
  relabel();

  host.append(play, step, spacer, label, speedWrap, redo, draw, save, load);

  return {
    setRunning: (b) => { running = b; play.textContent = b ? t("pause") : t("play"); },
    setEnabled: (b) => {
      [play, step].forEach((x) => {
        x.disabled = !b;
        x.style.opacity = b ? "1" : "0.45";
        x.style.pointerEvents = b ? "auto" : "none";
      });
    },
    getSpeed: () => speeds[activeIdx].v,
    setDrawVisible: (b) => { draw.style.display = b ? "" : "none"; },
    relabel,
  };

  function btn(c) {
    const b = document.createElement("button");
    b.className = c;
    return b;
  }
}
