// Game State Management
let moveTimerId = null; // Timer for player move after dice roll
let currentGame = 'pingPong';
let isMultiplayer = false;

// Ping Pong Game Variables
const pongCanvas = document.getElementById('pongCanvas');
const pongCtx = pongCanvas.getContext('2d');

let pongGameRunning = false;
let animationId = null;

const paddle = {
    width: 12,
    height: 100,
    x: 20,
    y: pongCanvas.height / 2 - 50,
    speed: 8,
    dy: 0
};

const computerPaddle = {
    width: 12,
    height: 100,
    x: pongCanvas.width - 32,
    y: pongCanvas.height / 2 - 50,
    speed: 4
};

const ball = {
    x: pongCanvas.width / 2,
    y: pongCanvas.height / 2,
    radius: 8,
    speed: 5,
    dx: 5,
    dy: 3
};

let playerScore = 0;
let computerScore = 0;

// Ludo Game Variables
const ludoCanvas = document.getElementById('ludoCanvas');
const ludoCtx = ludoCanvas.getContext('2d');

const ludoPlayers = ['red', 'blue', 'green', 'yellow'];
let currentPlayerIndex = 0;
let diceValue = null;
let canRoll = true;

// Grid-based path for Ludo (15x15 grid)
const ludoPath = [
    [6, 0], [6, 1], [6, 2], [6, 3], [6, 4], [6, 5],
    [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6],
    [0, 7], [0, 8], [1, 8], [2, 8], [3, 8], [4, 8], [5, 8],
    [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14],
    [7, 14], [8, 14], [8, 13], [8, 12], [8, 11], [8, 10], [8, 9],
    [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8],
    [14, 7], [14, 6], [13, 6], [12, 6], [11, 6], [10, 6], [9, 6],
    [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0],
    [7, 0]
];

// Home stretch paths
const homePath = {
    red: [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5]],
    blue: [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7]],
    green: [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7]],
    yellow: [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9]]
};

// Points where player enters home stretch
const homeEntryPoints = { red: 51, blue: 12, green: 25, yellow: 38 };

// Start positions on ludoPath for each player
const startIndices = { red: 1, blue: 14, green: 27, yellow: 40 };

// Safe zone indices on ludoPath (cannot be captured)
const safeZones = [1, 9, 14, 22, 27, 35, 40, 48];

let ludoGameState = {
    red: { tokens: [{ pos: -1, type: 'home' }], color: '#ef4444', secondary: '#991b1b', finished: 0 },
    blue: { tokens: [{ pos: -1, type: 'home' }], color: '#3b82f6', secondary: '#1e3a8a', finished: 0 },
    green: { tokens: [{ pos: -1, type: 'home' }], color: '#10b981', secondary: '#064e3b', finished: 0 },
    yellow: { tokens: [{ pos: -1, type: 'home' }], color: '#f59e0b', secondary: '#78350f', finished: 0 }
};

// Re-initialize game state with 4 tokens each
ludoPlayers.forEach(p => {
    ludoGameState[p].tokens = Array(4).fill().map(() => ({ pos: -1, type: 'home' }));
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeGames();
    setupEventListeners();
    drawPongGame();
    drawLudoBoard();
});

// Game Switching
document.addEventListener('keydown', (e) => {
    if (e.key === '/') {
        e.preventDefault();
        switchGame();
    }
});

function switchGame() {
    // Toggle between games
    if (currentGame === 'pingPong') {
        switchToGame('ludo');
    } else {
        switchToGame('pingPong');
    }
}

function switchToGame(gameName) {
    // Stop ping pong if running
    if (pongGameRunning) {
        pongGameRunning = false;
        if (animationId) {
            cancelAnimationFrame(animationId);
        }
    }

    currentGame = gameName;

    // Update UI
    if (gameName === 'pingPong') {
        document.getElementById('ludoGame').classList.remove('active');
        document.getElementById('pingPongGame').classList.add('active');
        document.getElementById('pingPongBtn').classList.add('active');
        document.getElementById('ludoBtn').classList.remove('active');
    } else {
        document.getElementById('pingPongGame').classList.remove('active');
        document.getElementById('ludoGame').classList.add('active');
        document.getElementById('ludoBtn').classList.add('active');
        document.getElementById('pingPongBtn').classList.remove('active');
    }
}

function setGameMode(multiplayer) {
    isMultiplayer = multiplayer;

    // Update button states
    if (multiplayer) {
        document.getElementById('multiplayerMode').classList.add('active');
        document.getElementById('singlePlayerMode').classList.remove('active');
        document.getElementById('player1Label').textContent = 'Player 1';
        document.getElementById('player2Label').textContent = 'Player 2';
        document.getElementById('pongControls').textContent = 'Player 1: W/S keys | Player 2: ↑/↓ arrow keys';
    } else {
        document.getElementById('singlePlayerMode').classList.add('active');
        document.getElementById('multiplayerMode').classList.remove('active');
        document.getElementById('player1Label').textContent = 'Player 1';
        document.getElementById('player2Label').textContent = 'Computer';
        document.getElementById('pongControls').textContent = 'Player 1: W/S keys | Computer: Auto';
    }

    // Reset game if running
    if (pongGameRunning) {
        resetPongGame();
    }
}

// Event Listeners Setup
function setupEventListeners() {
    // Game icon buttons
    document.getElementById('pingPongBtn').addEventListener('click', () => switchToGame('pingPong'));
    document.getElementById('ludoBtn').addEventListener('click', () => switchToGame('ludo'));

    // Ping Pong Controls
    document.getElementById('startPong').addEventListener('click', startPongGame);
    document.getElementById('resetPong').addEventListener('click', resetPongGame);
    document.getElementById('fullscreenBtn').addEventListener('click', toggleFullscreen);

    // Mode selector
    document.getElementById('singlePlayerMode').addEventListener('click', () => setGameMode(false));
    document.getElementById('multiplayerMode').addEventListener('click', () => setGameMode(true));

    // Ludo Controls
    document.getElementById('rollDice').addEventListener('click', rollDice);
    document.getElementById('resetLudo').addEventListener('click', resetLudoGame);

    // Keyboard controls for ping pong
    document.addEventListener('keydown', handlePongKeyDown);
    document.addEventListener('keyup', handlePongKeyUp);

    // Mouse click for ludo
    ludoCanvas.addEventListener('click', handleLudoClick);
}

function initializeGames() {
    // Show ping pong by default
    document.getElementById('pingPongGame').classList.add('active');
}

// ==================== PING PONG GAME ====================

function handlePongKeyDown(e) {
    if (!pongGameRunning) return;

    // Player 1 controls (W/S)
    if (e.key === 'w' || e.key === 'W') {
        paddle.dy = -paddle.speed;
    } else if (e.key === 's' || e.key === 'S') {
        paddle.dy = paddle.speed;
    }

    // Player 2 controls (Arrow keys) - only in multiplayer
    if (isMultiplayer) {
        if (e.key === 'ArrowUp') {
            computerPaddle.dy = -computerPaddle.speed;
        } else if (e.key === 'ArrowDown') {
            computerPaddle.dy = computerPaddle.speed;
        }
    }
}

function handlePongKeyUp(e) {
    // Player 1
    if (e.key === 'w' || e.key === 'W' || e.key === 's' || e.key === 'S') {
        paddle.dy = 0;
    }

    // Player 2 (multiplayer only)
    if (isMultiplayer) {
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            computerPaddle.dy = 0;
        }
    }
}

function startPongGame() {
    if (!pongGameRunning) {
        pongGameRunning = true;
        gameLoop();
    }
}

function resetPongGame() {
    pongGameRunning = false;
    if (animationId) {
        cancelAnimationFrame(animationId);
    }

    // Reset positions
    paddle.y = pongCanvas.height / 2 - 50;
    computerPaddle.y = pongCanvas.height / 2 - 50;
    ball.x = pongCanvas.width / 2;
    ball.y = pongCanvas.height / 2;
    ball.dx = 5;
    ball.dy = 3;

    // Reset scores
    playerScore = 0;
    computerScore = 0;
    updateScore();

    drawPongGame();
}

function toggleFullscreen() {
    const elem = document.documentElement;

    if (!document.fullscreenElement) {
        // Enter fullscreen
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) { /* Safari */
            elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) { /* IE11 */
            elem.msRequestFullscreen();
        }
    } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) { /* Safari */
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) { /* IE11 */
            document.msExitFullscreen();
        }
    }
}

function gameLoop() {
    if (!pongGameRunning) return;

    update();
    drawPongGame();

    animationId = requestAnimationFrame(gameLoop);
}

function update() {
    // Move paddle
    paddle.y += paddle.dy;

    // Paddle boundaries
    if (paddle.y < 0) paddle.y = 0;
    if (paddle.y + paddle.height > pongCanvas.height) {
        paddle.y = pongCanvas.height - paddle.height;
    }

    // Move ball
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Ball collision with top and bottom
    if (ball.y - ball.radius < 0 || ball.y + ball.radius > pongCanvas.height) {
        ball.dy *= -1;
    }

    // Ball collision with paddles
    if (ball.x - ball.radius < paddle.x + paddle.width &&
        ball.y > paddle.y && ball.y < paddle.y + paddle.height) {
        ball.dx = Math.abs(ball.dx);
        ball.dx *= 1.05; // Speed up slightly
    }

    if (ball.x + ball.radius > computerPaddle.x &&
        ball.y > computerPaddle.y && ball.y < computerPaddle.y + computerPaddle.height) {
        ball.dx = -Math.abs(ball.dx);
        ball.dx *= 1.05; // Speed up slightly
    }

    // Computer AI (only in single player mode)
    if (!isMultiplayer) {
        if (computerPaddle.y + computerPaddle.height / 2 < ball.y) {
            computerPaddle.y += computerPaddle.speed;
        } else {
            computerPaddle.y -= computerPaddle.speed;
        }
    } else {
        // In multiplayer, move based on player input
        computerPaddle.y += computerPaddle.dy;
    }

    // Computer/Player 2 paddle boundaries
    if (computerPaddle.y < 0) computerPaddle.y = 0;
    if (computerPaddle.y + computerPaddle.height > pongCanvas.height) {
        computerPaddle.y = pongCanvas.height - computerPaddle.height;
    }

    // Scoring
    if (ball.x - ball.radius < 0) {
        computerScore++;
        updateScore();
        resetBall();
    }

    if (ball.x + ball.radius > pongCanvas.width) {
        playerScore++;
        updateScore();
        resetBall();
    }
}

function resetBall() {
    ball.x = pongCanvas.width / 2;
    ball.y = pongCanvas.height / 2;
    ball.dx = (Math.random() > 0.5 ? 1 : -1) * 5;
    ball.dy = (Math.random() * 6 - 3);
}

function drawPongGame() {
    // Clear canvas
    pongCtx.fillStyle = 'rgba(15, 23, 42, 0.6)';
    pongCtx.fillRect(0, 0, pongCanvas.width, pongCanvas.height);

    // Draw "KRISH PING PONG" text on canvas
    pongCtx.save();
    pongCtx.font = 'bold 60px Outfit, sans-serif';
    pongCtx.fillStyle = 'rgba(99, 102, 241, 0.1)';
    pongCtx.textAlign = 'center';
    pongCtx.textBaseline = 'middle';
    pongCtx.fillText('KRISH PING PONG', pongCanvas.width / 2, pongCanvas.height / 2);
    pongCtx.restore();

    // Draw center line
    pongCtx.strokeStyle = 'rgba(99, 102, 241, 0.3)';
    pongCtx.lineWidth = 2;
    pongCtx.setLineDash([10, 10]);
    pongCtx.beginPath();
    pongCtx.moveTo(pongCanvas.width / 2, 0);
    pongCtx.lineTo(pongCanvas.width / 2, pongCanvas.height);
    pongCtx.stroke();
    pongCtx.setLineDash([]);

    // Draw player paddle with glow
    pongCtx.shadowBlur = 15;
    pongCtx.shadowColor = '#3b82f6';
    pongCtx.fillStyle = '#3b82f6';
    pongCtx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);

    // Draw computer paddle with glow
    pongCtx.shadowColor = '#ef4444';
    pongCtx.fillStyle = '#ef4444';
    pongCtx.fillRect(computerPaddle.x, computerPaddle.y, computerPaddle.width, computerPaddle.height);

    // Draw ball with glow
    pongCtx.shadowBlur = 20;
    pongCtx.shadowColor = '#14b8a6';
    pongCtx.fillStyle = '#14b8a6';
    pongCtx.beginPath();
    pongCtx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    pongCtx.fill();

    // Reset shadow
    pongCtx.shadowBlur = 0;
}

function updateScore() {
    document.getElementById('playerScore').textContent = playerScore;
    document.getElementById('computerScore').textContent = computerScore;
}

// ==================== LUDO GAME ====================

function rollDice() {
    if (!canRoll) return;

    const dice = document.getElementById('dice');
    const diceValueEl = document.getElementById('diceValue');

    // Animate dice roll
    dice.classList.add('rolling');
    diceValueEl.textContent = '?';
    canRoll = false;

    setTimeout(() => {
        diceValue = Math.floor(Math.random() * 6) + 1;
        diceValueEl.textContent = diceValue;
        dice.classList.remove('rolling');

        // Check if player has any possible moves
        const possibleMoves = getPossibleMoves();
        if (possibleMoves.length === 0) {
            setTimeout(() => {
                nextTurn();
            }, 1000);
        } else if (possibleMoves.length === 1 && diceValue !== 6) {
            // Auto-move if only one option and not a 6 (user choice usually better on 6)
            setTimeout(() => {
                moveToken(playerColor, possibleMoves[0].index, diceValue);
            }, 800);
        }
        // Timer removed as per user request
    }, 500);

}

function getPossibleMoves() {
    const playerColor = ludoPlayers[currentPlayerIndex];
    const tokens = ludoGameState[playerColor].tokens;
    const moves = [];

    tokens.forEach((t, i) => {
        if (t.type === 'home' && diceValue === 6) {
            moves.push({ index: i, type: 'home' });
        } else if (t.type === 'path') {
            moves.push({ index: i, type: 'path' });
        } else if (t.type === 'homeStretch' && t.pos + diceValue <= 5) {
            moves.push({ index: i, type: 'homeStretch' });
        }
    });

    return moves;
}

function hasPathMoves() {
    return getPossibleMoves().length > 0;
}

function nextTurn() {
    // When moving to next turn, clear any pending move timer
    clearTimeout(moveTimerId);
    moveTimerId = null;
    currentPlayerIndex = (currentPlayerIndex + 1) % 4;
    diceValue = null;
    canRoll = true;
    document.getElementById('diceValue').textContent = '?';
    updateCurrentPlayerDisplay();
    drawLudoBoard();
}

function updateCurrentPlayerDisplay() {
    const currentPlayerEl = document.getElementById('currentPlayer');
    const playerName = ludoPlayers[currentPlayerIndex];
    currentPlayerEl.textContent = playerName.charAt(0).toUpperCase() + playerName.slice(1);
    currentPlayerEl.style.background = `var(--${playerName}-player)`;
    currentPlayerEl.style.color = 'white';

    // Update status items
    document.querySelectorAll('.status-item').forEach((item, index) => {
        if (index === currentPlayerIndex) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

function handleLudoClick(e) {
    if (!diceValue || canRoll) return;

    const rect = ludoCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const cellSize = ludoCanvas.width / 15;
    const gridX = Math.floor(x / cellSize);
    const gridY = Math.floor(y / cellSize);

    const playerColor = ludoPlayers[currentPlayerIndex];
    const tokens = ludoGameState[playerColor].tokens;

    // 1. Check home area click
    const homeAreas = {
        red: { x1: 0, y1: 0, x2: 5, y2: 5 },
        blue: { x1: 9, y1: 0, x2: 14, y2: 5 },
        green: { x1: 0, y1: 9, x2: 5, y2: 14 },
        yellow: { x1: 9, y1: 9, x2: 14, y2: 14 }
    };

    const area = homeAreas[playerColor];
    if (gridX >= area.x1 && gridX <= area.x2 && gridY >= area.y1 && gridY <= area.y2) {
        if (diceValue === 6) {
            // Move first available token from home to start
            for (let t of tokens) {
                if (t.pos === -1) {
                    t.pos = startIndices[playerColor];
                    nextTurn();
                    return;
                }
            }
        }
    }

    // 2. Check path clicks
    for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i];
        if (t.pos >= 0 && t.type !== 'win') {
            let coords;
            if (t.type === 'path') coords = ludoPath[t.pos];
            else coords = homePath[playerColor][t.pos];

            if (gridX === coords[0] && gridY === coords[1]) {
                moveToken(playerColor, i, diceValue);
                return;
            }
        }
    }
}

function moveToken(player, tokenIndex, steps) {
    const state = ludoGameState[player];
    const token = state.tokens[tokenIndex];
    let extraTurn = (diceValue === 6);

    if (token.type === 'home') {
        token.pos = startIndices[player];
        token.type = 'path';
    } else if (token.type === 'path') {
        // Calculate steps until entry point
        const entryPoint = homeEntryPoints[player];

        // This is a bit complex due to circular path
        // We calculate total distance from start
        let currentIdx = token.pos;
        let remaining = steps;

        while (remaining > 0) {
            if (currentIdx === entryPoint) {
                token.type = 'homeStretch';
                token.pos = remaining - 1;
                remaining = 0;
            } else {
                currentIdx = (currentIdx + 1) % 52;
                remaining--;
                if (remaining === 0) token.pos = currentIdx;
            }
        }

        // Check winner logic in home stretch
        if (token.type === 'homeStretch' && token.pos >= 5) {
            if (token.pos === 5) {
                token.type = 'win';
                state.finished++;
                extraTurn = true;
                checkVictory(player);
            } else {
                // Invalid move - overshot
                token.type = 'path'; // rollback or just don't move
                // Simple logic: if overshot, don't move
                return;
            }
        }
    } else if (token.type === 'homeStretch') {
        if (token.pos + steps <= 5) {
            token.pos += steps;
            if (token.pos === 5) {
                token.type = 'win';
                state.finished++;
                extraTurn = true;
                checkVictory(player);
            }
        } else {
            return; // overshoot
        }
    }

    // Capture logic ONLY for tokens on common path
    if (token.type === 'path' && !safeZones.includes(token.pos)) {
        if (captureToken(player, token.pos)) {
            extraTurn = true;
        }
    }

    // Clear the move timer because player has acted
    clearTimeout(moveTimerId);
    moveTimerId = null;

    if (extraTurn) {
        canRoll = true;
        diceValue = null;
        document.getElementById('diceValue').textContent = '?';
        drawLudoBoard();
    } else {
        nextTurn();
    }
}

function captureToken(movingPlayer, pos) {
    let captured = false;
    ludoPlayers.forEach(p => {
        if (p !== movingPlayer) {
            ludoGameState[p].tokens.forEach(t => {
                if (t.pos === pos && t.type === 'path') {
                    t.pos = -1;
                    t.type = 'home';
                    captured = true;
                }
            });
        }
    });
    return captured;
}

function checkVictory(player) {
    if (ludoGameState[player].finished === 4) {
        alert("👑 " + player.toUpperCase() + " WINS LUDO KING! 👑");
        resetLudoGame();
    }
}

function resetLudoGame() {
    currentPlayerIndex = 0;
    diceValue = null;
    canRoll = true;
    document.getElementById('diceValue').textContent = '?';

    // Reset game state
    ludoGameState = {
        red: { tokens: [{ pos: -1 }, { pos: -1 }, { pos: -1 }, { pos: -1 }], color: '#ef4444', secondary: '#991b1b' },
        blue: { tokens: [{ pos: -1 }, { pos: -1 }, { pos: -1 }, { pos: -1 }], color: '#3b82f6', secondary: '#1e3a8a' },
        green: { tokens: [{ pos: -1 }, { pos: -1 }, { pos: -1 }, { pos: -1 }], color: '#10b981', secondary: '#064e3b' },
        yellow: { tokens: [{ pos: -1 }, { pos: -1 }, { pos: -1 }, { pos: -1 }], color: '#f59e0b', secondary: '#78350f' }
    };

    updateCurrentPlayerDisplay();
    drawLudoBoard();
}

function drawLudoBoard() {
    ludoCtx.clearRect(0, 0, ludoCanvas.width, ludoCanvas.height);
    const cellSize = ludoCanvas.width / 15;

    // Draw background grid
    ludoCtx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ludoCtx.lineWidth = 1;
    for (let i = 0; i <= 15; i++) {
        ludoCtx.beginPath();
        ludoCtx.moveTo(i * cellSize, 0);
        ludoCtx.lineTo(i * cellSize, ludoCanvas.height);
        ludoCtx.stroke();
        ludoCtx.beginPath();
        ludoCtx.moveTo(0, i * cellSize);
        ludoCtx.lineTo(ludoCanvas.width, i * cellSize);
        ludoCtx.stroke();
    }

    // Draw Main Path (WHITE as requested)
    ludoCtx.fillStyle = 'rgba(255, 255, 255, 0.8)'; // Explicit white path with higher opacity
    ludoPath.forEach(coords => {
        ludoCtx.fillRect(coords[0] * cellSize + 1, coords[1] * cellSize + 1, cellSize - 2, cellSize - 2);
    });

    const homeSize = cellSize * 6;
    const areas = [
        { color: '#ef4444', x: 0, y: 0, name: 'red' },
        { color: '#3b82f6', x: cellSize * 9, y: 0, name: 'blue' },
        { color: '#10b981', x: 0, y: cellSize * 9, name: 'green' },
        { color: '#f59e0b', x: cellSize * 9, y: cellSize * 9, name: 'yellow' }
    ];

    areas.forEach(area => {
        // Draw main home area with gradient
        const grad = ludoCtx.createRadialGradient(
            area.x + homeSize / 2, area.y + homeSize / 2, 0,
            area.x + homeSize / 2, area.y + homeSize / 2, homeSize
        );
        grad.addColorStop(0, area.color + '44');
        grad.addColorStop(1, area.color + '11');

        ludoCtx.fillStyle = grad;
        ludoCtx.fillRect(area.x, area.y, homeSize, homeSize);
        ludoCtx.strokeStyle = area.color;
        ludoCtx.lineWidth = 4;
        ludoCtx.strokeRect(area.x, area.y, homeSize, homeSize);

        // Inner white circle for tokens
        ludoCtx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ludoCtx.beginPath();
        ludoCtx.arc(area.x + homeSize / 2, area.y + homeSize / 2, homeSize * 0.4, 0, Math.PI * 2);
        ludoCtx.fill();

        // Draw tokens in home area
        const state = ludoGameState[area.name];
        const tokenOffsets = [
            { dx: -0.2, dy: -0.2 }, { dx: 0.2, dy: -0.2 },
            { dx: -0.2, dy: 0.2 }, { dx: 0.2, dy: 0.2 }
        ];

        state.tokens.forEach((t, i) => {
            if (t.pos === -1) {
                const tx = area.x + homeSize / 2 + tokenOffsets[i].dx * homeSize;
                const ty = area.y + homeSize / 2 + tokenOffsets[i].dy * homeSize;
                drawPawn(tx, ty, area.color, cellSize * 0.45);
            }
        });
    });

    // Draw safe zones (Stars) - Use a darker color for visibility on white path
    safeZones.forEach(idx => {
        const coords = ludoPath[idx];
        drawStar(coords[0] * cellSize + cellSize / 2, coords[1] * cellSize + cellSize / 2, cellSize * 0.35, 'rgba(0, 0, 0, 0.5)');
    });

    // Highlight path colors for starts
    const startColors = { 1: '#ef4444', 14: '#3b82f6', 27: '#10b981', 40: '#f59e0b' };
    ludoPath.forEach((coords, i) => {
        if (startColors[i]) {
            ludoCtx.fillStyle = startColors[i]; // Solid color for start cells
            ludoCtx.fillRect(coords[0] * cellSize + 1, coords[1] * cellSize + 1, cellSize - 2, cellSize - 2);
        }
    });

    // Draw active path tokens
    ludoPlayers.forEach(pName => {
        const state = ludoGameState[pName];
        state.tokens.forEach(t => {
            if (t.pos >= 0 && t.type !== 'win') {
                let coords;
                if (t.type === 'path') coords = ludoPath[t.pos];
                else coords = homePath[pName][t.pos];

                const cx = coords[0] * cellSize + cellSize / 2;
                const cy = coords[1] * cellSize + cellSize / 2;
                drawPawn(cx, cy, state.color, cellSize * 0.45);
            }
        });
    });

    // Draw Home Stretch Paths
    ludoPlayers.forEach(pName => {
        const hPath = homePath[pName];
        const color = ludoGameState[pName].color;
        hPath.forEach((coords, i) => {
            // Draw white base first for better color pop
            ludoCtx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ludoCtx.fillRect(coords[0] * cellSize + 1, coords[1] * cellSize + 1, cellSize - 2, cellSize - 2);

            // Draw colored cell
            ludoCtx.fillStyle = color;
            ludoCtx.fillRect(coords[0] * cellSize + 1, coords[1] * cellSize + 1, cellSize - 2, cellSize - 2);
        });

        // Draw Arrow at the end of home stretch
        const lastCell = hPath[hPath.length - 1]; // The cell just before center
        const arrowX = lastCell[0] * cellSize + cellSize / 2;
        const arrowY = lastCell[1] * cellSize + cellSize / 2;

        ludoCtx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ludoCtx.beginPath();

        // Determine direction based on player
        if (pName === 'red') { // Top, points Down
            ludoCtx.moveTo(arrowX - 5, arrowY - 5);
            ludoCtx.lineTo(arrowX + 5, arrowY - 5);
            ludoCtx.lineTo(arrowX, arrowY + 5);
        } else if (pName === 'blue') { // Right, points Left (Wait, Blue is Right side, enters from Right, points Left)
            ludoCtx.moveTo(arrowX + 5, arrowY - 5);
            ludoCtx.lineTo(arrowX + 5, arrowY + 5);
            ludoCtx.lineTo(arrowX - 5, arrowY);
        } else if (pName === 'green') { // Left, points Right
            ludoCtx.moveTo(arrowX - 5, arrowY - 5);
            ludoCtx.lineTo(arrowX - 5, arrowY + 5);
            ludoCtx.lineTo(arrowX + 5, arrowY);
        } else if (pName === 'yellow') { // Bottom, points Up
            ludoCtx.moveTo(arrowX - 5, arrowY + 5);
            ludoCtx.lineTo(arrowX + 5, arrowY + 5);
            ludoCtx.lineTo(arrowX, arrowY - 5);
        }
        ludoCtx.fill();
    });

    // Draw Center
    const centerSize = cellSize * 3;
    const cx = cellSize * 6;
    const cy = cellSize * 6;
    ludoCtx.fillStyle = 'white';
    ludoCtx.fillRect(cx, cy, centerSize, centerSize);

    // Center Triangles
    const triColors = ['#ef4444', '#3b82f6', '#f59e0b', '#10b981']; // Red, Blue, Yellow, Green
    const pts = [
        [[cx, cy], [cx + centerSize / 2, cy + centerSize / 2], [cx + centerSize, cy]],
        [[cx + centerSize, cy], [cx + centerSize / 2, cy + centerSize / 2], [cx + centerSize, cy + centerSize]],
        [[cx + centerSize, cy + centerSize], [cx + centerSize / 2, cy + centerSize / 2], [cx, cy + centerSize]],
        [[cx, cy + centerSize], [cx + centerSize / 2, cy + centerSize / 2], [cx, cy]]
    ];

    pts.forEach((pt, i) => {
        ludoCtx.fillStyle = triColors[i];
        ludoCtx.beginPath();
        ludoCtx.moveTo(pt[0][0], pt[0][1]);
        ludoCtx.lineTo(pt[1][0], pt[1][1]);
        ludoCtx.lineTo(pt[2][0], pt[2][1]);
        ludoCtx.fill();
    });
}

function drawPawn(x, y, color, radius) {
    ludoCtx.save();

    // Bottom shadow
    ludoCtx.shadowBlur = 10;
    ludoCtx.shadowColor = 'rgba(0,0,0,0.5)';
    ludoCtx.shadowOffsetY = 4;

    // Base circle (3D effect)
    ludoCtx.fillStyle = 'rgba(0,0,0,0.3)';
    ludoCtx.beginPath();
    ludoCtx.arc(x, y + 2, radius, 0, Math.PI * 2);
    ludoCtx.fill();

    // Main body
    const grad = ludoCtx.createRadialGradient(x - radius / 3, y - radius / 3, 0, x, y, radius);
    grad.addColorStop(0, 'white');
    grad.addColorStop(0.2, color);
    grad.addColorStop(1, 'black');

    ludoCtx.fillStyle = grad;
    ludoCtx.beginPath();
    ludoCtx.arc(x, y, radius, 0, Math.PI * 2);
    ludoCtx.fill();

    // Shine/Highlight
    ludoCtx.fillStyle = 'rgba(255,255,255,0.4)';
    ludoCtx.beginPath();
    ludoCtx.arc(x - radius / 3, y - radius / 3, radius / 3, 0, Math.PI * 2);
    ludoCtx.fill();

    // Border
    ludoCtx.strokeStyle = 'white';
    ludoCtx.lineWidth = 2;
    ludoCtx.stroke();

    ludoCtx.restore();
}

function drawStar(x, y, radius, color) {
    ludoCtx.save();
    ludoCtx.fillStyle = color;
    ludoCtx.beginPath();
    for (let i = 0; i < 5; i++) {
        ludoCtx.lineTo(Math.cos((18 + i * 72) / 180 * Math.PI) * radius + x,
            -Math.sin((18 + i * 72) / 180 * Math.PI) * radius + y);
        ludoCtx.lineTo(Math.cos((54 + i * 72) / 180 * Math.PI) * radius * 0.5 + x,
            -Math.sin((54 + i * 72) / 180 * Math.PI) * radius * 0.5 + y);
    }
    ludoCtx.closePath();
    ludoCtx.fill();
    ludoCtx.restore();
}

// Initialize current player display
updateCurrentPlayerDisplay();
