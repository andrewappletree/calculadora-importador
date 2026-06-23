/**
 * Motor CRUD y persistencia indexada en localStorage.
 */
const HistoryManager = {
  KEY: 'importCalc_history',

  load: () => {
    try {
      const raw = localStorage.getItem(HistoryManager.KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('Error al parsear el histórico de LocalStorage', e);
      return [];
    }
  },

  saveRecord: (state) => {
    if (!state.article.name || !state.article.supplier) {
      alert('Error: Debe completar al menos los campos requeridos marcados con (*) para registrar la operación.');
      return false;
    }

    const records = HistoryManager.load();

    const newRecord = {
      id: Utils.generateUUID(),
      createdAt: new Date().toISOString(),
      articleName: state.article.name,
      reference: state.article.reference || 'N/A',
      supplier: state.article.supplier,
      country: state.article.country,
      quantity: state.fob.quantity,
      saleCurrency: state.article.saleCurrency,
      realUnitCost: state.results1.realUnitCost,
      recommendedPrice: state.results2.recommendedPrice,
      netMarginPercent: state.results2.netMarginPercent,
      totalProfit: state.results2.totalOperationProfit,
      snapshot: JSON.parse(JSON.stringify(state))
    };

    records.unshift(newRecord); // Ordenación cronológica inversa natural

    try {
      localStorage.setItem(HistoryManager.KEY, JSON.stringify(records));
      state.meta.isDirty = false;
      return true;
    } catch (e) {
      alert('Error de cuota crítica: No se ha podido consolidar en el almacenamiento local. Libere espacio en el navegador.');
      console.error(e);
      return false;
    }
  },

  deleteRecord: (id) => {
    let records = HistoryManager.load();
    records = records.filter(r => r.id !== id);
    localStorage.setItem(HistoryManager.KEY, JSON.stringify(records));
  },

  renderTable: (historyArray, onRestore, onDelete, onView) => {
    const tbody = document.getElementById('hist-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (historyArray.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" class="p-8 text-center text-slate-400 italic">No existen registros financieros consolidados en el histórico local.</td></tr>`;
      return;
    }

    historyArray.forEach(rec => {
      const tr = document.createElement('tr');
      tr.className = "hover:bg-slate-50 dark:hover:bg-slate-900/40 transition border-b border-slate-100 dark:border-slate-700/50 text-slate-700 dark:text-slate-300";

      // Lógica de color según rentabilidad del margen neto
      let marginClass = "text-emerald-600 dark:text-emerald-400 font-semibold";
      if (rec.netMarginPercent < 10) marginClass = "text-red-600 dark:text-red-400 font-semibold";
      else if (rec.netMarginPercent <= 20) marginClass = "text-amber-600 dark:text-amber-400 font-semibold";

      tr.innerHTML = `
                <td class="p-3 font-mono">${Utils.formatDateTime(rec.createdAt)}</td>
                <td class="p-3 font-medium text-slate-900 dark:text-white">${rec.articleName} <span class="text-slate-400 text-[10px] block font-mono">${rec.reference}</span></td>
                <td class="p-3">${rec.supplier} <span class="text-slate-400 text-[10px] block">${rec.country}</span></td>
                <td class="p-3 text-right font-mono">${rec.quantity.toLocaleString('es-ES')}</td>
                <td class="p-3 text-right font-mono">${Utils.formatCurrency(rec.realUnitCost, rec.saleCurrency)}</td>
                <td class="p-3 text-right font-mono">${Utils.formatCurrency(rec.recommendedPrice, rec.saleCurrency)}</td>
                <td class="p-3 text-center font-mono ${marginClass}">${rec.netMarginPercent.toFixed(1)}%</td>
                <td class="p-3 text-right font-mono font-medium text-emerald-600 dark:text-emerald-400">${Utils.formatCurrency(rec.totalProfit, rec.saleCurrency)}</td>
                <td class="p-3 text-center space-x-1 whitespace-nowrap">
                    <button type="button" class="btn-view-rec bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white px-2 py-1 rounded text-[11px] font-medium transition" data-id="${rec.id}">👁 Ver</button>
                    <button type="button" class="btn-dup-rec bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 px-2 py-1 rounded text-[11px] font-medium transition" data-id="${rec.id}">📋 Duplicar</button>
                    <button type="button" class="btn-del-rec bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-400 px-2 py-1 rounded text-[11px] font-medium transition" data-id="${rec.id}">🗑 Borrar</button>
                </td>
            `;
      tbody.appendChild(tr);
    });

    // Vinculación delegada de listeners de acciones operativas
    tbody.querySelectorAll('.btn-view-rec').forEach(b => b.addEventListener('click', (e) => onView(e.target.dataset.id)));
    tbody.querySelectorAll('.btn-dup-rec').forEach(b => b.addEventListener('click', (e) => onRestore(e.target.dataset.id)));
    tbody.querySelectorAll('.btn-del-rec').forEach(b => b.addEventListener('click', (e) => {
      if (confirm('¿Está completamente seguro de eliminar este registro histórico de forma irreversible?')) {
        onDelete(e.target.dataset.id);
      }
    }));
  }
};