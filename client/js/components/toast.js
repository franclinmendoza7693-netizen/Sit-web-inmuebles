export function mostrarToast(mensaje, tipo = 'exito') {
  let contenedor = document.getElementById('contenedor-toasts');
  if (!contenedor) {
    contenedor = document.createElement('div');
    contenedor.id = 'contenedor-toasts';
    contenedor.className = 'toast-container position-fixed bottom-0 end-0 p-3';
    contenedor.style.zIndex = '1090';
    document.body.appendChild(contenedor);
  }

  const toastEl = document.createElement('div');
  toastEl.className = 'toast align-items-center border-0 shadow-lg show';
  toastEl.setAttribute('role', 'status');
  toastEl.setAttribute('aria-live', 'polite');
  toastEl.setAttribute('aria-atomic', 'true');

  const colorFondo = tipo === 'exito' ? 'bg-success text-white' : (tipo === 'error' ? 'bg-danger text-white' : 'bg-primary text-white');
  const icono = tipo === 'exito' ? 'bi-check-circle' : (tipo === 'error' ? 'bi-exclamation-octagon' : 'bi-info-circle');

  toastEl.innerHTML = `
    <div class="d-flex ${colorFondo} rounded">
      <div class="toast-body d-flex align-items-center gap-2">
        <i class="bi ${icono} fs-5" aria-hidden="true"></i>
        <span class="ip-toast-mensaje"></span>
      </div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Cerrar"></button>
    </div>
  `;

  toastEl.querySelector('.ip-toast-mensaje').textContent = mensaje;
  contenedor.appendChild(toastEl);

  const btnCerrar = toastEl.querySelector('.btn-close');
  btnCerrar.addEventListener('click', () => {
    toastEl.remove();
  });

  setTimeout(() => {
    if (toastEl.parentElement) {
      toastEl.classList.remove('show');
      setTimeout(() => toastEl.remove(), 250);
    }
  }, 3500);
}