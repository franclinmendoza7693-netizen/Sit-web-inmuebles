// Botón para mostrar u ocultar contraseñas — dueño: Dev C
// En el HTML: <button type="button" data-ver-password="id-del-input" aria-label="Mostrar contraseña"
//               aria-pressed="false"><i class="bi bi-eye"></i></button>
// En el JS de la página: activarVerPassword();
export function activarVerPassword(raiz = document) {
  raiz.querySelectorAll('[data-ver-password]').forEach((boton) => {
    const input = document.getElementById(boton.dataset.verPassword);
    if (!input) return;
    boton.addEventListener('click', () => {
      const mostrar = input.type === 'password';
      input.type = mostrar ? 'text' : 'password';
      boton.setAttribute('aria-pressed', String(mostrar));
      boton.setAttribute('aria-label', mostrar ? 'Ocultar contraseña' : 'Mostrar contraseña');
      const icono = boton.querySelector('i');
      icono?.classList.toggle('bi-eye', !mostrar);
      icono?.classList.toggle('bi-eye-slash', mostrar);
    });
  });
}
