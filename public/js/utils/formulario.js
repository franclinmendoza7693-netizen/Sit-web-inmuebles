// Ayudas para formularios — lo usan Dev B y Dev C — dueño: Dev C
// Los `name` de los inputs son los mismos nombres del contrato (superficie_m2, zona, …).

// Devuelve un objeto { name: valor } con todos los campos del formulario (sin archivos)
export function leerFormulario(form) {
  const datos = {};
  for (const [nombre, valor] of new FormData(form)) {
    if (valor instanceof File) continue;
    datos[nombre] = typeof valor === 'string' ? valor.trim() : valor;
  }
  return datos;
}

// Pinta los errores { campo: mensaje } que devuelve la API (error.campos) debajo de cada input
export function pintarErrores(form, campos = {}) {
  limpiarErrores(form);
  for (const [nombre, mensaje] of Object.entries(campos)) {
    const input = form.elements[nombre];
    if (!input || !input.classList) continue;
    input.classList.add('is-invalid');
    const aviso = document.createElement('div');
    aviso.className = 'invalid-feedback';
    aviso.textContent = mensaje;
    // Dentro de un input-group (icono, +51, botón del ojo) el aviso va al final del grupo
    const grupo = input.closest('.input-group');
    if (grupo) grupo.append(aviso);
    else input.insertAdjacentElement('afterend', aviso);
  }
}

export function limpiarErrores(form) {
  form.querySelectorAll('.is-invalid').forEach((el) => el.classList.remove('is-invalid'));
  form.querySelectorAll('.invalid-feedback').forEach((el) => el.remove());
}
