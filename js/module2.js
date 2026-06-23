/**
 * Módulo lógico de cálculo: Fijación de PVP Comercial Recomendado.
 */
const Module2 = {
  calculate: (state) => {
    const overrideBtn = document.getElementById('btn-override');
    let baseUnitCost = state.results1.realUnitCost;

    if (overrideBtn.classList.contains('bg-amber-500')) {
      baseUnitCost = parseFloat(document.getElementById('pricing-cost-override').value) || 0;
    }

    // Extracción de márgenes comerciales del pool del DOM
    state.pricing.variableExpenses = Utils.safeNum('price-var');
    state.pricing.fixedExpenses = Utils.safeNum('price-fix');
    state.pricing.financialExpenses = Utils.safeNum('price-fin');
    state.pricing.targetProfit = Utils.safeNum('price-profit');

    // Sumatorio analítico de la estructura de costes operativos
    state.results2.totalExpensesPercent =
      state.pricing.variableExpenses +
      state.pricing.fixedExpenses +
      state.pricing.financialExpenses;

    const GT = state.results2.totalExpensesPercent / 100;
    const B = state.pricing.targetProfit / 100;

    // Disparador de seguridad ante asíntotas matemáticas de quiebra estructural
    if ((state.results2.totalExpensesPercent + state.pricing.targetProfit) >= 100) {
      document.getElementById('error-pricing').classList.remove('hidden');

      // Bloqueo técnico de resultados inconsistentes
      state.results2.minimumPrice = 0;
      state.results2.recommendedPrice = 0;
      state.results2.profitPerUnit = 0;
      state.results2.grossMarginPercent = 0;
      state.results2.netMarginPercent = 0;
      state.results2.totalOperationProfit = 0;
    } else {
      document.getElementById('error-pricing').classList.add('hidden');

      // Fórmulas asintóticas financieras avanzadas sobre el PVP final
      state.results2.minimumPrice = baseUnitCost / (1 - GT);
      state.results2.recommendedPrice = baseUnitCost / (1 - GT - B);

      state.results2.profitPerUnit = state.results2.recommendedPrice * B;

      if (state.results2.recommendedPrice > 0) {
        state.results2.grossMarginPercent = ((state.results2.recommendedPrice - baseUnitCost) / state.results2.recommendedPrice) * 100;
      } else {
        state.results2.grossMarginPercent = 0;
      }
      state.results2.netMarginPercent = state.pricing.targetProfit; // Por definición analítica del framework
      state.results2.totalOperationProfit = state.results2.profitPerUnit * state.fob.quantity;
    }

    // Renderizado visual dinámico de la barra de desglose porcentual
    const barFlow = document.getElementById('bar-pricing-flow');
    barFlow.innerHTML = '';

    const segments = [
      { label: 'Var.', val: state.pricing.variableExpenses, color: 'bg-blue-600' },
      { label: 'Fijo', val: state.pricing.fixedExpenses, color: 'bg-purple-600' },
      { label: 'Fin.', val: state.pricing.financialExpenses, color: 'bg-pink-600' },
      { label: 'Neto', val: state.pricing.targetProfit, color: 'bg-emerald-600' }
    ];

    let totalAllocatedPct = 0;
    segments.forEach(seg => {
      if (seg.val > 0) {
        totalAllocatedPct += seg.val;
        const div = document.createElement('div');
        div.className = `${seg.color} h-full flex items-center justify-center transition-all min-w-[20px]`;
        div.style.width = `${seg.val}%`;
        div.innerText = `${seg.label} ${seg.val}%`;
        div.title = `${seg.label}: ${seg.val}%`;
        barFlow.appendChild(div);
      }
    });

    const freePct = 100 - totalAllocatedPct;
    if (freePct > 0 && freePct <= 100) {
      const div = document.createElement('div');
      div.className = 'bg-slate-200 dark:bg-slate-700 h-full text-slate-700 dark:text-slate-300 flex items-center justify-center transition-all';
      div.style.width = `${freePct}%`;
      div.innerText = `C.Prod ${freePct.toFixed(1)}%`;
      barFlow.appendChild(div);
    }

    // Inyección de la tabla de resultados analíticos del Módulo 2
    const sCurr = state.article.saleCurrency;
    document.getElementById('res2-cost').innerText = Utils.formatCurrency(baseUnitCost, sCurr);
    document.getElementById('res2-min').innerText = Utils.formatCurrency(state.results2.minimumPrice, sCurr);
    document.getElementById('res2-rec').innerText = Utils.formatCurrency(state.results2.recommendedPrice, sCurr);
    document.getElementById('res2-unit-profit').innerText = Utils.formatCurrency(state.results2.profitPerUnit, sCurr);
    document.getElementById('res2-gross-pct').innerText = Utils.formatPercent(state.results2.grossMarginPercent);
    document.getElementById('res2-net-pct').innerText = Utils.formatPercent(state.results2.netMarginPercent);
    document.getElementById('res2-total-profit').innerText = Utils.formatCurrency(state.results2.totalOperationProfit, sCurr);
  }
};