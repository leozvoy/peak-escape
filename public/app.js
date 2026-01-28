const initialInput = document.getElementById("initialValue");
const confirmInitialButton = document.getElementById("confirmInitial");
const statusPill = document.getElementById("statusPill");
const initialOverlay = document.getElementById("initialOverlay");
const totalValueEl = document.getElementById("totalValue");
const totalProfitEl = document.getElementById("totalProfit");
const realizedProfitEl = document.getElementById("realizedProfit");
const unrealizedProfitEl = document.getElementById("unrealizedProfit");
const currentPriceEl = document.getElementById("currentPrice");
const currentSharesEl = document.getElementById("currentShares");
const addNodeButton = document.getElementById("addNode");
const nodeModal = document.getElementById("nodeModal");
const closeModalButton = document.getElementById("closeModal");
const confirmNodeButton = document.getElementById("confirmNode");
const resetAllButton = document.getElementById("resetAll");
const changePercentInput = document.getElementById("changePercent");
const changePercentSlider = document.getElementById("changePercentSlider");
const tradePercentInput = document.getElementById("tradePercent");
const tradePercentSlider = document.getElementById("tradePercentSlider");
const buyAmountInput = document.getElementById("buyAmount");
const sellPercentField = document.getElementById("sellPercentField");
const buyAmountField = document.getElementById("buyAmountField");
const typeSellButton = document.getElementById("typeSell");
const typeBuyButton = document.getElementById("typeBuy");
const nodesList = document.getElementById("nodesList");
const chartGrid = document.getElementById("chartGrid");
const chartLinePath = document.getElementById("chartLinePath");
const chartPoints = document.getElementById("chartPoints");
const chartLabels = document.getElementById("chartLabels");
const chartYAxisLabels = document.getElementById("chartYAxisLabels");
const chartEmpty = document.getElementById("chartEmpty");

const state = {
  initialized: false,
  initialValue: 0,
  initialShares: 1,
  price: 0,
  shares: 0,
  costBasisTotal: 0,
  realizedProfit: 0,
  realizedProceeds: 0,
  cumulativeChangePercent: 0,
  nodeCounter: 0,
  nodes: []
};

let selectedTradeType = "sell";

const formatMoney = (value) => {
  if (!Number.isFinite(value)) return "--";
  return value.toLocaleString("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

const formatPercent = (value) => {
  if (!Number.isFinite(value)) return "--";
  return `${value.toFixed(2)}%`;
};

const formatSignedMoney = (value) => {
  if (!Number.isFinite(value)) return "--";
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}${Math.abs(value).toLocaleString("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

const formatSignedPercent = (value) => {
  if (!Number.isFinite(value)) return "--";
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}${Math.abs(value).toFixed(2)}%`;
};

const applySignedStyle = (element, value) => {
  element.classList.remove("positive", "negative", "neutral");
  if (value > 0) {
    element.classList.add("positive");
  } else if (value < 0) {
    element.classList.add("negative");
  } else {
    element.classList.add("neutral");
  }
};

const updateSummary = () => {
  if (!state.initialized) return;

  const holdingValue = state.shares * state.price;
  const totalValue = holdingValue + state.realizedProceeds;
  const unrealizedProfit = holdingValue - state.costBasisTotal;
  const totalProfit = state.realizedProfit + unrealizedProfit;
  const priceChangePercent = state.cumulativeChangePercent;
  const holdingPercent = (state.shares / state.initialShares) * 100;

  totalValueEl.textContent = formatMoney(totalValue);
  totalProfitEl.textContent = formatSignedMoney(totalProfit);
  realizedProfitEl.textContent = formatSignedMoney(state.realizedProfit);
  unrealizedProfitEl.textContent = formatSignedMoney(unrealizedProfit);
  currentPriceEl.textContent = formatSignedPercent(priceChangePercent);
  applySignedStyle(currentPriceEl, priceChangePercent);
  currentSharesEl.textContent = `${formatPercent(holdingPercent)} ｜ ${formatMoney(holdingValue)}`;
  applySignedStyle(totalProfitEl, totalProfit);
  applySignedStyle(realizedProfitEl, state.realizedProfit);
  applySignedStyle(unrealizedProfitEl, unrealizedProfit);
};

const renderNodes = () => {
  nodesList.innerHTML = "";

  if (state.nodes.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "暂无节点，请点击 ➕ 添加。";
    nodesList.appendChild(empty);
    return;
  }

  [...state.nodes].reverse().forEach((node) => {
    const item = document.createElement("div");
    item.className = "node-item";

    const title = document.createElement("strong");
    const changeValue = Number(node.changePercent);
    title.textContent = `节点 ${node.sequence} · ${formatSignedPercent(changeValue)}`;
    applySignedStyle(title, changeValue);

    const detail = document.createElement("span");
    if (node.tradeType === "sell") {
      detail.textContent = `卖出 ${node.tradePercent}% ｜ ${formatMoney(node.tradeValue)}`;
    } else {
      detail.textContent = `买入 ${formatMoney(node.tradeValue)}`;
    }

    const result = document.createElement("span");
    result.textContent = `当前涨跌 ${formatSignedPercent(node.priceChangePercent)} ｜ 持仓 ${formatPercent(
      node.holdingPercent
    )} ｜ ${formatMoney(node.holdingValue)}`;
    applySignedStyle(result, node.priceChangePercent);

    item.appendChild(title);
    item.appendChild(detail);
    item.appendChild(result);
    nodesList.appendChild(item);
  });
};

const renderChart = () => {
  chartGrid.innerHTML = "";
  chartPoints.innerHTML = "";
  chartLabels.innerHTML = "";
  chartYAxisLabels.innerHTML = "";

  if (!state.initialized) {
    chartLinePath.setAttribute("points", "");
    chartEmpty.textContent = "等待输入初始价值";
    chartEmpty.style.display = "block";
    return;
  }

  const dataPoints = [
    {
      pricePercent: 100,
      holdingPercent: 100
    },
    ...state.nodes.map((node) => ({
      pricePercent: node.pricePercent,
      holdingPercent: node.holdingPercent
    }))
  ];

  const priceValues = dataPoints.map((point) => point.pricePercent);

  const minPrice = Math.min(...priceValues, 0);
  const maxPrice = Math.max(...priceValues, 120);

  const width = 640;
  const height = 300;
  const padding = { top: 20, right: 24, bottom: 44, left: 56 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const stepCount = Math.max(dataPoints.length - 1, 1);
  const scaleX = (index) => padding.left + (chartWidth / stepCount) * index;
  const scaleY = (value) =>
    padding.top + (1 - (value - minPrice) / (maxPrice - minPrice || 1)) * chartHeight;

  const gridLines = 4;
  for (let i = 0; i <= gridLines; i += 1) {
    const y = padding.top + (chartHeight / gridLines) * i;
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", padding.left);
    line.setAttribute("x2", width - padding.right);
    line.setAttribute("y1", y);
    line.setAttribute("y2", y);
    line.setAttribute("class", "chart-grid-line");
    chartGrid.appendChild(line);

    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    const value = maxPrice - ((maxPrice - minPrice) / gridLines) * i;
    label.setAttribute("x", padding.left - 8);
    label.setAttribute("y", y + 4);
    label.setAttribute("text-anchor", "end");
    label.setAttribute("class", "chart-axis-y");
    label.textContent = `${value.toFixed(0)}%`;
    chartYAxisLabels.appendChild(label);
  }

  for (let i = 0; i <= stepCount; i += 1) {
    const x = scaleX(i);
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", x);
    line.setAttribute("x2", x);
    line.setAttribute("y1", padding.top);
    line.setAttribute("y2", height - padding.bottom);
    line.setAttribute("class", "chart-grid-line");
    chartGrid.appendChild(line);
  }

  const points = dataPoints
    .map((point, index) => `${scaleX(index)},${scaleY(point.pricePercent)}`)
    .join(" ");
  chartLinePath.setAttribute("points", points);

  dataPoints.forEach((point, index) => {
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", scaleX(index));
    circle.setAttribute("cy", scaleY(point.pricePercent));
    circle.setAttribute("r", 4);
    circle.setAttribute("class", "chart-point");
    chartPoints.appendChild(circle);

    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", scaleX(index));
    label.setAttribute("y", height - 16);
    label.setAttribute("text-anchor", "middle");
    label.setAttribute("class", "chart-axis-tick");
    label.textContent = `${point.holdingPercent.toFixed(1)}%`;
    chartLabels.appendChild(label);
  });

  chartEmpty.style.display = state.nodes.length === 0 ? "block" : "none";
  if (state.nodes.length === 0) {
    chartEmpty.textContent = "已初始化，等待添加节点";
  }
};

const setTradeType = (type) => {
  selectedTradeType = type;
  const isSell = type === "sell";
  typeSellButton.classList.toggle("active", isSell);
  typeBuyButton.classList.toggle("active", !isSell);
  sellPercentField.classList.toggle("hidden", !isSell);
  buyAmountField.classList.toggle("hidden", isSell);
};

const syncSlider = (input, slider) => {
  input.addEventListener("input", () => {
    slider.value = input.value || 0;
  });
  slider.addEventListener("input", () => {
    input.value = slider.value;
  });
};

const openModal = () => {
  if (!state.initialized) return;
  nodeModal.classList.add("show");
  nodeModal.setAttribute("aria-hidden", "false");
  setTradeType(selectedTradeType);
};

const closeModal = () => {
  nodeModal.classList.remove("show");
  nodeModal.setAttribute("aria-hidden", "true");
};

const setStatus = (text) => {
  statusPill.textContent = text;
};

const setInitialOverlay = (visible) => {
  initialOverlay.classList.toggle("hidden", !visible);
  initialOverlay.setAttribute("aria-hidden", (!visible).toString());
};

confirmInitialButton.addEventListener("click", () => {
  const value = Number(initialInput.value);
  if (!Number.isFinite(value) || value <= 0) {
    setStatus("请输入有效的初始买入价值");
    return;
  }

  state.initialized = true;
  state.initialValue = value;
  state.price = value;
  state.shares = 1;
  state.initialShares = 1;
  state.costBasisTotal = value;
  state.realizedProfit = 0;
  state.realizedProceeds = 0;
  state.cumulativeChangePercent = 0;
  state.nodeCounter = 0;
  state.nodes = [];

  setStatus("已初始化，可添加节点");
  updateSummary();
  renderNodes();
  renderChart();
  setInitialOverlay(false);
});

addNodeButton.addEventListener("click", openModal);
closeModalButton.addEventListener("click", closeModal);
typeSellButton.addEventListener("click", () => setTradeType("sell"));
typeBuyButton.addEventListener("click", () => setTradeType("buy"));
nodeModal.addEventListener("click", (event) => {
  if (event.target === nodeModal) {
    closeModal();
  }
});

confirmNodeButton.addEventListener("click", () => {
  const changePercent = Number(changePercentInput.value);
  const tradePercent = Number(tradePercentInput.value);
  const tradeType = selectedTradeType;
  const buyAmount = Number(buyAmountInput.value);

  if (!Number.isFinite(changePercent)) {
    setStatus("请填写有效的涨跌幅");
    return;
  }

  if (tradeType === "sell" && (tradePercent < 0 || tradePercent > 100)) {
    setStatus("比例需在 0 到 100 之间");
    return;
  }

  if (tradeType === "sell" && state.shares <= 0) {
    setStatus("当前没有持仓可卖出");
    return;
  }

  if (tradeType === "buy" && (!Number.isFinite(buyAmount) || buyAmount <= 0)) {
    setStatus("请输入有效的买入金额");
    return;
  }

  state.cumulativeChangePercent = changePercent;
  state.price = state.initialValue * (1 + changePercent / 100);
  const priceChangePercent = changePercent;

  let tradeValue = 0;
  if (tradeType === "sell") {
    const sellShares = state.shares * (tradePercent / 100);
    const proceeds = sellShares * state.price;
    const costPortion = state.shares > 0 ? state.costBasisTotal * (sellShares / state.shares) : 0;
    state.realizedProfit += proceeds - costPortion;
    state.costBasisTotal -= costPortion;
    state.shares -= sellShares;
    state.realizedProceeds += proceeds;
    tradeValue = proceeds;
  } else {
    const buyShares = buyAmount / state.price;
    const buyCost = buyAmount;
    state.shares += buyShares;
    state.costBasisTotal += buyCost;
    tradeValue = buyCost;
  }

  const holdingPercent = (state.shares / state.initialShares) * 100;
  const holdingValue = state.shares * state.price;

  state.nodeCounter += 1;
  state.nodes.push({
    changePercent: changePercent.toFixed(2),
    tradePercent: tradePercent.toFixed(2),
    tradeType,
    price: state.price,
    shares: state.shares,
    priceChangePercent,
    holdingPercent,
    holdingValue,
    tradeValue,
    pricePercent: 100 + changePercent,
    sequence: state.nodeCounter
  });

  updateSummary();
  renderNodes();
  renderChart();
  setStatus("节点已更新");

  changePercentInput.value = "";
  tradePercentInput.value = "";
  tradePercentSlider.value = 0;
  buyAmountInput.value = "";
  changePercentSlider.value = 0;
  closeModal();
});

resetAllButton.addEventListener("click", () => {
  state.initialized = false;
  state.initialValue = 0;
  state.initialShares = 1;
  state.price = 0;
  state.shares = 0;
  state.costBasisTotal = 0;
  state.realizedProfit = 0;
  state.realizedProceeds = 0;
  state.cumulativeChangePercent = 0;
  state.nodeCounter = 0;
  state.nodes = [];
  initialInput.value = "";
  setStatus("等待输入初始买入价值");
  totalValueEl.textContent = "--";
  totalProfitEl.textContent = "--";
  realizedProfitEl.textContent = "--";
  unrealizedProfitEl.textContent = "--";
  currentPriceEl.textContent = "--";
  currentSharesEl.textContent = "--";
  currentPriceEl.classList.remove("positive", "negative", "neutral");
  totalProfitEl.classList.remove("positive", "negative", "neutral");
  realizedProfitEl.classList.remove("positive", "negative", "neutral");
  unrealizedProfitEl.classList.remove("positive", "negative", "neutral");
  renderNodes();
  renderChart();
  setInitialOverlay(true);
});

syncSlider(changePercentInput, changePercentSlider);
syncSlider(tradePercentInput, tradePercentSlider);

updateSummary();
renderNodes();
renderChart();
setInitialOverlay(!state.initialized);
