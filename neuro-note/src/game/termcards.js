// 用語カードの内容。各ステージが id で参照し、トリガー時にポップする。
// ja/en = 用語名、body/body_en = 説明。
export const TERMS = {
  neuron: {
    ja: "ニューロン", en: "Neuron",
    body: "入力に重みをかけて足し合わせ、活性化関数を通して1つの値を出す小さな計算単位。脳の神経細胞がモデル。これを何個もつなげたのがニューラルネット。",
    body_en: "A tiny compute unit: it weights its inputs, sums them, and passes the total through an activation function to produce one output. Modeled on a brain cell. Wire many together and you get a neural network.",
  },
  weight: {
    ja: "重み", en: "Weight",
    body: "各入力をどれだけ重視するか。学習で少しずつ調整される“主役”。大きいほどその入力が出力に強く効く。図のエッジの太さが重みの大きさ。",
    body_en: "How much each input matters. The star of learning — nudged little by little. Larger weight = stronger effect on the output. Edge thickness in the diagram shows weight size.",
  },
  bias: {
    ja: "バイアス", en: "Bias",
    body: "入力が全部0でも出力をずらせる“下駄”。これがあると境界線を原点から自由に動かせる。無いと境界は必ず原点を通ってしまう。",
    body_en: "An offset that shifts the output even when all inputs are 0. With it, the boundary line can move freely off the origin; without it, the boundary must pass through the origin.",
  },
  activation: {
    ja: "活性化関数", en: "Activation function",
    body: "重み付き和を“出力”に変える関数。ここで非線形性が入るのが肝。なめらかな関数（シグモイド等）だと勾配で学習できるが、カクッと折れるステップは学習しにくい。",
    body_en: "Turns the weighted sum into an output, adding the crucial non-linearity. Smooth functions (like sigmoid) train via gradients; a hard step function barely learns.",
  },
  sigmoid: {
    ja: "シグモイド", en: "Sigmoid",
    body: "どんな値も 0〜1 の滑らかな確率に押し込むS字の関数。出力を“どれくらい自信があるか”として読める。微分できるので学習に向く。",
    body_en: "An S-shaped function that squashes any value into 0–1, readable as a confidence. It is differentiable, so it works well for learning.",
  },
  forward: {
    ja: "順伝播", en: "Forward pass",
    body: "入力から出力へ計算を一方向に流すこと。各層で「重み付き和 → 活性化」を繰り返して予測値を出す。",
    body_en: "Running the computation one way, input to output: each layer does weighted-sum then activation to produce the prediction.",
  },
  loss: {
    ja: "損失", en: "Loss",
    body: "予測がどれだけ間違っているかを表す数値。小さいほど良い。学習はこの値を下げるゲーム。右のグラフ（赤）が下がっていくのが“賢くなっている”しるし。",
    body_en: "A number for how wrong the predictions are — smaller is better. Learning is the game of driving it down. The red curve falling means it's getting smarter.",
  },
  gradientDescent: {
    ja: "勾配降下", en: "Gradient descent",
    body: "損失という“坂”を、いちばん急な下り方向へ少しずつ降りる学習法。各重みを「損失が減る向き」に動かす。これを何度も繰り返す。",
    body_en: "Walking down the 'hill' of the loss in the steepest direction, a little at a time — nudging each weight the way that reduces loss, over and over.",
  },
  learningRate: {
    ja: "学習率", en: "Learning rate",
    body: "1歩の大きさ。小さいとのろい、大きすぎると坂を飛び越えて暴れ、発散する。ちょうどいい歩幅を選ぶのが大事。",
    body_en: "The step size. Too small = slow; too big = overshoots the hill and diverges. Choosing the right step matters.",
  },
  epoch: {
    ja: "エポック", en: "Epoch",
    body: "訓練データを1周すること。何周も繰り返して少しずつ賢くなる。上のカウンタが回った回数。",
    body_en: "One pass over the training data. Repeat many times to gradually get smarter — that's the counter at the top.",
  },
  hiddenLayer: {
    ja: "隠れ層", en: "Hidden layer",
    body: "入力と出力の間にある層。複数のニューロンが入力を組み合わせ、直線では引けない“曲がった境界”を作れるようになる。ここが深層学習の力の源。",
    body_en: "A layer between input and output. Its neurons combine inputs to form curved boundaries a straight line can't — the source of deep learning's power.",
  },
  nonlinear: {
    ja: "非線形", en: "Non-linearity",
    body: "1本の直線では分けられない関係のこと。隠れ層＋活性化関数を重ねると、曲線や囲い込みのような複雑な境界を表現できる。",
    body_en: "Relationships a single straight line can't separate. Stacking hidden layers and activations lets the net draw curves and enclosed regions.",
  },
  decisionBoundary: {
    ja: "決定境界", en: "Decision boundary",
    body: "「ここから赤、ここから青」とネットが引く境目。左の図で色が切り替わる線・曲線がそれ。学習が進むほどデータに合わせて変形する。",
    body_en: "The line where the net switches from 'red' to 'blue'. It's the color edge in the left plot, reshaping to fit the data as training proceeds.",
  },
  backpropagation: {
    ja: "誤差逆伝播", en: "Backpropagation",
    body: "出力での誤差を、出力→隠れ層→入力と“後ろから前へ”伝えて、各重みをどう直せばいいかを計算する仕組み。図で赤く光る線が、いま大きく修正されている重み。連鎖律（合成関数の微分）でまとめて求める。",
    body_en: "Sends the output error backward (output → hidden → input) to compute how to fix each weight. The red-glowing lines are the weights being corrected hardest now. It uses the chain rule.",
  },
  deepNetwork: {
    ja: "深いネットワーク", en: "Deep network",
    body: "隠れ層を何層も重ねたネットワーク。層が増えるほど複雑な特徴を組み合わせられる。誤差逆伝播はどんなに深くても、後ろから順に勾配を伝えるだけで全層を学習できる。",
    body_en: "A network with many stacked hidden layers. More layers compose more complex features, and backprop trains them all by passing gradients backward, however deep.",
  },
  overfitting: {
    ja: "過学習", en: "Overfitting",
    body: "訓練データを“丸暗記”しすぎて、見たことのないデータで外すようになること。ネットが大きすぎる／学習しすぎると起きる。訓練の正解率は上がるのにテストの正解率が下がるのがサイン。",
    body_en: "Memorizing the training data so hard it fails on unseen data. Happens when the net is too big or trains too long. The tell: training accuracy rises while test accuracy falls.",
  },
  trainTestSplit: {
    ja: "訓練データとテストデータ", en: "Train / test split",
    body: "データを“練習用(訓練)”と“本番テスト用”に分ける。学習は訓練データだけで行い、見たことのないテストデータで本当の実力（汎化）を測る。グラフの青=訓練、紫の点線=テスト。",
    body_en: "Split data into 'practice' (train) and 'exam' (test). Learn only on train, then measure true skill (generalization) on unseen test data. Blue = train, purple dashed = test.",
  },
  generalization: {
    ja: "汎化", en: "Generalization",
    body: "見たことのないデータにもちゃんと当てられる力。丸暗記ではなく“本質”をつかめているということ。これこそ機械学習のゴール。",
    body_en: "The ability to get unseen data right — grasping the essence rather than memorizing. This is the real goal of machine learning.",
  },
  earlyStopping: {
    ja: "早期終了", en: "Early stopping",
    body: "テストの成績がいちばん良いところで学習を止める工夫。やりすぎると過学習で悪化するので、ちょうど良いところで切り上げる。",
    body_en: "Stop training where test performance peaks. Train too long and overfitting sets in, so quit at the sweet spot.",
  },
  softmax: {
    ja: "ソフトマックス", en: "Softmax",
    body: "複数の出力を“合計1の確率”に変える関数。10個の数字それぞれの確信度を出し、いちばん高いものを答えにする。多クラス分類の定番。",
    body_en: "Turns several outputs into probabilities that sum to 1. Gives a confidence for each of the 10 digits and picks the highest. The standard for multiclass.",
  },
  multiclass: {
    ja: "多クラス分類", en: "Multiclass classification",
    body: "3つ以上のグループに分ける問題。2色分けの拡張で、出力をクラスの数だけ用意し、softmax で確率にする。手書き数字は0〜9の10クラス。",
    body_en: "Sorting into three or more groups. It extends two-color classification: one output per class, turned into probabilities by softmax. Digits are 10 classes (0–9).",
  },
};
