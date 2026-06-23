/**
 * Arquitectura de control central, enrutamiento SPA y orquestación de estados.
 */

// Estado global centralizado reactivo
const state = {
  meta: { lastSaved: null, isDirty: false },
  article: { name: '', reference: '', supplier: '', country: '', purchaseCurrency: 'USD', saleCurrency: 'EUR', exchangeRate: 1 },
  fob: { unitPrice: 0, quantity: 0, total: 0 },
  packaging: { unitsPerBox: 1, numberOfBoxes: 0, length: 0, width: 0, height: 0, cbmPerBox: 0, totalCbm: 0 },
  container: { type: '20ft', capacity: 33, occupancyPercent: 0, overCapacity: false },
  freight: { originPort: '', destinationPort: '', mode: 'FCL', totalCost: 0, freightCurrency: 'USD', allocatedCost: 0 },
  insurance: { mode: 'percent', rate: 0, fixedAmount: 0, amount: 0 },
  tariff: { rate: 0, hsCode: '', cifBase: 0, amount: 0 },
  destination: { forwarder: 0, customs: 0, transport: 0, other: 0, total: 0 },
  results1: { fobTotalInSaleCurrency: 0, freightInSaleCurrency: 0, insuranceInSaleCurrency: 0, tariffInSaleCurrency: 0, destinationTotal: 0, totalImportCost: 0, realUnitCost: 0 },
  pricing: { variableExpenses: 0, fixedExpenses: 0, financialExpenses: 0, targetProfit: 0 },
  results2: { totalExpensesPercent: 0, minimumPrice: 0, recommendedPrice: 0, profitPerUnit: 0, grossMarginPercent: 0, netMarginPercent: 0, totalOperationProfit: 0 },
  history: []
};

// Orquestador maestro de recálculos matemáticos en tiempo real
function recalculate() {
  Module1.calculate(state);
  Module2.calculate(state);

  // Repintado síncrono del set visual de gráficos
  ChartsController.renderDonut(state);
  ChartsController.renderBarStacked(state);

  state.meta.isDirty = true;
  toggleSaveButtonState();
}

function toggleSaveButtonState() {
  const btnSave = document.getElementById('btn-save');
  const hasRequired = document.getElementById('art-name').value.trim() !== '' &&
    document.getElementById('art-supplier').value.trim() !== '';

  if (hasRequired) {
    btnSave.removeAttribute('disabled');
    btnSave.className = "w-full bg-[#2563EB] hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors duration-150 flex items-center justify-center gap-2 cursor-pointer";
  } else {
    btnSave.setAttribute('disabled', 'true');
    btnSave.className = "w-full bg-slate-400 text-slate-200 font-medium py-2 px-4 rounded-lg text-sm flex items-center justify-center gap-2 cursor-not-allowed opacity-50";
  }
}

// Inicializador del Ciclo de Vida del DOM
document.addEventListener('DOMContentLoaded', () => {
  // Enrutamiento de interfaz responsive (Menú hamburguesa)
  const btnMenu = document.getElementById('btn-menu');
  const sidebar = document.getElementById('sidebar');
  const menuIcon = document.getElementById('menu-icon');

  btnMenu.addEventListener('click', () => {
    sidebar.classList.toggle('-translate-x-full');
    if (sidebar.classList.contains('-translate-x-full')) {
      menuIcon.setAttribute('d', 'M4 6h16M4 12h16M4 18h16'); // Hamburguesa
    } else {
      menuIcon.setAttribute('d', 'M6 18L18 6M6 6l12 12'); // Cruz de cierre
    }
  });

  // Control de cierres de menú automáticos al pulsar anchors en layouts móviles
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      if (window.innerWidth < 768) {
        sidebar.classList.add('-translate-x-full');
        menuIcon.setAttribute('d', 'M4 6h16M4 12h16M4 18h16');
      }
    });
  });

  // Control del Tema de Color (Dark/Light Mode nativo)
  const btnTheme = document.getElementById('btn-theme');
  const themeIcon = document.getElementById('theme-icon');

  // Hidratación del tema preferido del usuario
  if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
    themeIcon.setAttribute('d', 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M14 12a2 2 0 11-4 0 2 2 0 014 0z'); // Sol
  } else {
    document.documentElement.classList.remove('dark');
    themeIcon.setAttribute('d', 'M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z'); // Luna
  }

  btnTheme.addEventListener('click', () => {
    if (document.documentElement.classList.contains('dark')) {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
      themeIcon.setAttribute('d', 'M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
      themeIcon.setAttribute('d', 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M14 12a2 2 0 11-4 0 2 2 0 014 0z');
    }
  });

  // Gestión del cambio dinámico del select del país de origen
  document.getElementById('art-country').addEventListener('change', (e) => {
    const otherInput = document.getElementById('art-country-other');
    if (e.target.value === 'Otro') {
      otherInput.classList.remove('hidden');
      otherInput.setAttribute('required', 'true');
    } else {
      otherInput.classList.add('hidden');
      otherInput.removeAttribute('required');
    }
    recalculate();
  });

  // Gestión estructural de las cards del tipo de contenedor
  document.querySelectorAll('.container-card').forEach(card => {
    card.addEventListener('click', function () {
      document.querySelectorAll('.container-card').forEach(c => {
        c.className = "container-card cursor-pointer border border-slate-200 dark:border-slate-700 dark:bg-slate-900 rounded-xl p-4 transition-all";
        c.querySelector('.radio-dot').className = "radio-dot w-3 h-3 rounded-full border border-slate-300";
      });
      this.className = "container-card cursor-pointer border-2 border-blue-600 bg-blue-50/30 dark:bg-slate-900 rounded-xl p-4 transition-all";
      this.querySelector('.radio-dot').className = "radio-dot w-3 h-3 rounded-full bg-blue-600";

      state.container.type = this.dataset.value;
      recalculate();
    });
  });

  // Gestión de sub-tabs de configuración de seguros
  const tabPct = document.getElementById('tab-ins-percent');
  const tabFix = document.getElementById('tab-ins-fixed');
  const contPct = document.getElementById('container-ins-percent');
  const contFix = document.getElementById('container-ins-fixed');

  tabPct.addEventListener('click', () => {
    tabPct.className = "text-sm font-medium text-blue-600 border-b-2 border-blue-600 pb-1.5 px-1 focus:outline-none";
    tabFix.className = "text-sm font-medium text-slate-400 hover:text-slate-600 pb-1.5 px-1 focus:outline-none";
    contPct.classList.remove('hidden');
    contFix.classList.add('hidden');
    recalculate();
  });

  tabFix.addEventListener('click', () => {
    tabFix.className = "text-sm font-medium text-blue-600 border-b-2 border-blue-600 pb-1.5 px-1 focus:outline-none";
    tabPct.className = "text-sm font-medium text-slate-400 hover:text-slate-600 pb-1.5 px-1 focus:outline-none";
    contFix.classList.remove('hidden');
    contPct.classList.add('hidden');
    recalculate();
  });

  // Botón de activación de override manual de costes de comercialización
  const btnOverride = document.getElementById('btn-override');
  const costOverrideInput = document.getElementById('pricing-cost-override');
  btnOverride.addEventListener('click', () => {
    btnOverride.classList.toggle('bg-amber-500');
    btnOverride.classList.toggle('text-white');
    if (btnOverride.classList.contains('bg-amber-500')) {
      costOverrideInput.removeAttribute('readonly');
      costOverrideInput.className = "w-full bg-white dark:bg-slate-900 border border-amber-500 rounded-l-lg px-3 py-2 text-sm text-slate-800 dark:text-white font-mono focus:outline-none";
    } else {
      costOverrideInput.setAttribute('readonly', 'true');
      costOverrideInput.className = "w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-l-lg px-3 py-2 text-sm text-slate-500 font-mono focus:outline-none";
      costOverrideInput.value = state.results1.realUnitCost.toFixed(4);
    }
    recalculate();
  });

  // Mapeado global reactivo a eventos de pulsación de teclado y cambios en el formulario
  const form = document.getElementById('calc-form');
  form.addEventListener('input', recalculate);
  form.addEventListener('change', recalculate);

  // Conexión del motor CRUD histórico
  const refreshHistory = () => {
    state.history = HistoryManager.load();
    HistoryManager.renderTable(state.history, restoreSnapshot, deleteHistoryRecord, viewHistoryModal);
    ChartsController.renderHistoryLine(state.history);

    // El botón de ejemplo se muestra solo si el histórico está limpio y el formulario vacío
    const hasData = document.getElementById('art-name').value.trim() !== '';
    if (state.history.length === 0 && !hasData) {
      document.getElementById('btn-load-demo').classList.remove('hidden');
    } else {
      document.getElementById('btn-load-demo').classList.add('hidden');
    }
  };

  document.getElementById('btn-save').addEventListener('click', () => {
    if (HistoryManager.saveRecord(state)) {
      refreshHistory();
      alert('Cálculo consolidado con éxito en el histórico local.');
    }
  });

  // Gestión del botón "Nuevo Cálculo" con control de descarte de cambios
  document.getElementById('btn-new').addEventListener('click', () => {
    if (state.meta.isDirty) {
      if (!confirm('Existen cambios no guardados en el cálculo en curso. ¿Desea descartar la operación actual?')) {
        return;
      }
    }
    form.reset();
    document.getElementById('art-country-other').classList.add('hidden');
    if (btnOverride.classList.contains('bg-amber-500')) btnOverride.click();

    // Reset manual de estados internos
    state.container.type = '20ft';
    document.querySelectorAll('.container-card')[0].click();
    tabPct.click();

    recalculate();
    state.meta.isDirty = false;
    refreshHistory();
  });

  // Lógica del filtro de búsqueda en tiempo real del histórico
  document.getElementById('hist-search').addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    const filtered = state.history.filter(r =>
      r.articleName.toLowerCase().includes(query) ||
      r.supplier.toLowerCase().includes(query)
    );
    HistoryManager.renderTable(filtered, restoreSnapshot, deleteHistoryRecord, viewHistoryModal);
  });

  // Acciones operacionales del histórico
  function deleteHistoryRecord(id) {
    HistoryManager.deleteRecord(id);
    refreshHistory();
  }

  function restoreSnapshot(id) {
    const rec = state.history.find(r => r.id === id);
    if (!rec) return;

    // Hidratación directa del DOM desde snapshot
    const s = rec.snapshot;
    document.getElementById('art-name').value = s.article.name;
    document.getElementById('art-ref').value = s.article.reference || '';
    document.getElementById('art-supplier').value = s.article.supplier;

    if (['China', 'India', 'Vietnam', 'Bangladesh', 'Turquía', 'EE.UU.'].includes(s.article.country)) {
      document.getElementById('art-country').value = s.article.country;
      document.getElementById('art-country-other').classList.add('hidden');
    } else {
      document.getElementById('art-country').value = 'Otro';
      const other = document.getElementById('art-country-other');
      other.classList.remove('hidden');
      other.value = s.article.country;
    }

    document.getElementById('currency-purchase').value = s.article.purchaseCurrency;
    document.getElementById('currency-sale').value = s.article.saleCurrency;
    document.getElementById('exchange-rate').value = s.article.exchangeRate;

    document.getElementById('fob-unit-price').value = s.fob.unitPrice;
    document.getElementById('fob-quantity').value = s.fob.quantity;

    document.getElementById('pack-units').value = s.packaging.unitsPerBox;
    document.getElementById('pack-boxes').value = s.packaging.numberOfBoxes;
    document.getElementById('pack-length').value = s.packaging.length;
    document.getElementById('pack-width').value = s.packaging.width;
    document.getElementById('pack-height').value = s.packaging.height;

    state.container.type = s.container.type;
    const card = document.querySelector(`[data-value="${s.container.type}"]`);
    if (card) card.click();

    document.getElementById('freight-origin').value = s.freight.originPort || '';
    document.getElementById('freight-destination').value = s.freight.destinationPort || '';
    document.getElementById('freight-currency').value = s.freight.freightCurrency || 'USD';
    document.getElementById('freight-cost').value = s.freight.totalCost;

    const rRadio = document.querySelector(`input[name="freight-mode"][value="${s.freight.mode}"]`);
    if (rRadio) rRadio.checked = true;

    if (s.insurance.mode === 'percent') {
      tabPct.click();
      document.getElementById('ins-rate').value = s.insurance.rate;
    } else {
      tabFix.click();
      document.getElementById('ins-fixed').value = s.insurance.fixedAmount;
    }

    document.getElementById('tariff-hscode').value = s.tariff.hsCode || '';
    document.getElementById('tariff-rate').value = s.tariff.rate;

    document.getElementById('dest-forwarder').value = s.destination.forwarder;
    document.getElementById('dest-customs').value = s.destination.customs;
    document.getElementById('dest-transport').value = s.destination.transport;
    document.getElementById('dest-other').value = s.destination.other;

    document.getElementById('price-var').value = s.pricing.variableExpenses;
    document.getElementById('price-fix').value = s.pricing.fixedExpenses;
    document.getElementById('price-fin').value = s.pricing.financialExpenses;
    document.getElementById('price-profit').value = s.pricing.targetProfit;

    recalculate();
    state.meta.isDirty = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Modal de desglose técnico estructurado sin backend
  function viewHistoryModal(id) {
    const rec = state.history.find(r => r.id === id);
    if (!rec) return;
    const s = rec.snapshot;

    document.getElementById('modal-title').innerText = rec.articleName;
    document.getElementById('modal-subtitle').innerText = `ID Operación: ${rec.id} · Auditado el ${Utils.formatDateTime(rec.createdAt)}`;

    const body = document.getElementById('modal-body');
    body.innerHTML = `
            <div class="grid grid-cols-2 gap-x-6 gap-y-2 border-b border-slate-100 dark:border-slate-700 pb-3">
                <div><span class="text-xs text-slate-400 block">Proveedor</span><b>${rec.supplier}</b></div>
                <div><span class="text-xs text-slate-400 block">Origen Geográfico</span><b>${rec.country}</b></div>
                <div><span class="text-xs text-slate-400 block">Volumen Total del Lote</span><b class="font-mono">${s.packaging.totalCbm.toFixed(3)} m³</b></div>
                <div><span class="text-xs text-slate-400 block">Unidades Consolidadas</span><b class="font-mono">${rec.quantity.toLocaleString('es-ES')} uds</b></div>
            </div>
            <div>
                <h4 class="font-semibold text-xs text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2">Desglose Analítico de Costes de Adquisición (${s.article.saleCurrency})</h4>
                <div class="space-y-1 font-mono text-xs">
                    <div class="flex justify-between"><span>Base Adquisición FOB Total:</span><span>${Utils.formatCurrency(s.results1.fobTotalInSaleCurrency, s.article.saleCurrency)}</span></div>
                    <div class="flex justify-between"><span>Flete Marítimo Prorrateado:</span><span>${Utils.formatCurrency(s.results1.freightInSaleCurrency, s.article.saleCurrency)}</span></div>
                    <div class="flex justify-between"><span>Seguro de Cobertura de Lote:</span><span>${Utils.formatCurrency(s.results1.insuranceInSaleCurrency, s.article.saleCurrency)}</span></div>
                    <div class="flex justify-between"><span>Derechos de Arancel Aduana:</span><span>${Utils.formatCurrency(s.results1.tariffInSaleCurrency, s.article.saleCurrency)}</span></div>
                    <div class="flex justify-between"><span>Gastos de Logística Nacional:</span><span>${Utils.formatCurrency(s.results1.destinationTotal, s.article.saleCurrency)}</span></div>
                    <div class="flex justify-between border-t border-slate-100 dark:border-slate-700 pt-1 font-bold text-sm text-slate-900 dark:text-white"><span>COSTE INTEGRAL DE IMPORTACIÓN:</span><span>${Utils.formatCurrency(s.results1.totalImportCost, s.article.saleCurrency)}</span></div>
                    <div class="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold text-sm"><span>COSTE UNITARIO INDEXADO REAL:</span><span>${Utils.formatCurrency(s.results1.realUnitCost, s.article.saleCurrency)}/ud</span></div>
                </div>
            </div>
            <div class="pt-2">
                <h4 class="font-semibold text-xs text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-2">Modelo Comercial de Fijación de Precios (${s.article.saleCurrency})</h4>
                <div class="space-y-1 font-mono text-xs">
                    <div class="flex justify-between"><span>Precio de Venta Mínimo (Umbral):</span><span>${Utils.formatCurrency(s.results2.minimumPrice, s.article.saleCurrency)}</span></div>
                    <div class="flex justify-between font-bold text-blue-600 dark:text-blue-400 text-sm"><span>PRECIO RECOMENDADO ESTRATÉGICO (PVP):</span><span>${Utils.formatCurrency(s.results2.recommendedPrice, s.article.saleCurrency)}</span></div>
                    <div class="flex justify-between"><span>Margen Bruto sobre Ventas:</span><span>${s.results2.grossMarginPercent.toFixed(1)}%</span></div>
                    <div class="flex justify-between"><span>Margen Neto Unitario Real:</span><span>${Utils.formatCurrency(s.results2.profitPerUnit, s.article.saleCurrency)}</span></div>
                    <div class="flex justify-between border-t border-slate-100 dark:border-slate-700 pt-1 font-bold text-emerald-600 dark:text-emerald-400 text-sm"><span>RETORNO NETO DE LA OPERACIÓN:</span><span>${Utils.formatCurrency(s.results2.totalOperationProfit, s.article.saleCurrency)}</span></div>
                </div>
            </div>
        `;
    document.getElementById('modal-view').classList.remove('hidden');
    document.getElementById('modal-view').classList.add('flex');
  }

  const closeModal = () => {
    document.getElementById('modal-view').classList.add('hidden');
    document.getElementById('modal-view').classList.remove('flex');
  };
  document.getElementById('btn-close-modal').addEventListener('click', closeModal);
  document.getElementById('btn-close-modal-footer').addEventListener('click', closeModal);

  // Carga guiada de datos de onboarding ("Cargar Ejemplo")
  document.getElementById('btn-load-demo').addEventListener('click', () => {
    const EXAMPLE_DATA = {
      article: { name: 'Zapatilla deportiva casual', reference: 'ZAP-001', supplier: 'Guangzhou Footwear Co.', country: 'China', purchaseCurrency: 'USD', saleCurrency: 'EUR', exchangeRate: 0.92 },
      fob: { unitPrice: 8.50, quantity: 1000 },
      packaging: { unitsPerBox: 6, length: 40, width: 30, height: 25 },
      container: { type: '20ft' },
      freight: { originPort: 'Shanghai', destinationPort: 'Valencia', mode: 'FCL', totalCost: 1800, freightCurrency: 'USD' },
      insurance: { mode: 'percent', rate: 0.3 },
      tariff: { rate: 17, hsCode: '6403.91' },
      destination: { forwarder: 350, customs: 180, transport: 220, other: 0 },
      pricing: { variableExpenses: 15, fixedExpenses: 10, financialExpenses: 3, targetProfit: 20 }
    };

    document.getElementById('art-name').value = EXAMPLE_DATA.article.name;
    document.getElementById('art-ref').value = EXAMPLE_DATA.article.reference;
    document.getElementById('art-supplier').value = EXAMPLE_DATA.article.supplier;
    document.getElementById('art-country').value = EXAMPLE_DATA.article.country;
    document.getElementById('currency-purchase').value = EXAMPLE_DATA.article.purchaseCurrency;
    document.getElementById('currency-sale').value = EXAMPLE_DATA.article.saleCurrency;
    document.getElementById('exchange-rate').value = EXAMPLE_DATA.article.exchangeRate;
    document.getElementById('fob-unit-price').value = EXAMPLE_DATA.fob.unitPrice;
    document.getElementById('fob-quantity').value = EXAMPLE_DATA.fob.quantity;
    document.getElementById('pack-units').value = EXAMPLE_DATA.packaging.unitsPerBox;
    document.getElementById('pack-length').value = EXAMPLE_DATA.packaging.length;
    document.getElementById('pack-width').value = EXAMPLE_DATA.packaging.width;
    document.getElementById('pack-height').value = EXAMPLE_DATA.packaging.height;
    document.getElementById('freight-origin').value = EXAMPLE_DATA.freight.originPort;
    document.getElementById('freight-destination').value = EXAMPLE_DATA.freight.destinationPort;
    document.getElementById('freight-currency').value = EXAMPLE_DATA.freight.freightCurrency;
    document.getElementById('freight-cost').value = EXAMPLE_DATA.freight.totalCost;
    document.getElementById('ins-rate').value = EXAMPLE_DATA.insurance.rate;
    document.getElementById('tariff-hscode').value = EXAMPLE_DATA.tariff.hsCode;
    document.getElementById('tariff-rate').value = EXAMPLE_DATA.tariff.rate;
    document.getElementById('dest-forwarder').value = EXAMPLE_DATA.destination.forwarder;
    document.getElementById('dest-customs').value = EXAMPLE_DATA.destination.customs;
    document.getElementById('dest-transport').value = EXAMPLE_DATA.destination.transport;
    document.getElementById('dest-other').value = EXAMPLE_DATA.destination.other;
    document.getElementById('price-var').value = EXAMPLE_DATA.pricing.variableExpenses;
    document.getElementById('price-fix').value = EXAMPLE_DATA.pricing.fixedExpenses;
    document.getElementById('price-fin').value = EXAMPLE_DATA.pricing.financialExpenses;
    document.getElementById('price-profit').value = EXAMPLE_DATA.pricing.targetProfit;

    recalculate();
    document.getElementById('btn-load-demo').classList.add('hidden');
  });

  // Enlaces de bindings para botones de exportación ejecutiva
  document.getElementById('btn-export-excel').addEventListener('click', () => ExportController.excel(state));
  document.getElementById('btn-export-pdf').addEventListener('click', () => ExportController.pdf(state));

  // Monitoreo activo de scrolling (Sidebar Highlights vía IntersectionObserver)
  const sections = document.querySelectorAll('form section, #sec-historico');
  const navItems = document.querySelectorAll('.nav-item');

  const observerOptions = { root: null, rootMargin: '-20% 0px -60% 0px', threshold: 0 };
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navItems.forEach(item => {
          if (item.getAttribute('href') === `#${id}`) {
            item.classList.add('bg-slate-800', 'text-white', 'border-l-4', 'border-blue-500');
          } else {
            item.classList.remove('bg-slate-800', 'text-white', 'border-l-4', 'border-blue-500');
          }
        });
      }
    });
  }, observerOptions);

  sections.forEach(sec => observer.observe(sec));

  // Inicialización del entorno
  recalculate();
  state.meta.isDirty = false;
  refreshHistory();
});