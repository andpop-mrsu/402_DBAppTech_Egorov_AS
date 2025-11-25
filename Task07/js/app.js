import Game from './game.js';
import * as db from './db.js';
import Board from './board.js'; // Используем для отрисовки при реплее

// UI Элементы
const els = {
    newGameBtn: document.getElementById('new-game-btn'),
    listBtn: document.getElementById('list-games-btn'),
    boardSize: document.getElementById('board-size'),
    playerName: document.getElementById('player-name'),
    board: document.getElementById('game-board'),
    status: document.getElementById('status-text'),
    list: document.getElementById('games-list')
};

let currentGame = null;
let currentGameId = null;
let isReplaying = false;

// --- Инициализация ---
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await db.initDB();
        els.status.textContent = "Готов к игре. Нажмите 'Новая игра'.";
    } catch (e) {
        console.error(e);
        els.status.textContent = "Ошибка БД.";
    }
});

// --- Обработчики событий ---
els.newGameBtn.addEventListener('click', startNewGame);
els.listBtn.addEventListener('click', toggleGamesList);

// Клик по доске делегируем
els.board.addEventListener('click', (e) => {
    // Если идет реплей или игра не создана - игнор
    if (isReplaying || !currentGame) return;
    
    // Ищем клик по клетке
    const cell = e.target.closest('.cell');
    if (!cell) return;

    const row = parseInt(cell.dataset.r);
    const col = parseInt(cell.dataset.c);
    currentGame.humanMove(row, col);
});

// --- Логика Новой Игры ---
async function startNewGame() {
    if (isReplaying) return;
    
    // Сброс UI
    els.list.style.display = 'none';
    els.listBtn.textContent = 'Список партий (DB)';
    
    const size = parseInt(els.boardSize.value);
    const pName = els.playerName.value || 'Игрок';

    // Создаем визуальное поле
    renderEmptyBoard(size);

    // Инициализируем игру
    currentGame = new Game({
        boardSize: size,
        playerName: pName,
        onStatus: (msg) => els.status.textContent = msg,
        onMove: handleMove,
        onEnd: handleGameEnd
    });

    // Создаем запись в БД
    // Примечание: Мы заранее не знаем, кто X, а кто O, пока игра не создастся
    // Поэтому берем данные из экземпляра игры
    currentGameId = await db.createGameInDB(
        size, 
        currentGame.players['X'].name, 
        currentGame.players['O'].name
    );

    currentGame.start();
}

// Обработка хода (Колбэк из Game)
function handleMove(data) {
    // 1. Обновляем UI
    const cell = document.querySelector(`.cell[data-r="${data.row}"][data-c="${data.col}"]`);
    if (cell) {
        cell.textContent = data.symbol;
        cell.classList.add(data.symbol.toLowerCase());
    }

    // 2. Сохраняем в БД (Только если это реальная игра, а не реплей)
    if (currentGameId && !isReplaying) {
        db.saveMoveToDB(currentGameId, data.symbol, data.row, data.col, data.moveNum);
    }
}

// Обработка конца игры (Колбэк из Game)
function handleGameEnd(result) {
    const msg = result.isDraw ? "Ничья!" : `Победитель: ${result.winnerName}!`;
    els.status.textContent = `Игра окончена. ${msg}`;
    
    if (currentGameId && !isReplaying) {
        db.finalizeGameInDB(currentGameId, result.winnerName, result.isDraw);
    }
    currentGame = null;
    currentGameId = null;
}

// --- Отрисовка ---
function renderEmptyBoard(size) {
    els.board.innerHTML = '';
    els.board.style.gridTemplateColumns = `repeat(${size}, 50px)`;
    
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            const div = document.createElement('div');
            div.className = 'cell';
            div.dataset.r = r;
            div.dataset.c = c;
            els.board.appendChild(div);
        }
    }
}

// --- Список игр и Реплей ---
async function toggleGamesList() {
    if (isReplaying) {
        // Если идет реплей, кнопка работает как "Стоп"
        isReplaying = false;
        return;
    }

    if (els.list.style.display === 'block') {
        els.list.style.display = 'none';
        els.listBtn.textContent = 'Список партий (DB)';
    } else {
        const games = await db.getGamesList();
        renderGamesList(games);
        els.list.style.display = 'block';
        els.listBtn.textContent = 'Скрыть список';
    }
}

function renderGamesList(games) {
    els.list.innerHTML = '';
    if (games.length === 0) {
        els.list.innerHTML = '<div style="padding:10px;">Нет сохраненных игр.</div>';
        return;
    }

    games.forEach(g => {
        const div = document.createElement('div');
        div.className = 'game-record';
        const dateStr = new Date(g.startTime).toLocaleString();
        const res = g.winner ? `Победил ${g.winner}` : (g.isDraw ? 'Ничья' : 'Не закончена');
        div.textContent = `[ID:${g.id}] ${dateStr} - ${g.boardSize}x${g.boardSize} - ${res}`;
        
        div.onclick = () => startReplay(g);
        els.list.appendChild(div);
    });
}

async function startReplay(gameData) {
    isReplaying = true;
    currentGame = null; // Отключаем логику текущей игры
    els.list.style.display = 'none';
    els.listBtn.textContent = 'Остановить просмотр';
    els.newGameBtn.disabled = true;
    
    els.status.textContent = `Воспроизведение игры #${gameData.id}...`;
    renderEmptyBoard(gameData.boardSize);

    const moves = await db.getGameMoves(gameData.id);

    try {
        for (let move of moves) {
            if (!isReplaying) break; // Проверка флага прерывания
            
            await new Promise(r => setTimeout(r, 800)); // Задержка
            
            if (!isReplaying) break; // Повторная проверка

            const cell = document.querySelector(`.cell[data-r="${move.row}"][data-c="${move.col}"]`);
            if (cell) {
                cell.textContent = move.symbol;
                cell.classList.add(move.symbol.toLowerCase());
            }
        }
        if(isReplaying) els.status.textContent = "Воспроизведение завершено.";
    } finally {
        isReplaying = false;
        els.newGameBtn.disabled = false;
        els.listBtn.textContent = 'Список партий (DB)';
    }
}