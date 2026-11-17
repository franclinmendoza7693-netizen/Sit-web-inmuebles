/**
 * InmoPredict — Página de Inicio de Sesión
 * Dueño: Dev C (Frontend y UX)
 */
import '../componentes/navbar.js';
import { REGEX } from '/shared/contrato.js';
import { api, ApiError } from '../api.js';
import { guardarSesion, estaAutenticado } from '../auth.js';
import { activarVerPassword } from '../componentes/ver-password.js';
import { limpiarErrores, pintarErrores } from '../utils/formulario.js';

document.addEventListener('DOMContentLoaded', () => {
  if (estaAutenticado()) {
    window.location.href = '/panel.html';
    return;
  }

  activarVerPassword();

  const form = document.getElementById('form-login');
  const btnLogin = document.getElementById('btn-login');
  const alertMensaje = document.getElementById('login-mensaje');
  const inputDni = document.getElementById('login-dni');
  const inputPassword = document.getElementById('login-password');

  // Solo dígitos en DNI
  inputDni.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '').slice(0, 8);
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    limpiarErrores(form);
    alertMensaje.hidden = true;
    alertMensaje.textContent = '';

    const dni = inputDni.value.trim();
    const password = inputPassword.value;
    const errores = {};

    if (!dni) {
      errores.dni = 'Ingresa tu número de DNI.';
    } else if (!REGEX.dni.test(dni)) {
      errores.dni = 'El DNI debe tener 8 dígitos numéricos.';
    }

    if (!password) {
      errores.password = 'Ingresa tu contraseña.';
    }

    if (Object.keys(errores).length > 0) {
      pintarErrores(form, errores);
      return;
    }

    btnLogin.disabled = true;
    const txtOriginal = btnLogin.innerHTML;
    btnLogin.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status"></span> Ingresando…`;

    try {
      const data = await api('/auth/login', {
        metodo: 'POST',
        datos: { dni, password }
      });

      guardarSesion(data);

      const params = new URLSearchParams(window.location.search);
      const volver = decodeURIComponent(params.get('redir') || '');
      // Solo rutas internas: "//sitio.com" o "/\sitio.com" mandarían al usuario a otro dominio
      const esRutaInterna = volver.startsWith('/') && !volver.startsWith('//') && !volver.startsWith('/\\');
      window.location.href = esRutaInterna ? volver : '/panel.html';

    } catch (err) {
      btnLogin.disabled = false;
      btnLogin.innerHTML = txtOriginal;

      if (err instanceof ApiError) {
        if (err.campos && Object.keys(err.campos).length > 0) {
          pintarErrores(form, err.campos);
        } else {
          alertMensaje.textContent = err.mensaje || 'DNI o contraseña incorrectos.';
          alertMensaje.hidden = false;
        }
      } else {
        alertMensaje.textContent = 'Error al conectar con el servidor. Inténtalo de nuevo.';
        alertMensaje.hidden = false;
      }
    }
  });
});
