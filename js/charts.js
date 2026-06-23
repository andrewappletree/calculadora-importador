/**
 * Controlador de renderizado analítico vía Chart.js.
 */
const ChartsController = {
  instances: {},

  renderDonut: (state) => {
    const ctx = document.getElementById('chart-costs');
    if (!ctx) return;

    const dataValues = [
      state.results1.fobTotalInSaleCurrency,
      state.results1.freightInSaleCurrency,
      state.results1.insuranceInSaleCurrency,
      state.results1.tariffInSaleCurrency,
      state.results1.destinationTotal
    ];

    const total = dataValues.reduce((a, b) => a + b, 0);

    if (ChartsController.instances['costs']) {
      ChartsController.instances['costs'].data.datasets[0].data = dataValues;
      ChartsController.instances['costs'].options.plugins.title.text = `Total: ${Utils.formatCurrency(total, state.article.saleCurrency)}`;
      ChartsController.instances['costs'].update();
      return;
    }

    // Configuración nativa del gráfico Donut
    ChartsController.instances['costs'] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['FOB Total', 'Flete Asignado', 'Seguro', 'Arancel', 'Gastos Destino'],
        datasets: [{
          data: dataValues,
          backgroundColor: ['#1E3A5F', '#2563EB', '#7C3AED', '#DB2777', '#EA580C'],
          borderWidth: 1,
          borderColor: 'transparent'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 10 }, color: '#64748B' } },
          title: { display: true, text: `Total: ${Utils.formatCurrency(total, state.article.saleCurrency)}`, color: '#1E3A5F', font: { size: 13, weight: 'bold' }, padding: { bottom: 5 } },
          tooltip: {
            callbacks: {
              label: function (context) {
                const val = context.raw || 0;
                const pct = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
                return `${context.label}: ${Utils.formatCurrency(val, state.article.saleCurrency)} (${pct}%)`;
              }
            }
          }
        }
      }
    });
  },

  renderBarStacked: (state) => {
    const ctx = document.getElementById('chart-pricing');
    if (!ctx) return;

    const pRec = state.results2.recommendedPrice;
    const baseCost = state.results1.realUnitCost;

    const datasetData = [
      [baseCost],
      [pRec * (state.pricing.variableExpenses / 100)],
      [pRec * (state.pricing.fixedExpenses / 100)],
      [pRec * (state.pricing.financialExpenses / 100)],
      [state.results2.profitPerUnit]
    ];

    if (ChartsController.instances['pricing']) {
      ChartsController.instances['pricing'].data.datasets.forEach((ds, idx) => {
        ds.data = datasetData[idx];
      });
      ChartsController.instances['pricing'].update();
      return;
    }

    ChartsController.instances['pricing'] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['PVP Recomendado'],
        datasets: [
          { label: 'Coste Base', data: datasetData[0], backgroundColor: '#1E3A5F' },
          { label: 'G. Variables', data: datasetData[1], backgroundColor: '#2563EB' },
          { label: 'G. Fijos', data: datasetData[2], backgroundColor: '#7C3AED' },
          { label: 'G. Financieros', data: datasetData[3], backgroundColor: '#DB2777' },
          { label: 'Retorno Neto', data: datasetData[4], backgroundColor: '#059669' }
        ]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { stacked: true, grid: { display: false }, ticks: { font: { size: 9 }, color: '#64748B' } },
          y: { stacked: true, grid: { display: false }, ticks: { font: { size: 9 }, color: '#64748B' } }
        },
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 9 }, color: '#64748B' } }
        }
      }
    });
  },

  renderHistoryLine: (historyArray) => {
    const container = document.getElementById('chart-history-container');
    const ctx = document.getElementById('chart-history');
    if (!ctx || !container) return;

    if (historyArray.length < 2) {
      container.classList.add('hidden');
      return;
    }
    container.classList.remove('hidden');

    // Mapeo cronológico inverso para visualización natural de izquierda a derecha
    const localHistory = [...historyArray].reverse();
    const labels = localHistory.map(r => Utils.formatDateTime(r.createdAt).split(' ')[0]);
    const dataValues = localHistory.map(r => r.netMarginPercent);

    if (ChartsController.instances['history']) {
      ChartsController.instances['history'].data.labels = labels;
      ChartsController.instances['history'].data.datasets[0].data = dataValues;
      ChartsController.instances['history'].update();
      return;
    }

    ChartsController.instances['history'] = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Evolución Margen Neto (%)',
          data: dataValues,
          borderColor: '#2563EB',
          backgroundColor: 'rgba(37,99,235,0.06)',
          tension: 0.25,
          fill: true,
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { grid: { color: 'rgba(0,0,0,0.03)' }, ticks: { font: { size: 9 } } },
          y: { min: 0, max: 100, grid: { color: 'rgba(0,0,0,0.03)' }, ticks: { font: { size: 9 } } }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });
  }
};