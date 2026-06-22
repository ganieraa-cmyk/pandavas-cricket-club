// src/utils/backup.js - Auto Backup & Export/Import
import { firestore } from '../firebase-config.js';

export async function autoBackup() {
  const collections = ['matches', 'teams', 'players', 'tournaments'];
  const backup = {};
  
  for (const coll of collections) {
    try {
      backup[coll] = await firestore.getAll(coll);
    } catch (error) {
      console.error(`Failed to backup ${coll}:`, error);
      backup[coll] = [];
    }
  }
  
  backup.timestamp = new Date().toISOString();
  backup.version = '3.1.0';
  backup.totalItems = Object.values(backup).reduce((sum, arr) => sum + arr.length, 0);
  
  // Save to localStorage
  localStorage.setItem('pandavas_backup', JSON.stringify(backup));
  
  // Also export as JSON file
  const blob = new Blob([JSON.stringify(backup, null, 2)], { 
    type: 'application/json' 
  });
  
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pandavas-backup-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  
  return backup;
}

export function importBackup(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result);
        
        // Validate backup structure
        if (!data.matches || !data.teams || !data.players) {
          reject('Invalid backup file: Missing required collections');
          return;
        }
        
        if (!data.version) {
          reject('Invalid backup file: Version missing');
          return;
        }
        
        // Show confirmation
        const totalItems = data.matches.length + data.teams.length + data.players.length + (data.tournaments?.length || 0);
        const confirmRestore = confirm(
          `This will restore ${totalItems} items.\n\n` +
          `Matches: ${data.matches.length}\n` +
          `Teams: ${data.teams.length}\n` +
          `Players: ${data.players.length}\n` +
          `Tournaments: ${data.tournaments?.length || 0}\n\n` +
          `WARNING: This may create duplicate entries. Continue?`
        );
        
        if (!confirmRestore) {
          reject('Restore cancelled');
          return;
        }
        
        // Restore data
        let restored = 0;
        for (const [collection, items] of Object.entries(data)) {
          if (collection === 'timestamp' || collection === 'version' || collection === 'totalItems') continue;
          for (const item of items) {
            try {
              await firestore.create(collection, item);
              restored++;
            } catch (error) {
              console.error(`Failed to restore ${collection}/${item.id}:`, error);
            }
          }
        }
        
        resolve(`Successfully restored ${restored} items!`);
      } catch (error) {
        reject('Import failed: ' + error.message);
      }
    };
    reader.onerror = () => reject('Failed to read file');
    reader.readAsText(file);
  });
}

export function getBackupInfo() {
  const backup = localStorage.getItem('pandavas_backup');
  if (!backup) return null;
  try {
    const data = JSON.parse(backup);
    return {
      timestamp: data.timestamp,
      version: data.version,
      totalItems: data.totalItems,
      collections: {
        matches: data.matches?.length || 0,
        teams: data.teams?.length || 0,
        players: data.players?.length || 0,
        tournaments: data.tournaments?.length || 0
      }
    };
  } catch {
    return null;
  }
}

export function scheduleAutoBackup(intervalHours = 24) {
  const lastBackup = localStorage.getItem('pandavas_last_backup');
  const now = Date.now();
  
  if (lastBackup) {
    const elapsed = (now - parseInt(lastBackup)) / (1000 * 60 * 60);
    if (elapsed < intervalHours) {
      console.log(`Next backup in ${(intervalHours - elapsed).toFixed(1)} hours`);
      return false;
    }
  }
  
  autoBackup();
  localStorage.setItem('pandavas_last_backup', now.toString());
  return true;
}
