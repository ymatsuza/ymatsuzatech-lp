import { makeNet } from "../engine/network.js";

// 育てた「脳」（ネットワークの重み）を JSON で保存・読込する。
export function serializeBrain(net, stageId) {
  return JSON.stringify({
    app: "neuro-note",
    v: 1,
    stage: stageId,
    layers: net.layers.map((l) => ({ W: l.W, b: l.b, act: l.act, lockBias: !!l.lockBias })),
  });
}

export function parseBrain(text) {
  try {
    const o = JSON.parse(text);
    if (!o || !Array.isArray(o.layers) || o.layers.length === 0) return null;
    for (const l of o.layers) {
      if (!Array.isArray(l.W) || !Array.isArray(l.b) || typeof l.act !== "string") return null;
    }
    return { net: makeNet(o.layers), stage: o.stage };
  } catch {
    return null;
  }
}

export function downloadText(filename, text) {
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ファイル選択ダイアログ → テキストを返す（キャンセルや失敗は null）。
export function pickJsonFile() {
  return new Promise((resolve) => {
    const inp = document.createElement("input");
    inp.type = "file";
    inp.accept = ".json,application/json";
    inp.onchange = () => {
      const f = inp.files && inp.files[0];
      if (!f) return resolve(null);
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = () => resolve(null);
      r.readAsText(f);
    };
    inp.click();
  });
}
