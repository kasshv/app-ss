// Elementos de la interfaz
const horasRealizadasElem = document.getElementById('horas-realizadas');
const horasRestantesElem = document.getElementById('horas-restantes');
const barraProgreso = document.getElementById('barra-progreso');
const textoPorcentaje = document.getElementById('texto-porcentaje');
const tablaCuerpo = document.getElementById('tabla-cuerpo');

const modal = document.getElementById('modal-registro');
const btnAbrirModal = document.getElementById('btn-abrir-modal');
const btnCerrarModal = document.getElementById('btn-cerrar');
const formulario = document.getElementById('formulario-registro');

const HORAS_REQUERIDAS = 480;

// Cargar registros desde LocalStorage
let registros = JSON.parse(localStorage.getItem('registrosServicio')) || [];

// Función para cambiar entre vistas (Dashboard, Historial, Respaldos)
window.cambiarVista = function(nombreVista, evento) {
    document.querySelectorAll('.vista-seccion').forEach(seccion => {
        seccion.style.display = 'none';
    });

    document.getElementById(`vista-${nombreVista}`).style.display = 'block';

    document.querySelectorAll('.btn-nav').forEach(btn => {
        btn.classList.remove('activo');
    });

    if (evento && evento.target) {
        evento.target.classList.add('activo');
    }
};

// Función para calcular horas entre llegada y salida
function calcularHorasTrabajadas(llegada, salida) {
    const [h1, m1] = llegada.split(':').map(Number);
    const [h2, m2] = salida.split(':').map(Number);

    const inicio = h1 * 60 + m1;
    const fin = h2 * 60 + m2;

    let diferenciaMinutos = fin - inicio;

    if (diferenciaMinutos <= 0) {
        return 0;
    }

    const horas = diferenciaMinutos / 60;
    return Math.round(horas * 100) / 100;
}

// Actualizar resumen, barra de avance y tabla
function actualizarPantalla() {
    const totalRealizadas = registros.reduce((sum, reg) => sum + reg.horas, 0);
    const totalRealizadasRedondeado = Math.round(totalRealizadas * 100) / 100;

    let restantes = HORAS_REQUERIDAS - totalRealizadasRedondeado;
    if (restantes < 0) restantes = 0;

    horasRealizadasElem.textContent = totalRealizadasRedondeado;
    horasRestantesElem.textContent = Math.round(restantes * 100) / 100;

    const porcentaje = Math.min(100, Math.round((totalRealizadasRedondeado / HORAS_REQUERIDAS) * 100));
    barraProgreso.style.width = `${porcentaje}%`;
    textoPorcentaje.textContent = `${porcentaje}%`;

    renderizarTabla();
}

// Renderizar filas de la tabla
function renderizarTabla() {
    tablaCuerpo.innerHTML = '';

    if (registros.length === 0) {
        tablaCuerpo.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#888;">No hay jornadas registradas aún.</td></tr>`;
        return;
    }

    registros.forEach((reg, index) => {
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td>${reg.fecha}</td>
            <td>${reg.horaLlegada} - ${reg.horaSalida}</td>
            <td><strong style="color: #1f4e3d;">${reg.horas} hrs</strong></td>
            <td>${reg.tipoActividad}</td>
            <td>${reg.lugar}</td>
            <td>
                <div>${reg.descripcion}</div>
                ${reg.evidencia ? `<small style="color:#1f4e3d;">📎 ${reg.evidencia}</small>` : ''}
            </td>
            <td>
                <button class="btn-eliminar" onclick="eliminarRegistro(${index})">✕</button>
            </td>
        `;
        tablaCuerpo.appendChild(fila);
    });
}

// Eliminar un registro
window.eliminarRegistro = function(index) {
    if (confirm("¿Estás seguro de que deseas eliminar este registro?")) {
        registros.splice(index, 1);
        localStorage.setItem('registrosServicio', JSON.stringify(registros));
        actualizarPantalla();
    }
};

// Exportar datos a JSON (Respaldo)
window.exportarDatos = function() {
    const datosStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(registros, null, 2));
    const elementoDescarga = document.createElement('a');
    elementoDescarga.setAttribute("href", datosStr);
    elementoDescarga.setAttribute("download", "respaldo_servicio_social.json");
    document.body.appendChild(elementoDescarga);
    elementoDescarga.click();
    elementoDescarga.remove();
};

// Importar datos desde JSON (Restauración)
window.importarDatos = function(event) {
    const archivo = event.target.files[0];
    if (!archivo) return;

    const lector = new FileReader();
    lector.onload = function(e) {
        try {
            const datosImportados = JSON.parse(e.target.result);
            if (Array.isArray(datosImportados)) {
                registros = datosImportados;
                localStorage.setItem('registrosServicio', JSON.stringify(registros));
                actualizarPantalla();
                alert("¡Datos importados y restaurados con éxito!");
            } else {
                alert("El archivo no tiene el formato correcto.");
            }
        } catch (error) {
            alert("Error al leer el archivo JSON.");
        }
    };
    lector.readAsText(archivo);
};

// Abrir modal
btnAbrirModal.addEventListener('click', () => {
    document.getElementById('fecha').valueAsDate = new Date();
    modal.style.display = 'flex';
});

// Cerrar modal
btnCerrarModal.addEventListener('click', () => {
    modal.style.display = 'none';
});

window.addEventListener('click', (e) => {
    if (e.target === modal) modal.style.display = 'none';
});

// Guardar formulario
formulario.addEventListener('submit', (e) => {
    e.preventDefault();

    const fecha = document.getElementById('fecha').value;
    const horaLlegada = document.getElementById('hora-llegada').value;
    const horaSalida = document.getElementById('hora-salida').value;
    const tipoActividad = document.getElementById('tipo-actividad').value;
    const lugar = document.getElementById('lugar').value;
    const descripcion = document.getElementById('descripcion').value;
    const evidencia = document.getElementById('evidencia').value;

    const horasCalculadas = calcularHorasTrabajadas(horaLlegada, horaSalida);

    if (horasCalculadas <= 0) {
        alert("La hora de salida debe ser posterior a la hora de llegada.");
        return;
    }

    const nuevoRegistro = {
        fecha,
        horaLlegada,
        horaSalida,
        horas: horasCalculadas,
        tipoActividad,
        lugar,
        descripcion,
        evidencia
    };

    registros.push(nuevoRegistro);
    localStorage.setItem('registrosServicio', JSON.stringify(registros));

    actualizarPantalla();
    formulario.reset();
    modal.style.display = 'none';
    
    // Cambiar automáticamente a la vista de historial para ver el registro guardado
    document.querySelectorAll('.vista-seccion').forEach(s => s.style.display = 'none');
    document.getElementById('vista-historial').style.display = 'block';
    document.querySelectorAll('.btn-nav').forEach(b => b.classList.remove('activo'));
    document.querySelectorAll('.btn-nav')[1].classList.add('activo');
});

// Inicialización
actualizarPantalla();