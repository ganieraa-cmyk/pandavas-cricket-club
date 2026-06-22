// src/utils/share.js - Live Score Sharing & QR Code
export function generateLiveShareLink(matchId) {
  const baseUrl = window.location.origin;
  return `${baseUrl}?match=${matchId}&view=live`;
}

export function generateQRCode(text, elementId) {
  const container = document.getElementById(elementId);
  if (!container) return null;
  
  // Check if QRCode library is available
  if (typeof QRCode === 'undefined') {
    container.innerHTML = '<p class="text-muted">QR Code library not loaded</p>';
    return null;
  }
  
  // Clear container
  container.innerHTML = '';
  
  // Create QR code
  const qr = new QRCode(container, {
    text: text,
    width: 200,
    height: 200,
    colorDark: '#FFD700',
    colorLight: '#0A0A0A',
    correctLevel: QRCode.CorrectLevel.H
  });
  
  return qr;
}

export function shareLiveScore(matchId, scoreData) {
  const link = generateLiveShareLink(matchId);
  const scoreText = `🏏 ${scoreData.team1} vs ${scoreData.team2}\n` +
                   `Score: ${scoreData.runs}/${scoreData.wickets}\n` +
                   `Overs: ${scoreData.overs}\n` +
                   `RR: ${scoreData.runRate}`;
  
  if (navigator.share) {
    navigator.share({
      title: '🏏 Pandavas Cricket Live Score',
      text: scoreText,
      url: link
    }).catch(() => {
      // Fallback to clipboard
      copyToClipboard(link);
    });
  } else {
    copyToClipboard(link);
  }
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    alert('Live score link copied! 📋');
  }).catch(() => {
    // Fallback
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    alert('Live score link copied! 📋');
  });
}

export function generateMatchSummary(scoreData) {
  return {
    text: `🏏 ${scoreData.team1} vs ${scoreData.team2}\n` +
          `Score: ${scoreData.runs}/${scoreData.wickets}\n` +
          `Overs: ${scoreData.overs}\n` +
          `RR: ${scoreData.runRate}`,
    html: `
      <div style="background: #1A1A1A; padding: 16px; border-radius: 12px; border: 2px solid #FFD700;">
        <h3 style="color: #FFD700;">🏏 ${scoreData.team1} vs ${scoreData.team2}</h3>
        <div style="font-size: 24px; font-weight: bold; color: #FFFFFF;">${scoreData.runs}/${scoreData.wickets}</div>
        <div style="color: #B0B0B0;">Overs: ${scoreData.overs} | RR: ${scoreData.runRate}</div>
        ${scoreData.target ? `<div style="color: #FFD700;">Target: ${scoreData.target}</div>` : ''}
      </div>
    `
  };
}
