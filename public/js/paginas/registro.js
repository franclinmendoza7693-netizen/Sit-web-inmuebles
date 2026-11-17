/**
 * InmoPredict — Página de Registro de Propietarios
 * Dueño: Dev C (Frontend y UX)
 */
import { REGEX } from '/shared/contrato.js';
import { api, ApiError } from '../api.js';
import { guardarSesion, estaAutenticado } from '../auth.js';
import { configurarVerPassword } from '../componentes/ver-password.js';
import { limpiarErrores, pintarErrores } from '../utils/formulario.js';

document.addEventListener('DOMContentLoaded', () => {
  if (estaAutenticado()) {
    window.location.href = '/panel.html';
    return;
  }

  configurarVerPassword();

  const form = document.getElementById('form-registro');
  const btnRegistrar = document.getElementById('btn-registrar');
  const alertMensaje = document.getElementById('registro-mensaje');

  const inputDni = document.getElementById('reg-dni');
  const inputNombres = document.getElementById('reg-nombres');
  const inputApellidos = document.getElementById('reg-apellidos');
  const inputTelefono = document.getElementById('reg-telefono');
  const inputEmail = document.getElementById('reg-email');
  const inputPassword = document.getElementById('reg-password');
  const inputPassword2 = document.getElementById('reg-password2');

  const reqLargo = document.querySelector('[data-requisito="largo"]');
  const reqMayus = document.querySelector('[data-requisito="mayuscula"]');
  const reqMinus = document.querySelector('[data-requisito="minuscula"]');
  const reqNum = document.querySelector('[data-requisito="numero"]');

  inputDni.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '').slice(0, 8);
  });
  inputTelefono.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '').slice(0, 9);
  });

  // Validación interactiva de requisitos en vivo
  inputPassword.addEventListener('input', () => {
    const val = inputPassword.value;
    reqLargo.classList.toggle('ip-cumple', val.length >= 8);
    reqMayus.classList.toggle('ip-cumple', /[A-Z]/.test(val));
    reqMinus.classList.toggle('ip-cumple', /[a-z]/.test(val));
    reqNum.classList.toggle('ip-cumple', /\d/.test(val));
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    limpiarErrores(form);
    alertMensaje.hidden = true;
    alertMensaje.className = 'alert';
    alertMensaje.textContent = '';

    const datos = {
      dni: inputDni.value.trim(),
      nombres: inputNombres.value.trim(),
      apellidos: inputApellidos.value.trim(),
      telefono: inputTelefono.value.trim(),
      email: inputEmail.value.trim() || null,
      password: inputPassword.value
    };

    const confirmacion = inputPassword2.value;
    const errores = {};

    if (!datos.dni || !REGEX.dni.test(datos.dni)) {
      errores.dni = 'El DNI debe tener 8 dígitos numéricos.';
    }
    if (!datos.nombres) {
      errores.nombres = 'Ingresa tus nombres.';
    }
    if (!datos.apellidos) {
      errores.apellidos = 'Ingresa tus apellidos.';
    }
    if (datos.telefono && !REGEX.telefono.test(datos.telefono)) {
      errores.telefono = 'El celular debe tener 9 dígitos y empezar con 9.';
    }
    if (!REGEX.password.test(datos.password)) {
      errores.password = 'La contraseña no cumple los requisitos mínimos de seguridad.';
    }
    if (datos.password !== confirmacion) {
      errores.password_confirmacion = 'Las contraseñas ingresadas no coinciden.';
    }

    if (Object.keys(errores).length > 0) {
      pintarErrores(form, errores);
      return;
    }

    btnRegistrar.disabled = true;
    const txtOriginal = btnRegistrar.innerHTML;
    btnRegistrar.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status"></span> Registrando…`;

    try {
      await api('/auth/registro', {
        metodo: 'POST',
        datos
      });

      // Auto-login al registrarse
      try {
        const sesion = await api('/auth/login', {
          metodo: 'POST',
          datos: { dni: datos.dni, password: datos.password }
        });
        guardarSesion(sesion);
        window.location.href = '/panel.html';
      } catch {
        window.location.href = '/login.html?registrado=1';
      }

    } catch (err) {
      btnRegistrar.disabled = false;
      btnRegistrar.innerHTML = txtOriginal;

      if (err instanceof ApiError) {
        if (err.campos && Object.keys(err.campos).length > 0) {
          pintarErrores(form, err.campos);
        } else if (err.codigo === 'DNI_DUPLICADO') {
          pintarErrores(form, { dni: 'Este DNI ya está registrado en el sistema.' });
        } else {
          alertMensaje.classList.add('alert-danger');
          alertMensaje.textContent = err.mensaje || 'Error al procesar el registro.';
          alertMensaje.hidden = false;
        }
      } else {
        alertMensaje.classList.add('alert-danger');
        alertMensaje.textContent = 'Error de conexión con el servidor.';
        alertMensaje.hidden = false;
      }
    }
  });
});
