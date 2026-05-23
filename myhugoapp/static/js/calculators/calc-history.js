// ===== HISTORY MANAGEMENT =====

function saveToHistory(type, data) {
  try {
    const history = JSON.parse(localStorage.getItem('stoichHistory') || '[]');

    const entry = {
      id: Date.now(),
      timestamp: new Date().toLocaleString('de-DE'),
      type: type,
      data: data
    };

    history.unshift(entry);

    if (history.length > 20) {
      history.splice(20);
    }

    localStorage.setItem('stoichHistory', JSON.stringify(history));
    updateHistoryCount();
    displayHistory();
  } catch (e) {
    console.error('Error saving to history:', e);
  }
}

function loadHistory() {
  displayHistory();
  updateHistoryCount();
}

function displayHistory() {
  try {
    const history = JSON.parse(localStorage.getItem('stoichHistory') || '[]');
    const historyList = document.getElementById('history-list');

    if (history.length === 0) {
      historyList.innerHTML = '<p class="text-muted"><small>Noch keine Berechnungen durchgeführt.</small></p>';
      return;
    }

    let html = '<div class="history-items">';
    history.forEach((entry) => {
      html +=
        '<div class="history-item" style="padding: 10px; margin-bottom: 8px; background: #f5f5f5; border-radius: 4px; border-left: 3px solid #007bff;">' +
          '<div style="display: flex; justify-content: space-between; align-items: start;">' +
            '<div style="flex: 1;">' +
              '<strong>' + entry.type + '</strong>' +
              '<span class="text-muted" style="font-size: 0.85em; margin-left: 10px;">' + entry.timestamp + '</span>' +
              '<div style="margin-top: 5px; font-size: 0.9em;">' + entry.data + '</div>' +
            '</div>' +
          '</div>' +
        '</div>';
    });
    html += '</div>';

    historyList.innerHTML = html;
  } catch (e) {
    console.error('Error displaying history:', e);
  }
}


function toggleHistory() {
  const panel = document.getElementById('history-panel');
  if (panel.style.display === 'none') {
    panel.style.display = 'block';
    displayHistory();
  } else {
    panel.style.display = 'none';
  }
}

function updateHistoryCount() {
  try {
    const history = JSON.parse(localStorage.getItem('stoichHistory') || '[]');
    const countBadge = document.getElementById('history-count');
    countBadge.textContent = '(' + history.length + ')';
  } catch (e) {
    console.error('Error updating history count:', e);
  }
}


function clearHistory() {
  if (confirm('Möchten Sie wirklich den gesamten Berechnungsverlauf löschen?')) {
    localStorage.removeItem('stoichHistory');
    displayHistory();
    updateHistoryCount();
  }
}

// ===== INTEGRATION WITH EQUATION BALANCER =====

function checkForBalancedEquation() {
  try {
    const balancedData = sessionStorage.getItem('balancedEquation');

    if (!balancedData) {
      return;
    }

    const data = JSON.parse(balancedData);

    if (!data.reactants || !data.products || data.reactants.length === 0 || data.products.length === 0) {
      console.warn('Invalid balanced equation data structure');
      return;
    }

    showImportNotification(data);

    const firstReactant = data.reactants[0];
    const firstProduct = data.products[0];

    const molCoeffR = document.getElementById('mol-coeff-r');
    const molCoeffP = document.getElementById('mol-coeff-p');

    if (molCoeffR && molCoeffP) {
      molCoeffR.value = firstReactant.coefficient;
      molCoeffP.value = firstProduct.coefficient;
    }

    const massCoeffR = document.getElementById('mass-coeff-r');
    const massCoeffP = document.getElementById('mass-coeff-p');

    if (massCoeffR && massCoeffP) {
      massCoeffR.value = firstReactant.coefficient;
      massCoeffP.value = firstProduct.coefficient;
    }

    sessionStorage.removeItem('balancedEquation');

  } catch (e) {
    console.error('Error importing balanced equation:', e);
  }
}

function showImportNotification(data) {
  const notification = document.createElement('div');
  notification.style.cssText =
    'position: fixed;' +
    'top: 20px;' +
    'right: 20px;' +
    'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);' +
    'color: white;' +
    'padding: 20px;' +
    'border-radius: 8px;' +
    'box-shadow: 0 4px 12px rgba(0,0,0,0.15);' +
    'z-index: 9999;' +
    'max-width: 400px;' +
    'animation: slideIn 0.5s ease;';

  const equationStr = data.reactants.map((r) => { return (r.coefficient > 1 ? r.coefficient : '') + r.formula; }).join(' + ') +
    ' → ' +
    data.products.map((p) => { return (p.coefficient > 1 ? p.coefficient : '') + p.formula; }).join(' + ');

  notification.innerHTML =
    '<div style="display: flex; align-items: start;">' +
      '<i class="fa fa-check-circle" style="font-size: 24px; margin-right: 12px; flex-shrink: 0;"></i>' +
      '<div>' +
        '<h4 style="margin: 0 0 10px 0;">Gleichung übertragen!</h4>' +
        '<p style="margin: 0 0 10px 0; font-size: 14px;">Die ausgeglichene Gleichung wurde automatisch in den Stöchiometrie-Rechner übertragen.</p>' +
        '<div style="background: rgba(255,255,255,0.2); padding: 10px; border-radius: 4px; font-size: 13px;">' +
          '<strong style="display: block; margin-bottom: 5px;">Übertragene Koeffizienten:</strong>' +
          '<div style="font-family: monospace;">' + equationStr + '</div>' +
        '</div>' +
      '</div>' +
    '</div>';

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOut 0.5s ease';
    setTimeout(() => { notification.remove(); }, 500);
  }, 5000);
}
