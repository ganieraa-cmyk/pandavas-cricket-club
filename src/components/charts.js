export function renderWagonWheel(ballData) {
  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 400;
  const ctx = canvas.getContext('2d');
  
  // Draw cricket field
  ctx.beginPath();
  ctx.arc(200, 200, 180, 0, Math.PI * 2);
  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = 2;
  ctx.stroke();
  
  // Draw pitch
  ctx.fillStyle = '#2A2A2A';
  ctx.fillRect(180, 190, 40, 20);
  
  // Draw field zones
  ctx.beginPath();
  ctx.arc(200, 200, 90, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,215,0,0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();
  
  ctx.beginPath();
  ctx.arc(200, 200, 170, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,215,0,0.2)';
  ctx.lineWidth = 1;
  ctx.stroke();
  
  // Plot shots
  const colors = {
    0: '#666666',
    1: '#00FF00',
    2: '#FFD700',
    3: '#FFA500',
    4: '#FF6B6B',
    5: '#FF4444',
    6: '#FF0000'
  };
  
  const shotZones = {
    'off': { angle: -0.5, range: 0.8 },
    'mid': { angle: 0, range: 0.6 },
    'leg': { angle: 0.5, range: 0.8 },
    'cover': { angle: -0.8, range: 0.7 },
    'point': { angle: -1.2, range: 0.7 },
    'fine-leg': { angle: 1.2, range: 0.7 }
  };
  
  (ballData || []).forEach((ball) => {
    if (ball.runs > 0 && ball.shotZone) {
      const zone = shotZones[ball.shotZone] || shotZones['mid'];
      const angle = zone.angle + (Math.random() - 0.5) * 0.3;
      const distance = 40 + (ball.runs * 20) + (Math.random() - 0.5) * 15;
      
      const x = 200 + Math.cos(angle) * distance;
      const y = 200 + Math.sin(angle) * distance;
      
      const radius = ball.runs === 4 ? 8 : ball.runs === 6 ? 10 : 6;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = colors[ball.runs] || '#FFFFFF';
      ctx.fill();
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(ball.runs, x, y - radius - 5);
    }
  });
  
  // Legend
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '12px Arial';
  ctx.fillText('🏏 Shot Map', 10, 20);
  
  const legendItems = [
    { color: '#00FF00', label: '1-2 runs' },
    { color: '#FFD700', label: '3 runs' },
    { color: '#FF6B6B', label: '4 runs' },
    { color: '#FF0000', label: '6 runs' }
  ];
  
  legendItems.forEach((item, i) => {
    const y = 35 + i * 20;
    ctx.fillStyle = item.color;
    ctx.fillRect(10, y, 12, 12);
    ctx.fillStyle = '#B0B0B0';
    ctx.font = '10px Arial';
    ctx.fillText(item.label, 28, y + 10);
  });
  
  return canvas;
}

export function renderManhattanGraph(overData) {
  const canvas = document.createElement('canvas');
  canvas.width = 500;
  canvas.height = 300;
  const ctx = canvas.getContext('2d');
  
  const maxRuns = Math.max(...(overData || []).map(o => o.runs), 10);
  const barWidth = canvas.width / (overData || []).length - 2;
  
  (overData || []).forEach((over, index) => {
    const x = index * (barWidth + 4) + 2;
    const height = (over.runs / maxRuns) * (canvas.height - 40);
    const y = canvas.height - height - 20;
    
    ctx.fillStyle = over.runs > 10 ? '#FF6B6B' : '#FFD700';
    ctx.fillRect(x, y, barWidth, height);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(over.runs, x + barWidth/2, y - 5);
    
    ctx.fillStyle = '#B0B0B0';
    ctx.font = '8px Arial';
    ctx.fillText(`O${index+1}`, x + barWidth/2, canvas.height - 5);
  });
  
  // Wickets line
  ctx.strokeStyle = '#FF0000';
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  (overData || []).forEach((over, index) => {
    const x = index * (barWidth + 4) + barWidth/2 + 2;
    const y = canvas.height - 20 - (over.wickets * 20);
    index === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.stroke();
  ctx.setLineDash([]);
  
  return canvas;
}
