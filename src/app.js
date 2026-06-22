import { authService } from './firebase-config.js';
import { renderHeader } from './components/header.js';
import { renderSidebar } from './components/sidebar.js';
import { Dashboard } from './pages/dashboard.js';
import { Teams } from './pages/teams.js';
import { Players } from './pages/players.js';
import { MatchCenter } from './pages/match-center.js';
import { LiveScoring } from './pages/live-scoring.js';
import { Scorecard } from './pages/scorecard.js';
import { Statistics } from './pages/statistics.js';
import { Tournament } from './pages/tournament.js';
import { Leaderboards } from './pages/leaderboards.js';
import { MatchReport } from './pages/match-report.js';
import { TeamDetail } from './pages/team-detail.js';

// Routes
const routes = {
  'dashboard': Dashboard,
  'teams': Teams,
  'players': Players,
  'match-center': MatchCenter,
  'live-scoring': LiveScoring,
  'scorecard': Scorecard,
  'statistics': Statistics,
  'tournaments': Tournament,
  'leaderboards': Leaderboards,
  'match-report': MatchReport,
  'team-detail': TeamDetail,
};

let currentPage = 'dashboard';

// Navigation
window.navigateTo = async function(page, params = {}) {
  currentPage = page;
  const pageFn = routes[page];
  if (pageFn) {
    try {
      const content = await pageFn(params);
      document.getElementById('page-container').innerHTML = content;
      document.querySelectorAll('.sidebar-nav a').forEach(a => {
        a.classList.toggle('active', a.dataset.page === page);
      });
      window.history.pushState({ page, params }, '', `#${page}`);
    } catch (error) {
      console.error('Navigation error:', error);
      document.getElementById('page-container').innerHTML = `
        <div class="card" style="padding: 40px; text-align: center;">
          <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #DC2626;"></i>
          <h3>Page Error</h3>
          <p class="text-muted">${error.message}</p>
          <button class="btn btn-gold" onclick="window.navigateTo('dashboard')">Go Home</button>
        </div>
      `;
    }
  } else {
    await window.navigateTo('dashboard');
  }
};

// Login
window.loginWithGoogle = async function() {
  try {
    await authService.signInWithGoogle();
    window.location.reload();
  } catch (error) {
    alert('Login failed: ' + error.message);
  }
};

// Logout
window.logout = async function() {
  await authService.signOut();
  window.location.reload();
};

// Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .then(registration => {
        console.log('SW registered:', registration);
      })
      .catch(error => {
        console.log('SW registration failed:', error);
      });
  });
}

// Init App
async function initApp() {
  const user = authService.getCurrentUser();
  if (!user) {
    document.getElementById('page-container').innerHTML = `
      <div class="login-page" style="display: flex; align-items: center; justify-content: center; min-height: 70vh;">
        <div class="card" style="max-width: 400px; width: 100%; text-align: center;">
          <div style="font-size: 80px; margin-bottom: 16px;">🏏</div>
          <h2 style="color: var(--gold);">Pandavas CC Scorer</h2>
          <p class="text-muted" style="margin: 16px 0;">Sign in to manage your cricket matches</p>
          <button class="btn btn-gold" onclick="window.loginWithGoogle()" style="width: 100%;">
            <i class="fab fa-google"></i> Sign in with Google
          </button>
        </div>
      </div>
    `;
    return;
  }
  document.getElementById('main-header').innerHTML = renderHeader(user);
  document.getElementById('sidebar').innerHTML = renderSidebar();
  const hash = window.location.hash.replace('#', '') || 'dashboard';
  await window.navigateTo(hash);
  window.addEventListener('popstate', (e) => {
    if (e.state) {
      window.navigateTo(e.state.page, e.state.params);
    }
  });
}

authService.onAuthStateChange((user) => {
  if (user) {
    initApp();
  } else {
    document.getElementById('page-container').innerHTML = `
      <div class="login-page" style="display: flex; align-items: center; justify-content: center; min-height: 70vh;">
        <div class="card" style="max-width: 400px; width: 100%; text-align: center;">
          <div style="font-size: 80px; margin-bottom: 16px;">🏏</div>
          <h2 style="color: var(--gold);">Pandavas CC Scorer</h2>
          <p class="text-muted" style="margin: 16px 0;">Sign in to manage your cricket matches</p>
          <button class="btn btn-gold" onclick="window.loginWithGoogle()" style="width: 100%;">
            <i class="fab fa-google"></i> Sign in with Google
          </button>
        </div>
      </div>
    `;
  }
});

initApp();
