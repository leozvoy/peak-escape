const initialInput = document.getElementById("initialValue");
const confirmInitialButton = document.getElementById("confirmInitial");
const statusPill = document.getElementById("statusPill");
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
const changePercentInput = document.getElementById("changePercent");
const tradeTypeSelect = document.getElementById("tradeType");
const tradePercentInput = document.getElementById("tradePercent");
const nodesList = document.getElementById("nodesList");
const chartGrid = document.getElementById("chartGrid");
const chartLinePath = document.getElementById("chartLinePath");
const chartPoints = document.getElementById("chartPoints");
const chartEmpty = document.getElementById("chartEmpty");

const state = {
  initialized: false,
  initialValue: 0,
  initialShares: 1,
  price: 0,
  shares: 0,
  costBasisTotal: 0,
  realizedProfit: 0,
  nodes: []
};

const formatMoney = (value) => {
  if (!Number.isFinite(value)) return "--";
  return value.toLocaleString("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

const formatShares = (value) => {
  if (!Number.isFinite(value)) return "--";
  return value.toLocaleString("zh-CN", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4
  });
};

const updateSummary = () => {
  if (!state.initialized) return;

  const totalValue = state.shares * state.price;
  const unrealizedProfit = totalValue - state.costBasisTotal;
  const totalProfit = state.realizedProfit + unrealizedProfit;

  totalValueEl.textContent = formatMoney(totalValue);
  totalProfitEl.textContent = formatMoney(totalProfit);
  realizedProfitEl.textContent = formatMoney(state.realizedProfit);
  unrealizedProfitEl.textContent = formatMoney(unrealizedProfit);
  currentPriceEl.textContent = formatMoney(state.price);
  currentSharesEl.textContent = formatShares(state.shares);
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

  state.nodes.forEach((node, index) => {
    const item = document.createElement("div");
    item.className = "node-item";

    const title = document.createElement("strong");
    title.textContent = `节点 ${index + 1} · ${node.changePercent}%`;

    const detail = document.createElement("span");
    detail.textContent = `${node.tradeType === "sell" ? "卖出" : "买入"} ${node.tradePercent}% 持仓`;

    const result = document.createElement("span");
    result.textContent = `当前价格 ${formatMoney(node.price)} ｜ 持仓 ${formatShares(node.shares)}`;

    item.appendChild(title);
    item.appendChild(detail);
    item.appendChild(result);
    nodesList.appendChild(item);
  });
};

const renderChart = () => {
  chartGrid.innerHTML = "";
  chartPoints.innerHTML = "";

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
      pricePercent: (node.price / state.initialValue) * 100,
      holdingPercent: (node.shares / state.initialShares) * 100
    }))
  ];

  const priceValues = dataPoints.map((point) => point.pricePercent);
  const holdingValues = dataPoints.map((point) => point.holdingPercent);

  const minPrice = Math.min(...priceValues, 0);
  const maxPrice = Math.max(...priceValues, 120);
  const minHolding = Math.min(...holdingValues, 0);
  const maxHolding = Math.max(...holdingValues, 120);

  const width = 640;
  const height = 260;
  const padding = { top: 20, right: 24, bottom: 30, left: 40 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const scaleX = (value) =>
    padding.left + ((value - minHolding) / (maxHolding - minHolding || 1)) * chartWidth;
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
  }

  for (let i = 0; i <= gridLines; i += 1) {
    const x = padding.left + (chartWidth / gridLines) * i;
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", x);
    line.setAttribute("x2", x);
    line.setAttribute("y1", padding.top);
    line.setAttribute("y2", height - padding.bottom);
    line.setAttribute("class", "chart-grid-line");
    chartGrid.appendChild(line);
  }

  const points = dataPoints
    .map((point) => `${scaleX(point.holdingPercent)},${scaleY(point.pricePercent)}`)
    .join(" ");
  chartLinePath.setAttribute("points", points);

  dataPoints.forEach((point) => {
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", scaleX(point.holdingPercent));
    circle.setAttribute("cy", scaleY(point.pricePercent));
    circle.setAttribute("r", 4);
    circle.setAttribute("class", "chart-point");
    chartPoints.appendChild(circle);
  });

  chartEmpty.style.display = state.nodes.length === 0 ? "block" : "none";
  if (state.nodes.length === 0) {
    chartEmpty.textContent = "已初始化，等待添加节点";
  }
};

const openModal = () => {
  if (!state.initialized) return;
  nodeModal.classList.add("show");
  nodeModal.setAttribute("aria-hidden", "false");
};

const closeModal = () => {
  nodeModal.classList.remove("show");
  nodeModal.setAttribute("aria-hidden", "true");
};

const setStatus = (text) => {
  statusPill.textContent = text;
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
  state.nodes = [];

  setStatus("已初始化，可添加节点");
  updateSummary();
  renderNodes();
  renderChart();
});

addNodeButton.addEventListener("click", openModal);
closeModalButton.addEventListener("click", closeModal);
nodeModal.addEventListener("click", (event) => {
  if (event.target === nodeModal) {
    closeModal();
  }
});

confirmNodeButton.addEventListener("click", () => {
  const changePercent = Number(changePercentInput.value);
  const tradePercent = Number(tradePercentInput.value);
  const tradeType = tradeTypeSelect.value;

  if (!Number.isFinite(changePercent) || !Number.isFinite(tradePercent)) {
    setStatus("请填写有效的涨跌幅和比例");
    return;
  }

  if (tradePercent < 0 || tradePercent > 100) {
    setStatus("比例需在 0 到 100 之间");
    return;
  }

  if (tradeType === "sell" && state.shares <= 0) {
    setStatus("当前没有持仓可卖出");
    return;
  }

  state.price *= 1 + changePercent / 100;

  if (tradeType === "sell") {
    const sellShares = state.shares * (tradePercent / 100);
    const proceeds = sellShares * state.price;
    const costPortion = state.shares > 0 ? state.costBasisTotal * (sellShares / state.shares) : 0;
    state.realizedProfit += proceeds - costPortion;
    state.costBasisTotal -= costPortion;
    state.shares -= sellShares;
  } else {
    const buyShares = state.shares * (tradePercent / 100);
    const buyCost = buyShares * state.price;
    state.shares += buyShares;
    state.costBasisTotal += buyCost;
  }

  state.nodes.push({
    changePercent: changePercent.toFixed(2),
    tradePercent: tradePercent.toFixed(2),
    tradeType,
    price: state.price,
    shares: state.shares
  });

  updateSummary();
  renderNodes();
  renderChart();
  setStatus("节点已更新");

  changePercentInput.value = "";
  tradePercentInput.value = "";
  closeModal();
});

updateSummary();
renderNodes();
renderChart();
