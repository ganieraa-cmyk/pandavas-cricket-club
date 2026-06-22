export function renderHeader(user) {
  return `
    <div class="header-brand">
      <img src="/icons/icon-192.png" alt="Pandavas CC">
      <h1>Pandavas CC</h1>
    </div>
    <div style="display: flex; align-items: center; gap: 16px;">
      <span style="color: var(--text-secondary); font-size: 14px;">
        <i class="fas fa-user"></i> ${user.displayName || 'Admin'}
      </span>
      <button class="btn btn-outline-gold" style="padding: 6px 16px; font-size: 12px;" onclick="window.logout()">
        <i class="fas fa-sign-out-alt"></i> Logout
      </button>
    </div>
  `;
}
