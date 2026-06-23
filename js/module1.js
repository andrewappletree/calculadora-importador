/**
 * Módulo lógico de cálculo: Costes de Importación.
 */
const Module1 = {
  calculate: (state) => {
    // Asignación estructurada desde inputs DOM al objeto State global
    state.article.name = document.getElementById('art-name').value;
    state.article.reference = document.getElementById('art-ref').value;
    state.article.supplier = document.getElementById('art-supplier').value;
    state.article.country = document.getElementById('art-country').value;
    if (state.article.country === 'Otro') {
      state.article.country = document.getElementById('art-country-other').value || 'Otro';
    }

    state.article.purchaseCurrency = document.getElementById('currency-purchase').value;
    state.article.saleCurrency = document.getElementById('currency-sale').value;

    // Gestión de divisas simétricas
    if (state.article.purchaseCurrency === state.article.saleCurrency) {
      state.article.exchangeRate = 1;
      document.getElementById('exchange-rate-container').classList.add('hidden');
    } else {
      state.article.exchangeRate = parseFloat(document.getElementById('exchange-rate').value) || 1;
      document.getElementById('exchange-rate-container').classList.remove('hidden');
      document.getElementById('lbl-exchange-rate').innerText = `Tipo de cambio (1 ${state.article.purchaseCurrency} = X ${state.article.saleCurrency}) *`;
    }

    // 1.2 FOB Cálculos
    state.fob.unitPrice = Utils.safeNum('fob-unit-price');
    state.fob.quantity = parseInt(document.getElementById('fob-quantity').value) || 0;
    state.fob.total = state.fob.unitPrice * state.fob.quantity;

    // Renderizado inline inmediato del coste FOB
    document.getElementById('out-fob-total').innerText =
      `${Utils.formatCurrency(state.fob.total, state.article.purchaseCurrency)}` +
      (state.article.purchaseCurrency !== state.article.saleCurrency ? ` → ${Utils.formatCurrency(state.fob.total * state.article.exchangeRate, state.article.saleCurrency)}` : '');

    // 1.3 Embalaje y cubicaje
    state.packaging.unitsPerBox = parseInt(document.getElementById('pack-units').value) || 1;
    if (state.packaging.unitsPerBox < 1) state.packaging.unitsPerBox = 1;

    // Auto-cálculo inteligente de cajas con detector de override manual
    const computedBoxes = state.fob.quantity > 0 ? Math.ceil(state.fob.quantity / state.packaging.unitsPerBox) : 0;
    const currentBoxesInput = parseInt(document.getElementById('pack-boxes').value);

    if (document.activeElement && document.activeElement.id === 'pack-boxes') {
      state.packaging.numberOfBoxes = isNaN(currentBoxesInput) ? computedBoxes : currentBoxesInput;
      if (state.packaging.numberOfBoxes !== computedBoxes) {
        document.getElementById('warn-boxes').classList.remove('hidden');
      } else {
        document.getElementById('warn-boxes').classList.add('hidden');
      }
    } else {
      state.packaging.numberOfBoxes = computedBoxes;
      document.getElementById('pack-boxes').value = computedBoxes;
      document.getElementById('warn-boxes').classList.add('hidden');
    }

    state.packaging.length = Utils.safeNum('pack-length');
    state.packaging.width = Utils.safeNum('pack-width');
    state.packaging.height = Utils.safeNum('pack-height');

    state.packaging.cbmPerBox = (state.packaging.length * state.packaging.width * state.packaging.height) / 1000000;
    state.packaging.totalCbm = state.packaging.cbmPerBox * state.packaging.numberOfBoxes;

    document.getElementById('out-cbm-box').innerText = `${state.packaging.cbmPerBox.toFixed(4)} m³`;
    document.getElementById('out-cbm-total').innerText = `${state.packaging.totalCbm.toFixed(3)} m³`;

    // 1.4 Contenedor - Captura activa de card
    const CONTAINER_CAPACITY = { '20ft': 33, '40ft': 67, '40hc': 76 };
    state.container.capacity = CONTAINER_CAPACITY[state.container.type] || 33;

    if (state.container.capacity > 0) {
      state.container.occupancyPercent = (state.packaging.totalCbm / state.container.capacity) * 100;
    } else {
      state.container.occupancyPercent = 0;
    }

    // Renderizado de progreso y alertas estéticas
    const progressPercent = Math.min(state.container.occupancyPercent, 100);
    const bar = document.getElementById('bar-occupancy');
    document.getElementById('txt-occupancy').innerText = `${state.container.occupancyPercent.toFixed(1)}%`;
    bar.style.width = `${progressPercent}%`;

    // Reset de clases cromáticas
    bar.className = "h-full transition-all duration-300 ";
    if (state.container.occupancyPercent > 95) {
      bar.classList.add('bg-red-600');
      state.container.overCapacity = true;
    } else if (state.container.occupancyPercent >= 75) {
      bar.classList.add('bg-amber-500');
      state.container.overCapacity = false;
    } else {
      bar.classList.add('bg-emerald-500');
      state.container.overCapacity = false;
    }

    // Visibilidad de banners informativos condicionales
    document.getElementById('banner-overcapacity').classList.toggle('hidden', state.container.occupancyPercent <= 100);
    document.getElementById('banner-undercapacity').classList.toggle('hidden', !(state.container.occupancyPercent < 50 && state.fob.quantity > 0));

    // 1.5 Flete Marítimo
    state.freight.originPort = document.getElementById('freight-origin').value;
    state.freight.destinationPort = document.getElementById('freight-destination').value;
    state.freight.freightCurrency = document.getElementById('freight-currency').value;
    state.freight.totalCost = Utils.safeNum('freight-cost');
    state.freight.mode = document.querySelector('input[name="freight-mode"]:checked').value;

    // Ratio de conversión específico para el flete internacional (suele facturarse en USD)
    let freightToPurchaseRate = 1;
    if (state.freight.freightCurrency !== state.article.purchaseCurrency) {
      // Si el flete está en EUR y compra en USD o viceversa, pivotamos matemáticamente con el exchangeRate general de la operación
      freightToPurchaseRate = 1 / state.article.exchangeRate;
    }

    if (state.freight.mode === 'FCL') {
      // Factor de distribución volumétrica prorrateado
      let factor = state.container.occupancyPercent / 100;
      if (state.container.occupancyPercent > 100) factor = 1.0; // Paga contenedor entero desbordado
      state.freight.allocatedCost = state.freight.totalCost * factor * freightToPurchaseRate;
    } else {
      // Modalidad consolidada LCL
      state.freight.allocatedCost = state.freight.totalCost * freightToPurchaseRate;
    }

    // Tasa de conversión del flete a moneda venta para renderizado inline
    let freightToSaleRate = state.freight.freightCurrency === state.article.saleCurrency ? 1 : state.article.exchangeRate;
    if (state.freight.freightCurrency !== state.article.purchaseCurrency && state.freight.freightCurrency === 'USD' && state.article.saleCurrency === 'EUR') {
      freightToSaleRate = state.article.exchangeRate;
    }

    document.getElementById('out-freight-allocated').innerText =
      `${Utils.formatCurrency(state.freight.allocatedCost, state.article.purchaseCurrency)}` +
      ` → ${Utils.formatCurrency(state.freight.totalCost * (state.freight.mode === 'FCL' ? Math.min(state.container.occupancyPercent / 100, 1) : 1) * freightToSaleRate, state.article.saleCurrency)}`;

    // 1.6 Seguro
    const isPercentMode = document.getElementById('tab-ins-percent').classList.contains('text-blue-600');
    if (isPercentMode) {
      state.insurance.mode = 'percent';
      state.insurance.rate = Utils.safeNum('ins-rate');
      state.insurance.amount = state.fob.total * (state.insurance.rate / 100);
    } else {
      state.insurance.mode = 'fixed';
      state.insurance.fixedAmount = Utils.safeNum('ins-fixed');
      state.insurance.amount = state.insurance.fixedAmount;
    }

    document.getElementById('out-insurance-cost').innerText =
      `${Utils.formatCurrency(state.insurance.amount, state.article.purchaseCurrency)}` +
      (state.article.purchaseCurrency !== state.article.saleCurrency ? ` → ${Utils.formatCurrency(state.insurance.amount * state.article.exchangeRate, state.article.saleCurrency)}` : '');

    // 1.7 Aranceles Aduaneros (Cálculo estricto sobre Base CIF de la UE)
    state.tariff.hsCode = document.getElementById('tariff-hscode').value;
    state.tariff.rate = Utils.safeNum('tariff-rate');

    // Base CIF consolidada en moneda de compra antes de aranceles
    state.tariff.cifBase = state.fob.total + state.freight.allocatedCost + state.insurance.amount;
    state.tariff.amount = state.tariff.cifBase * (state.tariff.rate / 100);

    document.getElementById('out-cif-base').innerText = Utils.formatCurrency(state.tariff.cifBase, state.article.purchaseCurrency);
    document.getElementById('out-tariff-amount').innerText =
      `${Utils.formatCurrency(state.tariff.amount, state.article.purchaseCurrency)}` +
      (state.article.purchaseCurrency !== state.article.saleCurrency ? ` → ${Utils.formatCurrency(state.tariff.amount * state.article.exchangeRate, state.article.saleCurrency)}` : '');

    // 1.8 Gastos Operacionales en Destino (Garantizados nativamente en moneda de venta)
    state.destination.forwarder = Utils.safeNum('dest-forwarder');
    state.destination.customs = Utils.safeNum('dest-customs');
    state.destination.transport = Utils.safeNum('dest-transport');
    state.destination.other = Utils.safeNum('dest-other');
    state.destination.total = state.destination.forwarder + state.destination.customs + state.destination.transport + state.destination.other;

    // CONSOLIDACIÓN MACRO MÓDULO 1 (Normalización absoluta a moneda de venta)
    state.results1.fobTotalInSaleCurrency = state.fob.total * state.article.exchangeRate;

    // El flete imputado se pasa a moneda de venta
    let freightSaleFactor = state.freight.freightCurrency === state.article.saleCurrency ? 1 : state.article.exchangeRate;
    if (state.freight.freightCurrency === state.article.purchaseCurrency) {
      state.results1.freightInSaleCurrency = state.freight.allocatedCost * state.article.exchangeRate;
    } else {
      // Si el flete tiene moneda propia mapeamos su asignación directa
      state.results1.freightInSaleCurrency = state.freight.totalCost * (state.freight.mode === 'FCL' ? Math.min(state.container.occupancyPercent / 100, 1) : 1) * freightSaleFactor;
    }

    state.results1.insuranceInSaleCurrency = state.insurance.amount * state.article.exchangeRate;
    state.results1.tariffInSaleCurrency = state.tariff.amount * state.article.exchangeRate;
    state.results1.destinationTotal = state.destination.total;

    state.results1.totalImportCost =
      state.results1.fobTotalInSaleCurrency +
      state.results1.freightInSaleCurrency +
      state.results1.insuranceInSaleCurrency +
      state.results1.tariffInSaleCurrency +
      state.results1.destinationTotal;

    if (state.fob.quantity > 0) {
      state.results1.realUnitCost = state.results1.totalImportCost / state.fob.quantity;
    } else {
      state.results1.realUnitCost = 0;
    }

    // Renderizado del bloque maestro de resultados del Módulo 1
    document.getElementById('res1-fob').innerText = Utils.formatCurrency(state.results1.fobTotalInSaleCurrency, state.article.saleCurrency);
    document.getElementById('res1-freight').innerText = Utils.formatCurrency(state.results1.freightInSaleCurrency, state.article.saleCurrency);
    document.getElementById('res1-insurance').innerText = Utils.formatCurrency(state.results1.insuranceInSaleCurrency, state.article.saleCurrency);
    document.getElementById('res1-tariff').innerText = Utils.formatCurrency(state.results1.tariffInSaleCurrency, state.article.saleCurrency);
    document.getElementById('res1-dest').innerText = Utils.formatCurrency(state.results1.destinationTotal, state.article.saleCurrency);
    document.getElementById('res1-total').innerText = Utils.formatCurrency(state.results1.totalImportCost, state.article.saleCurrency);

    document.getElementById('res1-unit').innerText = `${Utils.formatCurrency(state.results1.realUnitCost, state.article.saleCurrency)}/ud`;
    document.getElementById('res1-quantity-lbl').innerText = `(Calculado rigurosamente sobre ${state.fob.quantity.toLocaleString('es-ES')} unidades)`;

    // Inyección automática al Módulo 2 si no se activa el override manual
    const overrideBtn = document.getElementById('btn-override');
    if (!overrideBtn.classList.contains('bg-amber-500')) {
      document.getElementById('pricing-cost-override').value = state.results1.realUnitCost.toFixed(4);
    }
  }
};