import { makeNet } from "../engine/network.js";
import { randomLayer } from "../engine/init.js";

// 第1〜7章のカリキュラム定義。
// 各ステージ: お題 / データ / 1つの決断 / 決断→ネット構成(apply) / 勝利条件 / 用語カードのトリガー。
// _en フィールドは英語UI用（i18n の locField で参照）。
// cards[].on: "stageStart" | "decision" | "firstStep" | {epoch:n} | {lossBelow:v} | "win"

export const STAGES = [
  {
    id: "ch1",
    chapter: 1,
    title: "1個のニューロン",
    title_en: "A single neuron",
    goal: "上下に分かれた点々を、たった1個のニューロンで2色に分けよう。まず「バイアス」が要るか決めて。",
    goal_en: "Split these stacked dots into two colors with just one neuron. First, decide whether you need a bias.",
    dataset: { name: "stackedBlobs", n: 140, seed: 3 },
    loss: "bce",
    decision: {
      prompt: "バイアスは要る？（出力をずらす“下駄”）",
      prompt_en: "Do you need a bias? (an offset that shifts the output)",
      options: [
        { label: "バイアスあり 👍", label_en: "With bias 👍", hint: "境界線を上下に自由に動かせる", hint_en: "the boundary can move up and down freely", value: "bias" },
        { label: "バイアスなし", label_en: "No bias", hint: "境界線は必ず原点を通る…分けられる？", hint_en: "the boundary must pass through the origin… can it split them?", value: "nobias" },
      ],
    },
    apply(value) {
      const net = makeNet([randomLayer(2, 1, "sigmoid", 21)]);
      if (value === "nobias") {
        net.layers[0].lockBias = true;
        net.layers[0].b = [0];
      }
      return { net, lr: 0.12 };
    },
    win: { metric: "loss", threshold: 0.28 },
    maxEpochs: 600,
    cards: [
      { term: "neuron", on: "stageStart" },
      { term: "bias", on: "decision" },
      { term: "weight", on: "firstStep" },
    ],
  },

  {
    id: "ch2",
    chapter: 2,
    title: "活性化関数",
    title_en: "Activation function",
    goal: "重み付き和を“出力”に変えるのが活性化関数。どれを使うと学習できる？選んで確かめよう。",
    goal_en: "The activation turns the weighted sum into an output. Which one can actually learn? Pick and find out.",
    dataset: { name: "linearBlobs", n: 140, seed: 5 },
    loss: "bce",
    decision: {
      prompt: "活性化関数はどれにする？",
      prompt_en: "Which activation function?",
      options: [
        { label: "シグモイド", label_en: "Sigmoid", hint: "なめらかなS字。微分できる", hint_en: "smooth S-curve, differentiable", value: "sigmoid" },
        { label: "ステップ", label_en: "Step", hint: "0か1にカクッ。…学習できる？", hint_en: "snaps to 0 or 1… can it learn?", value: "step" },
      ],
    },
    apply(value) {
      const net = makeNet([randomLayer(2, 1, value, 22)]);
      return { net, lr: 0.04 };
    },
    win: { metric: "loss", threshold: 0.18 },
    maxEpochs: 400,
    cards: [
      { term: "activation", on: "decision" },
      { term: "sigmoid", on: "firstStep" },
      { term: "forward", on: { epoch: 3 } },
    ],
  },

  {
    id: "ch3",
    chapter: 3,
    title: "損失と勾配降下",
    title_en: "Loss & gradient descent",
    goal: "学習は「損失という坂を下る」こと。1歩の大きさ＝学習率を選んで、下り方の違いを眺めよう。",
    goal_en: "Learning is walking down the hill of the loss. Pick the step size (learning rate) and watch how the descent differs.",
    dataset: { name: "linearBlobs", n: 140, seed: 7 },
    loss: "mse",
    decision: {
      prompt: "学習率（1歩の大きさ）はどれ？",
      prompt_en: "Which learning rate (step size)?",
      options: [
        { label: "小さい (0.005)", label_en: "Small (0.005)", hint: "慎重だけど…のろい", hint_en: "careful but… slow", value: 0.005 },
        { label: "ちょうどいい (0.02)", label_en: "Just right (0.02)", hint: "すいすい下る", hint_en: "glides down nicely", value: 0.02 },
        { label: "大きすぎ (3.0)", label_en: "Too big (3.0)", hint: "坂を飛び越えて発散する？", hint_en: "overshoots and diverges?", value: 3.0 },
      ],
    },
    apply(value) {
      const net = makeNet([randomLayer(2, 1, "identity", 23)]);
      return { net, lr: value };
    },
    win: { metric: "loss", threshold: 0.02 },
    maxEpochs: 250,
    cards: [
      { term: "loss", on: "stageStart" },
      { term: "learningRate", on: "decision" },
      { term: "gradientDescent", on: "firstStep" },
      { term: "epoch", on: { epoch: 5 } },
    ],
  },

  {
    id: "ch4",
    chapter: 4,
    title: "隠れ層をいれる",
    title_en: "Add a hidden layer",
    goal: "★山場。同心円は直線では分けられない。隠れニューロンを足して、境界を“曲げて”みよう。",
    goal_en: "★ The big one. Concentric circles can't be split by a line. Add hidden neurons and bend the boundary.",
    dataset: { name: "circles", n: 200, seed: 9 },
    loss: "bce",
    decision: {
      prompt: "隠れニューロンを何個足す？",
      prompt_en: "How many hidden neurons?",
      options: [
        { label: "0個（隠れ層なし）", label_en: "0 (no hidden layer)", hint: "ただの直線。円は囲えない", hint_en: "just a line — can't enclose a circle", value: 0 },
        { label: "2個", label_en: "2", hint: "少しだけ曲がる", hint_en: "bends a little", value: 2 },
        { label: "8個", label_en: "8", hint: "自由に曲げて囲い込める", hint_en: "bends freely to enclose", value: 8 },
      ],
    },
    apply(value) {
      let net;
      if (value === 0) {
        net = makeNet([randomLayer(2, 1, "sigmoid", 24)]);
      } else {
        net = makeNet([
          randomLayer(2, value, "tanh", 24),
          randomLayer(value, 1, "sigmoid", 25),
        ]);
      }
      return { net, lr: 0.4 };
    },
    win: { metric: "accuracy", threshold: 0.9 },
    maxEpochs: 600,
    cards: [
      { term: "nonlinear", on: "stageStart" },
      { term: "hiddenLayer", on: "decision" },
      { term: "decisionBoundary", on: "firstStep" },
    ],
  },

  {
    id: "ch5",
    chapter: 5,
    title: "誤差逆伝播",
    title_en: "Backpropagation",
    goal: "誤差は出力→入力へ“後ろ向き”に伝わって各重みを直す。赤く光る線が、いま大きく修正されている重み。層を増やして、逆伝播が層を貫くのを眺めよう。",
    goal_en: "Error flows backward, output → input, fixing each weight. The red-glowing lines are the weights being corrected most. Add layers and watch backprop pierce through them.",
    dataset: { name: "xor", args: [160, 4] },
    loss: "bce",
    gradViz: true,
    decision: {
      prompt: "ネットワークをどうする？",
      prompt_en: "How should the network be shaped?",
      options: [
        { label: "幅を広く（1層・12個）", label_en: "Wider (1 layer, 12)", hint: "横に大きく", hint_en: "big across", value: "wide" },
        { label: "層を深く（2層・8+8個）", label_en: "Deeper (2 layers, 8+8)", hint: "縦に深く。逆伝播が2層を貫く", hint_en: "deep — backprop pierces two layers", value: "deep" },
      ],
    },
    apply(value) {
      const net =
        value === "deep"
          ? makeNet([randomLayer(2, 8, "tanh", 51), randomLayer(8, 8, "tanh", 52), randomLayer(8, 1, "sigmoid", 53)])
          : makeNet([randomLayer(2, 12, "tanh", 51), randomLayer(12, 1, "sigmoid", 53)]);
      return { net, lr: 0.3 };
    },
    win: { metric: "accuracy", threshold: 0.92 },
    maxEpochs: 1500,
    cards: [
      { term: "backpropagation", on: "stageStart" },
      { term: "deepNetwork", on: "decision" },
      { term: "gradientDescent", on: "firstStep" },
    ],
  },

  {
    id: "ch6",
    chapter: 6,
    title: "過学習と汎化",
    title_en: "Overfitting & generalization",
    goal: "データを訓練用とテスト用に分けたよ（青=訓練, 紫の点線=テスト）。大きすぎる網は訓練を丸暗記してテストで外す＝過学習。最後まで学習して、テストで勝てる網を選ぼう。",
    goal_en: "Data is split into train and test (blue = train, purple dashed = test). A too-big network memorizes the train set and misses on test — overfitting. Train to the end and pick a network that wins on test.",
    dataset: { name: "moons", args: [48, 7, 0.4] },
    testSplit: { ratio: 0.5, seed: 3 },
    loss: "bce",
    decision: {
      prompt: "隠れニューロンは何個にする？",
      prompt_en: "How many hidden neurons?",
      options: [
        { label: "小さめ（4個）", label_en: "Small (4)", hint: "本質だけ学ぶ", hint_en: "learns just the essence", value: 4 },
        { label: "大きすぎ（24個）", label_en: "Too big (24)", hint: "丸暗記しちゃう？", hint_en: "memorizes?", value: 24 },
      ],
    },
    apply(value) {
      return { net: makeNet([randomLayer(2, value, "tanh", 61), randomLayer(value, 1, "sigmoid", 62)]), lr: 0.3 };
    },
    win: { metric: "testAtEnd", threshold: 0.8 },
    maxEpochs: 1000,
    cards: [
      { term: "trainTestSplit", on: "stageStart" },
      { term: "overfitting", on: "decision" },
      { term: "generalization", on: { epoch: 200 } },
      { term: "earlyStopping", on: { epoch: 600 } },
    ],
  },

  {
    id: "ch7",
    chapter: 7,
    title: "手書き数字を当てる",
    title_en: "Read handwritten digits",
    goal: "★最終ボス。ここまでの集大成！ 8×8の手書き数字(0〜9)を当てよう。出力は10個の確率（softmax）。脳の大きさを決めて、本物の認識を眺めよう。",
    goal_en: "★ Final boss — everything so far! Recognize 8×8 handwritten digits (0–9). The output is 10 probabilities (softmax). Choose the brain size and watch real recognition.",
    dataset: { name: "digits8x8", args: [80, 1, 0.08, 1] },
    testSplit: { ratio: 0.35, seed: 5 },
    loss: "ce",
    view: "digits",
    decision: {
      prompt: "脳の大きさ（隠れニューロン）は？",
      prompt_en: "Brain size (hidden neurons)?",
      options: [
        { label: "16個", label_en: "16", hint: "標準", hint_en: "standard", value: 16 },
        { label: "32個", label_en: "32", hint: "大きめ・自信たっぷり", hint_en: "bigger, more confident", value: 32 },
        { label: "隠れ層なし（線形）", label_en: "No hidden layer (linear)", hint: "ずれた数字は線形だと苦手かも…", hint_en: "linear struggles with shifted digits…", value: 0 },
      ],
    },
    apply(value) {
      const net =
        value === 0
          ? makeNet([randomLayer(64, 10, "softmax", 71)])
          : makeNet([randomLayer(64, value, "tanh", 71), randomLayer(value, 10, "softmax", 72)]);
      return { net, lr: 0.3 };
    },
    win: { metric: "testAccuracy", threshold: 0.78 },
    maxEpochs: 400,
    cards: [
      { term: "multiclass", on: "stageStart" },
      { term: "softmax", on: "decision" },
      { term: "generalization", on: { epoch: 30 } },
    ],
  },
];
