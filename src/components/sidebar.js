export function renderSidebar() {
  const navItems = [
    { icon: 'fa-home', label: 'Dashboard', page: 'dashboard' },
    { icon: 'fa-users', label: 'Teams', page: 'teams' },
    { icon: 'fa-user-cog', label: 'Players', page: 'players' },
    { icon: 'fa-baseball-ball', label: 'Match Center', page: 'match-center' },
    { icon: 'fa-play', label: 'Live Scoring', page: 'live-scoring' },
    { icon: 'fa-scroll', label: 'Scorecard', page: 'scorecard' },
    { icon: 'fa-trophy', label: 'Tournaments', page: 'tournaments' },
    { icon: 'fa-chart-bar', label: 'Statistics', page: 'statistics' },
    { icon: 'fa-crown', label: 'Leaderboards', page: 'leaderboards' },
    { icon: 'fa-file-alt', label: 'Match Report', page: 'match-report' },
  ];
  return `
    <ul class="sidebar-nav">
      ${navItems.map(item => `
        <li>
          <a href="#" data-page="${item.page}" onclick="window.navigateTo('${item.page}')">
            <i class="fas ${item.icon}"></i> ${item.label}
          </a>
        </li>
      `).join('')}
    </ul>
  `;
}
