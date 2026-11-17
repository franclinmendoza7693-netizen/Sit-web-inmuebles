// Registro de propietario — dueño: Dev C (día 2)
import { renderNavbar } from '../componentes/navbar.js';
import { activarVerPassword } from '../componentes/ver-password.js';
// import { api, ApiError } from '../api.js';
// import { leerFormulario, pintarErrores } from '../utils/formulario.js';
// import { REGEX, MENSAJES } from '/shared/contrato.js';

renderNavbar();
activarVerPassword(); // botones del ojo para ver la contraseña (día 1)

// TODO (Dev C, día 2):
// 1. Validación en vivo con REGEX.dni, REGEX.password, REGEX.telefono y MENSAJES.
//    Marcar con la clase ip-cumple cada <li data-requisito> de #requisitos-password
//    (largo: 8+, mayuscula: /[A-Z]/, minuscula: /[a-z]/, numero: /\d/).
// 2. Confirmar contraseña (campo "password_confirmacion": solo existe en el front, no se envía).
// 3. await api('/auth/registro', { metodo: 'POST', datos })
// 4. VALIDACION → pintarErrores(form, error.campos); DNI_DUPLICADO → mensaje en el campo dni.
// 5. Éxito → redirigir a /login.html con aviso de cuenta creada.
