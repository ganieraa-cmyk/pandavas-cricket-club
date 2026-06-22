import { showModal } from './modal.js';

export function renderPlayingXI(teamId, players, selectedPlayers = []) {
  const teamPlayers = players.filter(p => p.team === teamId);
  
  return `
    <div class="playing-xi">
      <h4 style="color: var(--gold); margin-bottom: 12px;">Select Playing XI (11 players)</h4>
      <div style="color: var(--text-muted); font-size: 14px; margin-bottom: 12px;">
        Selected: <span id="selectedCount">${selectedPlayers.length}</span>/11
        ${selectedPlayers.length === 11 ? ' ✅ Complete' : ''}
      </div>
      <div class="grid-3" id="playerGrid">
        ${teamPlayers.map(player => `
          <div class="card" style="padding: 12px; cursor: pointer; ${selectedPlayers.includes(player.id) ? 'border-color: var(--gold); background: rgba(255,215,0,0.05);' : ''}"
            data-player-id="${player.id}" onclick="window.togglePlayerSelection('${player.id}')">
            <div class="flex items-center gap-8">
              <div style="width: 30px; height: 30px; border-radius: 50%; background: var(--black); border: 2px solid var(--gold); overflow: hidden; display: flex; align-items: center; justify-content: center;">
                ${player.photo ? `<img src="${player.photo}" style="width: 100%; height: 100%; object-fit: cover;">` : `<i class="fas fa-user" style="font-size: 12px; color: var(--gold);"></i>`}
              </div>
              <div>
                <div style="font-size: 14px;">${player.name}</div>
                <div style="font-size: 11px; color: var(--text-muted);">#${player.jerseyNumber || 'N/A'}</div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
      <div style="margin-top: 16px; text-align: center;">
        <button class="btn btn-gold" id="confirmXI" 
          ${selectedPlayers.length === 11 ? '' : 'disabled style="opacity:0.5;"'}
          onclick="window.confirmPlayingXI()">
          <i class="fas fa-check"></i> Confirm XI
        </button>
        ${selectedPlayers.length !== 11 ? `<p style="color: #DC2626; font-size: 12px; margin-top: 8px;">Please select exactly 11 players</p>` : ''}
      </div>
    </div>
  `;
}

window.togglePlayerSelection = function(playerId) {
  const card = document.querySelector(`[data-player-id="${playerId}"]`);
  if (!card) return;
  
  const allCards = Array.from(document.querySelectorAll('[data-player-id]'));
  const selectedCount = allCards.filter(el => 
    el.style.borderColor === 'var(--gold)'
  ).length;
  
  const isSelected = card.style.borderColor === 'var(--gold)';
  
  if (!isSelected && selectedCount >= 11) {
    alert('Cannot select more than 11 players!');
    return;
  }
  
  if (isSelected) {
    card.style.borderColor = '';
    card.style.background = '';
  } else {
    card.style.borderColor = 'var(--gold)';
    card.style.background = 'rgba(255,215,0,0.05)';
  }
  
  const updatedSelected = Array.from(document.querySelectorAll('[data-player-id]'))
    .filter(el => el.style.borderColor === 'var(--gold)')
    .length;
  
  document.getElementById('selectedCount').textContent = updatedSelected;
  
  const confirmBtn = document.getElementById('confirmXI');
  if (confirmBtn) {
    confirmBtn.disabled = updatedSelected !== 11;
    confirmBtn.style.opacity = updatedSelected === 11 ? '1' : '0.5';
  }
};

window.confirmPlayingXI = function() {
  const selected = Array.from(document.querySelectorAll('[data-player-id]'))
    .filter(el => el.style.borderColor === 'var(--gold)')
    .map(el => el.dataset.playerId);
  
  if (selected.length !== 11) {
    alert(`Please select exactly 11 players! (Currently ${selected.length})`);
    return;
  }
  
  window.selectedXI = selected;
  window.closeModal();
  alert('✅ Playing XI confirmed!');
};
