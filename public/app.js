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

const state = {
  initialized: false,
  initialValue: 0,
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
  state.costBasisTotal = value;
  state.realizedProfit = 0;
  state.nodes = [];

  setStatus("已初始化，可添加节点");
  updateSummary();
  renderNodes();
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
  setStatus("节点已更新");

  changePercentInput.value = "";
  tradePercentInput.value = "";
  closeModal();
});

updateSummary();
renderNodes();
