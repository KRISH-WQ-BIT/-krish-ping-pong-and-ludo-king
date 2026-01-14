/**
 * KRISH GAMING ZONE
 * Main Controller Script
 */

// Global State
let appState = {
    currentGame: 'pingpong', // 'pingpong' or 'chess'
    mode: 'vs-computer' // 'vs-computer' or '2-players'
};

// Ping Pong State
let pingPongState = {
    running: false,
    canvas: null,
    ctx: null,
    ball: { x: 400, y: 250, dx: 4, dy: 4, radius: 8 },
    p1: { y: 200, height: 80, width: 8, score: 0 },
    p2: { y: 200, height: 80, width: 8, score: 0 },
    animationFrame: null
};

// Chess State
let chessState = {
    board: [],
    selectedSquare: null,
    turn: 'white',
    pieces: {
        'r': '♜', 'n': '♞', 'b': '♝', 'q': '♛', 'k': '♚', 'p': '♟',
        'R': '♖', 'N': '♘', 'B': '♗', 'Q': '♕', 'K': '♔', 'P': '♙'
    }
};

const initialBoard = [
    ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
    ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
    ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
];

// --- Navigation & Core Logic ---

function showGame(gameId) {
    appState.currentGame = gameId;

    // Update switcher UI
    document.querySelectorAll('.switch-card').forEach(card => card.classList.remove('active'));
    document.getElementById(`switch-${gameId}`).classList.add('active');

    // Switch screens
    document.getElementById('pingpong-game').classList.add('hidden');
    document.getElementById('chess-game').classList.add('hidden');

    stopGames();

    if (gameId === 'pingpong') {
        document.getElementById('pingpong-game').classList.remove('hidden');
        initPingPong();
    } else if (gameId === 'chess') {
        document.getElementById('chess-game').classList.remove('hidden');
        initChess();
    }
}

function setMode(modeId) {
    appState.mode = modeId;

    // Update labels
    const p2Label = document.getElementById('p2-label');
    if (modeId === 'vs-computer') {
        p2Label.textContent = 'COMPUTER';
    } else {
        p2Label.textContent = 'PLAYER 2';
    }

    // Update buttons
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`mode-${modeId}`).classList.add('active');

    // Reset scores when mode changes
    pingPongState.p1.score = 0;
    pingPongState.p2.score = 0;
    updateScoreUI();
    resetBall();
}

function updateScoreUI() {
    document.getElementById('p1-score').textContent = pingPongState.p1.score;
    document.getElementById('p2-score').textContent = pingPongState.p2.score;
}

// --- Ping Pong Logic ---

function initPingPong() {
    const canvas = document.getElementById('pingpong-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // Responsive canvas sizing logic could go here, but using fixed internal coords
    canvas.width = 800;
    canvas.height = 500;

    pingPongState.canvas = canvas;
    pingPongState.ctx = ctx;
    pingPongState.running = true;

    // Ball Reset
    resetBall();

    // Input Handling
    canvas.removeEventListener('mousemove', handleMouseMove); // Prevent double listeners
    canvas.addEventListener('mousemove', handleMouseMove);

    // Touch handling for some interactivity
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const mouseY = (touch.clientY - rect.top) * (canvas.height / rect.height);
        movePaddle(mouseY);
    });

    requestAnimationFrame(pingPongLoop);
}

function handleMouseMove(e) {
    const rect = pingPongState.canvas.getBoundingClientRect();
    const scaleY = pingPongState.canvas.height / rect.height;
    const mouseY = (e.clientY - rect.top) * scaleY;
    movePaddle(mouseY);
}

function movePaddle(y) {
    pingPongState.p1.y = y - pingPongState.p1.height / 2;
    // Boundaries
    if (pingPongState.p1.y < 0) pingPongState.p1.y = 0;
    if (pingPongState.p1.y > pingPongState.canvas.height - pingPongState.p1.height)
        pingPongState.p1.y = pingPongState.canvas.height - pingPongState.p1.height;
}

function pingPongLoop() {
    if (!pingPongState.running) return;

    updatePingPong();
    drawPingPong();

    pingPongState.animationFrame = requestAnimationFrame(pingPongLoop);
}

// Keyboard Listeners
const keysPressed = {};
window.addEventListener('keydown', (e) => {
    keysPressed[e.key.toLowerCase()] = true;

    // Mode toggle with '/'
    if (e.key === '/') {
        showGame(appState.currentGame === 'pingpong' ? 'chess' : 'pingpong');
    }
});

window.addEventListener('keyup', (e) => {
    keysPressed[e.key.toLowerCase()] = false;
});

function handleKeyControls() {
    if (appState.currentGame !== 'pingpong') return;

    // Player 1: W/S Keys
    if (keysPressed['w']) pingPongState.p1.y -= 7;
    if (keysPressed['s']) pingPongState.p1.y += 7;

    // Player 2: Arrow Keys (for 2 Players mode)
    if (appState.mode === '2-players') {
        if (keysPressed['arrowup']) pingPongState.p2.y -= 7;
        if (keysPressed['arrowdown']) pingPongState.p2.y += 7;
    }
}

function updatePingPong() {
    const { ball, p1, p2, canvas } = pingPongState;
    if (!canvas) return;

    handleKeyControls();

    ball.x += ball.dx;
    ball.y += ball.dy;

    // Paddle Boundaries (Keep them in screen)
    if (p1.y < 0) p1.y = 0;
    if (p1.y > canvas.height - p1.height) p1.y = canvas.height - p1.height;
    if (p2.y < 0) p2.y = 0;
    if (p2.y > canvas.height - p2.height) p2.y = canvas.height - p2.height;

    // Wall bounce
    if (ball.y < 0 || ball.y > canvas.height) ball.dy *= -1;

    // P2 Logic (Computer AI)
    if (appState.mode === 'vs-computer') {
        const p2Center = p2.y + p2.height / 2;
        if (p2Center < ball.y - 35) p2.y += 4.5;
        else if (p2Center > ball.y + 35) p2.y -= 4.5;
    }
    // Player 2 controls are now handled by handleKeyControls for '2-players' mode

    // Collisions
    if (ball.x < 25 && ball.y > p1.y && ball.y < p1.y + p1.height) {
        ball.dx = Math.abs(ball.dx) + 0.2;
    }
    if (ball.x > canvas.width - 25 && ball.y > p2.y && ball.y < p2.y + p2.height) {
        ball.dx = -Math.abs(ball.dx) - 0.2;
    }

    // Scoring
    if (ball.x < 0) {
        p2.score++;
        updateScoreUI();
        resetBall();
    } else if (ball.x > canvas.width) {
        p1.score++;
        updateScoreUI();
        resetBall();
    }
}

function drawPingPong() {
    const { ctx, canvas, ball, p1, p2 } = pingPongState;
    if (!ctx) return;

    // Background
    ctx.fillStyle = '#121826';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Center Dotted Line
    ctx.setLineDash([15, 15]);
    ctx.strokeStyle = '#2d3a4f';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);

    // Watermark Text
    ctx.font = '800 60px Outfit';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.textAlign = 'center';
    ctx.fillText('KRISH PING PONG', canvas.width / 2, canvas.height / 2 + 20);

    // Paddles
    // P1 (Blue Glow)
    ctx.fillStyle = '#3b82f6';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#3b82f6';
    ctx.fillRect(10, p1.y, p1.width, p1.height);

    // P2 (Pink Glow)
    ctx.fillStyle = '#d946ef';
    ctx.shadowColor = '#d946ef';
    ctx.fillRect(canvas.width - 18, p2.y, p2.width, p2.height);

    // Ball
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#22d3ee'; // Cyan ball
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
}

function resetBall() {
    pingPongState.ball.x = 400;
    pingPongState.ball.y = 250;
    pingPongState.ball.dx = (Math.random() > 0.5 ? 4 : -4);
    pingPongState.ball.dy = (Math.random() > 0.5 ? 4 : -4);
}

// --- Chess Logic ---

function initChess() {
    chessState.board = JSON.parse(JSON.stringify(initialBoard));
    chessState.turn = 'white';
    chessState.selectedSquare = null;
    renderBoard();
}

function renderBoard() {
    const boardEl = document.getElementById('chess-board');
    if (!boardEl) return;
    boardEl.innerHTML = '';

    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const square = document.createElement('div');
            square.className = `square ${(r + c) % 2 === 0 ? 'light' : 'dark'}`;

            const piece = chessState.board[r][c];
            if (piece) {
                square.textContent = chessState.pieces[piece];
            }

            if (chessState.selectedSquare && chessState.selectedSquare.r === r && chessState.selectedSquare.c === c) {
                square.classList.add('selected');
            }

            square.onclick = () => handleSquareClick(r, c);
            boardEl.appendChild(square);
        }
    }
}

function handleSquareClick(r, c) {
    const piece = chessState.board[r][c];

    if (chessState.selectedSquare) {
        const { r: sr, c: sc } = chessState.selectedSquare;
        if (sr === r && sc === c) {
            chessState.selectedSquare = null;
        } else {
            // Simple Move
            chessState.board[r][c] = chessState.board[sr][sc];
            chessState.board[sr][sc] = '';
            chessState.selectedSquare = null;
            chessState.turn = chessState.turn === 'white' ? 'black' : 'white';
        }
    } else if (piece) {
        const isWhite = piece === piece.toUpperCase();
        if ((isWhite && chessState.turn === 'white') || (!isWhite && chessState.turn === 'black')) {
            chessState.selectedSquare = { r, c };
        }
    }
    renderBoard();
}

function stopGames() {
    pingPongState.running = false;
    cancelAnimationFrame(pingPongState.animationFrame);
}

// Start initially
window.addEventListener('DOMContentLoaded', () => {
    showGame('pingpong');
});


