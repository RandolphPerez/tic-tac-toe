// ===== CONSTANTES Y VARIABLES GLOBALES =====
const progressBar = document.querySelector('.progress');
const loader = document.getElementById('loader');
const main = document.getElementById('main');

// Elementos del DOM
const elements = {
    celdas: document.querySelectorAll('.celda'),
    marcadorJ1: document.getElementById('ganadas-j1'),
    marcadorJ2: document.getElementById('ganadas-j2'),
    marcadorEmpates: document.getElementById('empates'),
    nombreJ1: document.getElementById('nombre-j1'),
    nombreJ2: document.getElementById('nombre-j2')
};

// Estado del juego
let gameState = {
    progress: 0,
    tablero: Array(9).fill(null),
    turno: 'X',
    vsCPU: false,
    juegoActivo: true,
};

//Estadisticas
let stats = {
    ganadasJ1: parseInt(localStorage.getItem('ganadasJ1')) || 0,
    ganadasJ2: parseInt(localStorage.getItem('ganadasJ2')) || 0,
    empates: parseInt(localStorage.getItem('empates')) || 0
};

// Cargar estado guardado
const savedState = {
    tablero: localStorage.getItem('tablero'),
    turno: localStorage.getItem('turno'),
    vsCPU: localStorage.getItem('vsCPU'),
    juegoActivo: localStorage.getItem('juegoActivo')
};

// ===== FUNCIONES DE INICIALIZACIÓN =====
function init() {
    stats = {
        ganadasJ1: parseInt(localStorage.getItem('ganadasJ1')) || 0,
        ganadasJ2: parseInt(localStorage.getItem('ganadasJ2')) || 0,
        empates: parseInt(localStorage.getItem('empates')) || 0
    }

    actualizarMarcadores()
    cargar();
    setupEventListeners();
    checkSavedGame();
}

function cargar() {
    if (gameState.progress < 100) {
        gameState.progress += 1;
        progressBar.style.width = gameState.progress + '%';
        const delay = gameState.progress < 20 || gameState.progress > 80 ? 40 : 20;
        setTimeout(cargar, 20);
    } else {
        loader.style.opacity = '0';
        loader.style.transition = 'opacity 0.5s ease';
        
        setTimeout(() => {
            loader.style.display = 'none';
            if (!savedState.tablero) {
                main.style.display = 'flex';
                main.style.opacity = '0';
                
                setTimeout(() => {
                    main.style.opacity = '1';
                    main.style.transition = 'opacity 0.5s ease';
                }, 50);
            }
        }, 500);
    }
}

function setupEventListeners() {
    // Navegación
    document.querySelector('.btn-cpu').addEventListener('click', () => navigateTo('pantalla-cpu'));
    document.querySelector('.btn-vs').addEventListener('click', () => navigateTo('pantalla-jugadores'));
    
    // Inicio de juego
    document.getElementById('btn-iniciar-cpu').addEventListener('click', iniciarJuegoCPU);
    document.getElementById('btn-iniciar-jugadores').addEventListener('click', iniciarJuegoPVP);
    
    // Controles del tablero
    document.getElementById('btn-back').addEventListener('click', volverAlMenu);
    document.getElementById('btn-restart').addEventListener('click', mostrarAlertaReinicio);
    document.getElementById('btnProximaRonda').addEventListener('click', function() {
        proximoRound();
        this.classList.remove('mostrar');
    });
    
    // Alertas
    document.getElementById('btn-alerta-salir').addEventListener('click', ocultarAlertaVictoria);
    document.getElementById('btn-alerta-proximo').addEventListener('click', proximoRound);
    document.getElementById('btn-derrota-salir').addEventListener('click', ocultarAlertaDerrota);
    document.getElementById('btn-derrota-proximo').addEventListener('click', proximoRoundDerrota);
    document.getElementById('btn-reinicio-cancelar').addEventListener('click', ocultarAlertaReinicio);
    document.getElementById('btn-reinicio-confirmar').addEventListener('click', reiniciarPartidaCompleta);
    
    // Celdas del tablero
    elements.celdas.forEach((celda, index) => {
        celda.addEventListener('click', () => jugar(index, celda));
    });
    
    // Cerrar alertas al hacer clic fuera
    document.getElementById('alerta-reinicio').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) ocultarAlertaReinicio();
    });
    
    // Guardar estado al cerrar
    window.addEventListener('beforeunload', () => {
        if (gameState.juegoActivo) guardarEstadoJuego();
    });
}

// ===== FUNCIONES DE NAVEGACIÓN =====
function navigateTo(pantalla) {
    ocultarTodasLasPantallas();
    document.getElementById(pantalla).style.display = 'flex';
}

function ocultarTodasLasPantallas() {
    document.querySelectorAll('.main').forEach(pantalla => {
        pantalla.style.display = 'none';
    });
}

function mostrarBotonProximaRonda() {
    document.getElementById('btnProximaRonda').classList.add('mostrar');
}

function ocultarBotonProximaRonda() {
    document.getElementById('btnProximaRonda').classList.remove('mostrar');
}

// ===== FUNCIONES DE JUEGO =====
function iniciarJuegoCPU() {
    const nombre = document.getElementById('nombreJugador').value || 'Jugador';
    mostrarTablero(nombre, 'CPU', true);
}

function iniciarJuegoPVP() {
    const j1 = document.getElementById('jugador1').value || 'Jugador 1';
    const j2 = document.getElementById('jugador2').value || 'Jugador 2';
    mostrarTablero(j1, j2, false);
}

function mostrarTablero(nombre1, nombre2, esCPU) {
    ocultarTodasLasPantallas();
    document.getElementById('pantalla-tablero').style.display = 'flex';
    
    elements.nombreJ1.textContent = nombre1;
    elements.nombreJ2.textContent = nombre2;
    document.getElementById('label-j1').textContent = getIniciales(nombre1);
    document.getElementById('label-j2').textContent = nombre2 === 'CPU' ? 'CPU' : getIniciales(nombre2);
    document.getElementById('avatar-j1').textContent = getIniciales(nombre1);
    document.getElementById('avatar-j2').textContent = nombre2 === 'CPU' ? 'CPU' : getIniciales(nombre2);
    
    iniciarJuego(esCPU);
}

function getIniciales(nombre) {
    return nombre.split(' ').map(x => x[0]).join('').toUpperCase();
}

function iniciarJuego(modoCPU = false) {
    gameState.vsCPU = modoCPU;
    reiniciarTablero();
    
    elements.nombreJ1.textContent = document.getElementById('jugador1')?.value || 
                                  document.getElementById('nombreJugador')?.value || 
                                  'Jugador 1';
    elements.nombreJ2.textContent = gameState.vsCPU ? "CPU" : 
                                  (document.getElementById('jugador2')?.value || "Jugador 2");

    actualizarMarcadores();
    
    if (gameState.vsCPU) {
        localStorage.setItem('nombreJugador', document.getElementById('nombreJugador')?.value || 'Jugador');
    } else {
        localStorage.setItem('jugador1', document.getElementById('jugador1')?.value || 'Jugador 1');
        localStorage.setItem('jugador2', document.getElementById('jugador2')?.value || 'Jugador 2');
    }
    
    guardarEstadoJuego();
}

function jugar(index, celda) {
    if (!gameState.juegoActivo || gameState.tablero[index] !== null) return;

    gameState.tablero[index] = gameState.turno;
    actualizarCelda(celda, gameState.turno);

    if (verificarGanador(gameState.turno)) {
        manejarVictoria();
        return;
    }

    if (gameState.tablero.every(cell => cell !== null)) {
        manejarEmpate();
        return;
    }

    gameState.turno = gameState.turno === 'X' ? 'O' : 'X';
    actualizarJugadorActivo();
    guardarEstadoJuego();

    if (gameState.vsCPU && gameState.turno === 'O') {
        setTimeout(jugadaCPU, 500);
    }
}

function actualizarCelda(celda, turno) {
    const img = document.createElement('img');
    img.classList.add('icono');
    img.src = `assets/images/icon-${turno.toLowerCase()}.svg`;
    img.alt = turno;
    
    celda.innerHTML = '';
    celda.appendChild(img);
}

function verificarGanador(jugador) {
    const combinacionesGanadoras = [
        [0,1,2], [3,4,5], [6,7,8], // Filas
        [0,3,6], [1,4,7], [2,5,8], // Columnas
        [0,4,8], [2,4,6]           // Diagonales
    ];
    
    return combinacionesGanadoras.some(combinacion => 
        combinacion.every(index => gameState.tablero[index] === jugador)
    );
}

function jugadaCPU() {
    if (!gameState.juegoActivo) return;
    
    const disponibles = gameState.tablero
        .map((val, idx) => val === null ? idx : null)
        .filter(v => v !== null);
    
    if (disponibles.length > 0) {
        const eleccion = disponibles[Math.floor(Math.random() * disponibles.length)];
        jugar(eleccion, elements.celdas[eleccion]);
    }
}

// ===== MANEJO DE RESULTADOS =====
function manejarVictoria() {
    gameState.juegoActivo = false;
    
    if (gameState.turno === 'X') {
        stats.ganadasJ1++;
        elements.marcadorJ1.textContent = stats.ganadasJ1;
        localStorage.setItem('ganadasJ1', stats.ganadasJ1);
        setTimeout(() => mostrarAlertaVictoria(elements.nombreJ1.textContent), 500);
    } else {
        stats.ganadasJ2++;
        elements.marcadorJ2.textContent = stats.ganadasJ2;
        localStorage.setItem('ganadasJ2', stats.ganadasJ2);
        
        setTimeout(() => {

            if (gameState.vsCPU) {
                mostrarAlertaDerrota(elements.nombreJ1.textContent);
            } else {
                mostrarAlertaVictoria(elements.nombreJ2.textContent);
            }
        }, 500);
    }
    
    guardarEstadoJuego();
}

function manejarEmpate() {
    gameState.juegoActivo = false;
    stats.empates++;
    elements.marcadorEmpates.textContent = stats.empates;
    localStorage.setItem('empates', stats.empates);
    
    setTimeout(() => {
        resetearAlerta()

        document.getElementById('alerta-titulo').textContent = "¡EMPATE!";
        document.getElementById('alerta-ganador').textContent = "Ronda empatada";

        const trofeoImg = document.querySelector('.trofeo-img');
        trofeoImg.innerHTML = '<img src="assets/images/empate.png" alt="Empate">';

        actualizarContadoresAlerta();
        document.getElementById('alerta-victoria').classList.add('mostrar');
    }, 500);
    
    guardarEstadoJuego();
}

// ===== FUNCIONES DE ALERTAS =====
function mostrarAlertaVictoria(ganador) {
    resetearAlerta();
    document.getElementById('alerta-ganador').textContent = ganador;
    actualizarContadoresAlerta();
    document.getElementById('alerta-victoria').classList.add('mostrar');
}

function mostrarAlertaDerrota(perdedor) {
    if (!gameState.vsCPU) return;
    
    document.getElementById('alerta-perdedor').textContent = perdedor;
    actualizarContadoresAlerta('derrota');
    document.getElementById('alerta-derrota').classList.add('mostrar');
}

function actualizarContadoresAlerta(prefix = 'alerta') {
    document.getElementById(`${prefix}-ganadas-j1`).textContent = stats.ganadasJ1;
    document.getElementById(`${prefix}-ganadas-j2`).textContent = stats.ganadasJ2;
    document.getElementById(`${prefix}-empates`).textContent = stats.empates;
    
    document.getElementById(`${prefix}-label-j1`).textContent = document.getElementById('label-j1').textContent;
    document.getElementById(`${prefix}-label-j2`).textContent = document.getElementById('label-j2').textContent;
}

function ocultarAlertaVictoria() {
    document.getElementById('alerta-victoria').classList.remove('mostrar');
    mostrarBotonProximaRonda();
}

function ocultarAlertaDerrota() {
    document.getElementById('alerta-derrota').classList.remove('mostrar');
    mostrarBotonProximaRonda();
}

function mostrarAlertaReinicio() {
    document.getElementById('alerta-reinicio').classList.add('mostrar');
}

function ocultarAlertaReinicio() {
    document.getElementById('alerta-reinicio').classList.remove('mostrar');
}

function resetearAlerta() {
    const trofeoImg = document.querySelector('.trofeo-img');
    trofeoImg.innerHTML = '<img src="assets/images/trofeo.svg" alt="Victoria">';
    
    document.getElementById('alerta-titulo').textContent = "VICTORIA";
    document.getElementById('alerta-titulo').style.color = '#fff';
    document.getElementById('alerta-victoria').classList.remove('alerta-empate');
}

// ===== FUNCIONES DE REINICIO =====
function reiniciarTablero() {
    gameState.tablero = Array(9).fill(null);
    gameState.turno = 'X';
    gameState.juegoActivo = true;
    
    elements.celdas.forEach(celda => {
        celda.innerHTML = '';
    });
    
    guardarEstadoJuego();
    
    if (gameState.vsCPU && gameState.turno === 'O') {
        setTimeout(jugadaCPU, 500);
    }
}

function reiniciarPartidaCompleta() {
    reiniciarTodo();
    ocultarAlertaReinicio();
    
    if (gameState.vsCPU && gameState.turno === 'O') {
        setTimeout(jugadaCPU, 500);
    }
}

function reiniciarTodo() {
    // Reiniciar estado del juego
    gameState = {
        progress: 0,
        tablero: Array(9).fill(null),
        turno: 'X',
        vsCPU: false,
        juegoActivo: true
    };
    
    // Reiniciar estadísticas persistentes
    stats = {
        ganadasJ1: 0,
        ganadasJ2: 0,
        empates: 0
    };
    
    // Actualizar interfaz
    actualizarMarcadores();
    
    // Limpiar todo el localStorage
    localStorage.removeItem('tablero');
    localStorage.removeItem('turno');
    localStorage.removeItem('vsCPU');
    localStorage.removeItem('juegoActivo');
    localStorage.removeItem('ganadasJ1');
    localStorage.removeItem('ganadasJ2');
    localStorage.removeItem('empates');
    localStorage.removeItem('nombreJugador');
    localStorage.removeItem('jugador1');
    localStorage.removeItem('jugador2');
}

function proximoRound() {
    reiniciarTablero();
    ocultarAlertaVictoria();
    ocultarBotonProximaRonda();
}

function proximoRoundDerrota() {
    reiniciarTablero();
    ocultarAlertaDerrota();
    ocultarBotonProximaRonda();
}

// ===== PERSISTENCIA =====
function guardarEstadoJuego() {
    localStorage.setItem('tablero', JSON.stringify(gameState.tablero));
    localStorage.setItem('turno', gameState.turno);
    localStorage.setItem('vsCPU', gameState.vsCPU);
    localStorage.setItem('juegoActivo', gameState.juegoActivo);
}

function limpiarEstadoJuego() {
    localStorage.removeItem('tablero');
    localStorage.removeItem('turno');
    localStorage.removeItem('vsCPU');
    localStorage.removeItem('juegoActivo');
    localStorage.removeItem('nombreJugador');
    localStorage.removeItem('jugador1');
    localStorage.removeItem('jugador2');
}

function volverAlMenu() {
    ocultarTodasLasPantallas();
    main.style.display = 'flex';
    limpiarEstadoJuego();
}

// ===== CARGA DE PARTIDA GUARDADA =====
function checkSavedGame() {
    actualizarMarcadores();

    if (savedState.tablero && savedState.turno && savedState.vsCPU) {
        ocultarTodasLasPantallas();
        loader.style.display = 'none';
        
        setTimeout(() => {
            if (confirm('¿Deseas continuar la partida guardada?')) {
                cargarPartidaGuardada();
            } else {
                reiniciarTodo();
                main.style.display = 'flex';
            }
        }, 1000);
    }
}

function cargarPartidaGuardada() {
    gameState.tablero = JSON.parse(savedState.tablero);
    gameState.turno = savedState.turno;
    gameState.vsCPU = savedState.vsCPU === 'true';
    gameState.juegoActivo = savedState.juegoActivo === 'true';
    
    document.getElementById('pantalla-tablero').style.display = 'flex';
    actualizarTableroDesdeStorage();
    actualizarMarcadores();
    
    if (gameState.vsCPU) {
        const nombre = localStorage.getItem('nombreJugador') || 'Jugador';
        mostrarTablero(nombre, 'CPU', true);
    } else {
        const j1 = localStorage.getItem('jugador1') || 'Jugador 1';
        const j2 = localStorage.getItem('jugador2') || 'Jugador 2';
        mostrarTablero(j1, j2, false);
    }
}

function actualizarMarcadores() {
    elements.marcadorJ1.textContent = stats.ganadasJ1;
    elements.marcadorJ2.textContent = stats.ganadasJ2;
    elements.marcadorEmpates.textContent = stats.empates;

    animarMarcador(elements.marcadorJ1);
    animarMarcador(elements.marcadorJ2);
    animarMarcador(elements.marcadorEmpates);
}

function actualizarTableroDesdeStorage() {
    elements.celdas.forEach((celda, index) => {
        celda.innerHTML = '';
        if (gameState.tablero[index] !== null) {
            const img = document.createElement('img');
            img.classList.add('icono');
            img.src = `assets/images/icon-${gameState.tablero[index].toLowerCase()}.svg`;
            img.alt = gameState.tablero[index];
            celda.appendChild(img);
        }
    });
}

// ===== ANIMACIONES INTERACTIVAS =====

// Resaltar jugador activo
function actualizarJugadorActivo() {
    const jugador1 = document.querySelector('.jugador:nth-child(1)');
    const jugador2 = document.querySelector('.jugador:nth-child(3)');
    
    if (gameState.turno === 'X') {
        jugador1.classList.add('jugador-activo');
        jugador2.classList.remove('jugador-activo');
    } else {
        jugador2.classList.add('jugador-activo');
        jugador1.classList.remove('jugador-activo');
    }
}

// Animación para el marcador cuando cambia
function animarMarcador(elemento) {
    elemento.style.transform = 'scale(1.2)';
    setTimeout(() => {
        elemento.style.transform = 'scale(1)';
    }, 300);
}

// ===== INICIALIZACIÓN =====
window.onload = init;