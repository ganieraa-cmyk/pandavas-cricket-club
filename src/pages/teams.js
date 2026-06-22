// src/pages/teams.js - Add logo upload

// Add this to the create team modal:
<div class="form-group">
  <label>Team Logo</label>
  <input type="file" class="form-control" id="teamLogoFile" accept="image/*" onchange="window.previewLogo(event)">
  <div id="logoPreview" style="margin-top: 8px; display: none;">
    <img id="logoPreviewImg" style="max-width: 100px; max-height: 100px; border-radius: 8px; border: 2px solid var(--gold);">
  </div>
  <small class="text-muted">Upload PNG, JPG, or SVG (max 5MB)</small>
</div>

// Add preview function
window.previewLogo = function(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      document.getElementById('logoPreview').style.display = 'block';
      document.getElementById('logoPreviewImg').src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
};

// Update submit handler
document.getElementById('createTeamForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  // Upload logo if selected
  const logoFile = document.getElementById('teamLogoFile').files[0];
  let logoUrl = null;
  
  if (logoFile) {
    try {
      const storageRef = ref(storage, `logos/${Date.now()}_${logoFile.name}`);
      const snapshot = await uploadBytes(storageRef, logoFile);
      logoUrl = await getDownloadURL(snapshot.ref);
    } catch (error) {
      console.error('Logo upload error:', error);
      alert('Failed to upload logo. Please try again.');
      return;
    }
  }
  
  const teamData = {
    name: document.getElementById('teamName').value,
    logo: logoUrl || document.getElementById('teamLogo').value || null,
    captain: document.getElementById('teamCaptain').value || null,
    city: document.getElementById('teamCity').value || null,
    players: [],
    createdAt: new Date().toISOString()
  };
  
  await firestore.create('teams', teamData);
  window.location.reload();
});
