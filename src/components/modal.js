export function showModal(content) {
  const container = document.getElementById('modal-container');
  container.innerHTML = `
    <div class="modal-overlay" onclick="if(event.target===this) closeModal()">
      <div class="modal">
        <div class="modal-header">
          <h2>${content}</h2>
          <button class="modal-close" onclick="closeModal()">✕</button>
        </div>
        <div id="modal-body"></div>
      </div>
    </div>
  `;
  const modalBody = document.getElementById('modal-body');
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = content;
  const header = tempDiv.querySelector('h2');
  if (header) header.remove();
  modalBody.innerHTML = tempDiv.innerHTML;
}

window.closeModal = function() {
  document.getElementById('modal-container').innerHTML = '';
};
