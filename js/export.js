/**
 * Motores de exportación avanzada corporativa (Excel y PDF ejecutivos).
 */
const ExportController = {

  excel: (state) => {
    const wb = XLSX.utils.book_new();
    const sCurr = state.article.saleCurrency;
    const pCurr = state.article.purchaseCurrency;

    // Hoja 1: Estructura Analítica de la Importación
    const dataMod1 = [
      ['Dimensionamiento Estructural', 'Métrica Introducida / Calculada', 'Magnitud'],
      ['Artículo', state.article.name, 'Texto'],
      ['Código SKU / Referencia', state.article.reference || 'N/A', 'Texto'],
      ['Proveedor Comercial', state.article.supplier, 'Texto'],
      ['Origen Geográfico', state.article.country, 'Texto'],
      ['Volumen total de lote', state.packaging.totalCbm.toFixed(3), 'CBM (m³)'],
      ['Ocupación de Contenedor', state.container.occupancyPercent.toFixed(1), '%'],
      [],
      ['Desglose de Costes Consolidados', 'Valor de Adquisición', 'Valor Equivalente Real (' + sCurr + ')'],
      ['Coste de Fábrica FOB Total', state.fob.total.toFixed(2) + ' ' + pCurr, state.results1.fobTotalInSaleCurrency.toFixed(2)],
      ['Logística Marítima (Flete Prorrateado)', state.freight.allocatedCost.toFixed(2) + ' ' + pCurr, state.results1.freightInSaleCurrency.toFixed(2)],
      ['Seguro de Carga en Tránsito', state.insurance.amount.toFixed(2) + ' ' + pCurr, state.results1.insuranceInSaleCurrency.toFixed(2)],
      ['Derechos de Arancel e Impuestos Aduana', state.tariff.amount.toFixed(2) + ' ' + pCurr, state.results1.tariffInSaleCurrency.toFixed(2)],
      ['Gastos de Operación en Destino', state.destination.total.toFixed(2) + ' ' + sCurr, state.results1.destinationTotal.toFixed(2)],
      ['COSTE DE IMPORTACIÓN CONSOLIDADO', '', state.results1.totalImportCost.toFixed(2)],
      ['COSTE UNITARIO INDEXADO REAL', '', state.results1.realUnitCost.toFixed(4)]
    ];

    const ws1 = XLSX.utils.aoa_to_sheet(dataMod1);
    XLSX.utils.book_append_sheet(wb, ws1, "Estructura Importación");

    // Hoja 2: Modelo Comercial de Precios y Rentabilidad
    const dataMod2 = [
      ['Modelo de Precios Comercial y Retornos', 'Ratio / Porcentaje', 'Importe Neto (' + sCurr + ')'],
      ['Coste Unitario de Adquisición Indexado', '', state.results1.realUnitCost.toFixed(4)],
      ['Gastos Variables de Comercialización', state.pricing.variableExpenses.toFixed(1) + '%', (state.results2.recommendedPrice * state.pricing.variableExpenses / 100).toFixed(2)],
      ['Asignación de Estructura Fija', state.pricing.fixedExpenses.toFixed(1) + '%', (state.results2.recommendedPrice * state.pricing.fixedExpenses / 100).toFixed(2)],
      ['Costes de Cobertura Financiera', state.pricing.financialExpenses.toFixed(1) + '%', (state.results2.recommendedPrice * state.pricing.financialExpenses / 100).toFixed(2)],
      ['Margen Neto Comercial Objetivo', state.pricing.targetProfit.toFixed(1) + '%', state.results2.profitPerUnit.toFixed(2)],
      [],
      ['PRECIO DE VENTA MÍNIMO (Umbral de Equilibrio)', '', state.results2.minimumPrice.toFixed(2)],
      ['PRECIO DE VENTA RECOMENDADO ESTRATÉGICO', '', state.results2.recommendedPrice.toFixed(2)],
      ['Margen Bruto sobre Facturación', state.results2.grossMarginPercent.toFixed(1) + '%', ''],
      ['RETORNO LIQUIDO NETO TOTAL DE LA OPERACIÓN', '', state.results2.totalOperationProfit.toFixed(2)]
    ];

    const ws2 = XLSX.utils.aoa_to_sheet(dataMod2);
    XLSX.utils.book_append_sheet(wb, ws2, "Estructura Comercial PVP");

    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const filename = `Informe_Financiero_${(state.article.name || 'Import').replace(/\s+/g, '_')}_${timestamp}.xlsx`;
    XLSX.writeFile(wb, filename);
  },

  pdf: (state) => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    const sCurr = state.article.saleCurrency;

    // Cabecera Corporativa de Control Financiero
    doc.setFillColor(30, 58, 95); // #1E3A5F
    doc.rect(0, 0, 210, 38, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(20);
    doc.text("INFORME EJECUTIVO DE IMPORTACIÓN", 14, 16);
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(203, 213, 225);
    doc.text(`Calculadora Analítica - Auditoría de Márgenes y Viabilidad Económica`, 14, 23);
    doc.text(`Fecha de emisión: ${Utils.formatDateTime(new Date().toISOString())}`, 14, 28);

    // Bloque de metadatos del artículo
    doc.setTextColor(15, 23, 42);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(12);
    doc.text("1. Especificaciones de la Operación", 14, 48);

    const metadata = [
      ['Descriptor de Producto', state.article.name || 'N/A', 'Proveedor Autorizado', state.article.supplier || 'N/A'],
      ['Código Interno / SKU', state.article.reference || 'N/A', 'Origen Comercial', state.article.country || 'N/A'],
      ['Volumen Lote Consolidado', `${state.packaging.totalCbm.toFixed(3)} CBM`, 'Unidades Totales', `${state.fob.quantity.toLocaleString('es-ES')} uds`]
    ];

    doc.autoTable({
      startY: 52,
      body: metadata,
      theme: 'plain',
      styles: { fontSize: 9, cellPadding: 1.5 },
      columnStyles: { 0: { fontStyle: 'bold', width: 40 }, 2: { fontStyle: 'bold', width: 40 } }
    });

    // Bloque de Costes de Importación
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(12);
    doc.text("2. Consolidado de Costes Logísticos de Adquisición", 14, doc.lastAutoTable.finalY + 8);

    const tableImportCosts = [
      ['Métrica de Coste', 'Importe Consolidado en Divisa de Venta (' + sCurr + ')'],
      ['Coste de Adquisición en Fábrica FOB Total', Utils.formatCurrency(state.results1.fobTotalInSaleCurrency, sCurr)],
      ['Asignación de Flete Marítimo Internacional', Utils.formatCurrency(state.results1.freightInSaleCurrency, sCurr)],
      ['Seguro de Tránsito Comercial de Carga', Utils.formatCurrency(state.results1.insuranceInSaleCurrency, sCurr)],
      ['Derechos de Aranceles Liquidados en Aduana', Utils.formatCurrency(state.results1.tariffInSaleCurrency, sCurr)],
      ['Estructura de Gastos Locales en Destino', Utils.formatCurrency(state.results1.destinationTotal, sCurr)],
      ['COSTE DE IMPORTACIÓN INTEGRAL TOTAL', Utils.formatCurrency(state.results1.totalImportCost, sCurr)],
      ['COSTE UNITARIO LOGÍSTICO INDEXADO REAL', `${Utils.formatCurrency(state.results1.realUnitCost, sCurr)} por unidad`]
    ];

    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 12,
      head: [tableImportCosts[0]],
      body: tableImportCosts.slice(1),
      theme: 'striped',
      headStyles: { fillColor: [30, 58, 95] },
      styles: { fontSize: 9, cellPadding: 2.5 },
      didParseCell: function (data) {
        if (data.row.index === 5 || data.row.index === 6) {
          data.cell.styles.fontStyle = 'bold';
          if (data.row.index === 6) data.cell.styles.textColor = [5, 150, 105];
        }
      }
    });

    // Estructura de Precios Comercial
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(12);
    doc.text("3. Proyección Comercial de Márgenes y PVP", 14, doc.lastAutoTable.finalY + 8);

    const tablePricing = [
      ['Concepto Comercial', 'Métrica de Control', 'Valor / Equivalencia Financiera'],
      ['Coste Unitario de Referencia', 'Base Indexada', Utils.formatCurrency(state.results1.realUnitCost, sCurr)],
      ['Gastos Variables de Venta', `${state.pricing.variableExpenses.toFixed(1)}% sobre PVP`, Utils.formatCurrency(state.results2.recommendedPrice * state.pricing.variableExpenses / 100, sCurr)],
      ['Gastos Fijos Estructurales', `${state.pricing.fixedExpenses.toFixed(1)}% sobre PVP`, Utils.formatCurrency(state.results2.recommendedPrice * state.pricing.fixedExpenses / 100, sCurr)],
      ['Costes Financieros y de Cobro', `${state.pricing.financialExpenses.toFixed(1)}% sobre PVP`, Utils.formatCurrency(state.results2.recommendedPrice * state.pricing.financialExpenses / 100, sCurr)],
      ['PRECIO DE VENTA MÍNIMO REQUERIDO', 'Umbral de Equilibrio', Utils.formatCurrency(state.results2.minimumPrice, sCurr)],
      ['PRECIO DE VENTA RECOMENDADO (PVP)', 'Estrategia Comercial', Utils.formatCurrency(state.results2.recommendedPrice, sCurr)],
      ['Margen de Retorno Neto Operacional', `${state.results2.netMarginPercent.toFixed(1)}% Neto`, Utils.formatCurrency(state.results2.profitPerUnit, sCurr)],
      ['BENEFICIO NETO TOTAL ESTIMADO', 'Lote Completo', Utils.formatCurrency(state.results2.totalOperationProfit, sCurr)]
    ];

    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 12,
      head: [tablePricing[0]],
      body: tablePricing.slice(1),
      theme: 'grid',
      headStyles: { fillColor: [71, 85, 105] },
      styles: { fontSize: 9, cellPadding: 2.5 },
      didParseCell: function (data) {
        if (data.row.index === 4 || data.row.index === 5 || data.row.index === 7) {
          data.cell.styles.fontStyle = 'bold';
        }
        if (data.row.index === 5) data.cell.styles.textColor = [37, 99, 235];
        if (data.row.index === 7) data.cell.styles.textColor = [5, 150, 105];
      }
    });

    // Inserción de Gráfico como Evidencia Visual
    const chartCanvas = document.getElementById('chart-costs');
    if (chartCanvas) {
      try {
        const imgData = chartCanvas.toDataURL('image/png');
        if (doc.lastAutoTable.finalY + 50 > 280) doc.addPage();
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(11);
        doc.text("4. Distribución Porcentual del Coste de Adquisición", 14, doc.lastAutoTable.finalY + 10);
        doc.addImage(imgData, 'PNG', 14, doc.lastAutoTable.finalY + 14, 55, 55);
      } catch (e) {
        console.warn('No se pudo consolidar la imagen del gráfico en el PDF', e);
      }
    }

    // Pie de Página Estándar
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(`Documento emitido por el Núcleo Financiero IMPORTCALC. Persistencia de auditoría local. Página ${i} de ${pageCount}.`, 14, 290);
    }

    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    doc.save(`Informe_Ejecutivo_${(state.article.name || 'Import').replace(/\s+/g, '_')}_${timestamp}.pdf`);
  }
};