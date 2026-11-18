/**
 * InmoPredict — Componente para ver/ocultar contraseñas
 * Soporta accesibilidad (aria-label, aria-pressed) y data-ver-password
 */

export function activarVerPassword() {
  const botones = document.querySelectorAll('[data-ver-password]');

  botones.forEach(btn => {
    // Evitar agregar múltiples listeners si se llama más de una vez
    if (btn.dataset.iniciado === 'true') return;
    btn.dataset.iniciado = 'true';

    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-ver-password');
      const input = document.getElementById(targetId);
      if (!input) return;

      const icono = btn.querySelector('i');
      const esPassword = input.type === 'password';

      // Alternar tipo de input
      input.type = esPassword ? 'text' : 'password';

      // Accesibilidad
      btn.setAttribute('aria-pressed', esPassword ? 'true' : 'false');
      btn.setAttribute('aria-label', esPassword ? 'Ocultar contraseña' : 'Mostrar contraseña');

      // Alternar icono de ojo
      if (icono) {
        if (esPassword) {
          icono.classList.remove('bi-eye');
          icono.classList.add('bi-eye-slash');
        } else {
          icono.classList.remove('bi-eye-slash');
          icono.classList.add('bi-eye');
        }
      }
    });
  });
}

// Auto-inicializar si el documento ya cargó
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', activarVerPassword);
} else {
  activarVerPassword();
}