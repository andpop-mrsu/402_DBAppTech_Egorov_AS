import Game from './game.js';
import Board from './board.js';
import * as db from './db.js';

// --- DOM элементы ---
const newGameBtn = document.getElementById('new-game-btn');
const listGamesBtn = document.getElementById('list-games-btn');
const boardSizeSelect = document.getElementById('board-size');
const playerNameInput = document.getElementById('player-name');
const gameBoardDiv = document.getElementById('game-board');
const statusText = document.getElementById('status-text');
const gamesListDiv = document.getElementById('games-list');

let currentGame = null;
let isReplaying = false; // Флаг для отслеживания состояния повтора

// --- UI Управление ---
const UI = {
    renderBoard(board) {
        gameBoardDiv.innerHTML = '';
        const size = board.getSize();
        gameBoardDiv.style.gridTemplateColumns = `repeat(${size}, 50px)`;
        
        for (let row = 0; row < size; row++) {
            for (let col = 0; col < size; col++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                const symbol = board.getCell(row, col);
                if (symbol !== ' ') {
                    cell.textContent = symbol;
                    cell.classList.add(symbol.toLowerCase());
                }
                cell.dataset.row = row;
                cell.dataset.col = col;
                gameBoardDiv.appendChild(cell);
            }
        }
    },
    updateStatus(message) {
        statusText.textContent = message;
    },
    async displayGamesList() {
        const games = await db.getAllGames();
        if (games.length === 0) {
            gamesListDiv.innerHTML = '<p>Сохраненных игр нет.</p>';
            return;
        }

        const ul = document.createElement('ul');
        games.forEach(game => {
            const li = document.createElement('li');
            const winner = game.winner ? `Победитель: ${game.winner}` : (game.draw ? 'Ничья' : 'Не закончена');
            li.textContent = `ID: ${game.id} | ${new Date(game.start_time).toLocaleString()} | ${game.player_x_name} vs ${game.player_o_name} | ${winner}`;
            li.dataset.gameId = game.id;
            li.addEventListener('click', () => {
                if (!isReplaying) {
                   replayGame(game.id);
                }
            });
            ul.appendChild(li);
        });
        gamesListDiv.innerHTML = '';
        gamesListDiv.appendChild(ul);
    }
};

// --- Сброс состояния и UI ---
function resetStateAndUI() {
    isReplaying = false;
    newGameBtn.disabled = false;
    listGamesBtn.disabled = false;
    listGamesBtn.textContent = 'Показать список игр';
    gamesListDiv.style.display = 'none';
    UI.updateStatus('Начните новую игру или просмотрите историю.');
    // Очищаем поле, создавая пустое поле того же размера, что выбрано в селекте
    const currentSize = parseInt(boardSizeSelect.value, 10);
    UI.renderBoard(new Board(currentSize));
}

// --- Обработчики событий ---
newGameBtn.addEventListener('click', () => {
    if (isReplaying) return;
    
    const boardSize = parseInt(boardSizeSelect.value, 10);
    const playerName = playerNameInput.value || 'Игрок';
    
    gamesListDiv.style.display = 'none';
    listGamesBtn.textContent = 'Показать список игр';
    
    currentGame = new Game(boardSize, playerName, UI);
    const initialBoard = new Board(boardSize);
    UI.renderBoard(initialBoard);
    currentGame.start();
});

gameBoardDiv.addEventListener('click', (event) => {
    if (isReplaying || !currentGame || !event.target.classList.contains('cell')) {
        return;
    }
    const row = parseInt(event.target.dataset.row, 10);
    const col = parseInt(event.target.dataset.col, 10);
    currentGame.handleHumanMove(row, col);
});

listGamesBtn.addEventListener('click', () => {
    // NEW: Если идет повтор, кнопка "Назад" его прерывает
    if (isReplaying) {
        isReplaying = false; // Устанавливаем флаг, чтобы цикл в replayGame прервался
        // Дальнейшая очистка произойдет в блоке finally функции replayGame
        return;
    }

    const isVisible = gamesListDiv.style.display === 'block';
    
    if (isVisible) {
        gamesListDiv.style.display = 'none';
        listGamesBtn.textContent = 'Показать список игр';
    } else {
        UI.displayGamesList();
        gamesListDiv.style.display = 'block';
        listGamesBtn.textContent = 'Назад';
    }
});

// --- Логика повтора игры ---
async function replayGame(gameId) {
    isReplaying = true;
    newGameBtn.disabled = true;
    listGamesBtn.textContent = 'Прервать повтор'; // Меняем текст на время повтора
    listGamesBtn.disabled = false; // Кнопка должна быть активна для прерывания
    currentGame = null;

    UI.updateStatus(`Повтор игры #${gameId}...`);
    
    const gameDetails = await db.getGameDetails(gameId);
    const moves = await db.getGameMoves(gameId);

    try {
        if (!gameDetails || moves.length === 0) {
            UI.updateStatus('Не удалось загрузить данные для повтора.');
            return; // Выходим, блок finally все равно выполнится
        }

        const replayBoard = new Board(gameDetails.board_size);
        UI.renderBoard(replayBoard);

        for (let i = 0; i < moves.length; i++) {
            // NEW: Проверяем флаг перед каждым ходом. Если он false, прерываем цикл.
            if (!isReplaying) {
                UI.updateStatus('Повтор прерван пользователем.');
                break;
            }
            
            await new Promise(resolve => setTimeout(resolve, 800));
            
            // NEW: Повторно проверяем флаг после задержки, на случай если нажали во время паузы
            if (!isReplaying) {
                UI.updateStatus('Повтор прерван пользователем.');
                break;
            }
            
            const move = moves[i];
            replayBoard.setCell(move.row, move.col, move.player_symbol);
            UI.renderBoard(replayBoard);
            UI.updateStatus(`Ход ${i + 1}: ${move.player_symbol} на (${move.row + 1}, ${move.col + 1})`);
        }

        // Этот код выполнится, только если повтор не был прерван
        if (isReplaying) {
            const finalStatus = gameDetails.winner ? `Победил ${gameDetails.winner}!` : (gameDetails.draw ? 'Ничья!' : 'Игра не завершена.');
            UI.updateStatus(`Повтор окончен. ${finalStatus}`);
        }

    } catch (error) {
        console.error("Ошибка во время повтора игры:", error);
        UI.updateStatus("Произошла ошибка во время повтора.");
    } finally {
        // NEW: Этот блок выполнится всегда: и после завершения, и после прерывания
        isReplaying = false;
        newGameBtn.disabled = false;
        listGamesBtn.textContent = 'Назад'; // Оставляем "Назад", т.к. список игр все еще виден
    }
}

// --- Инициализация ---
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await db.initDB();
        UI.updateStatus('База данных готова. Начните новую игру.');
    } catch (error) {
        UI.updateStatus('Ошибка инициализации базы данных.');
        console.error(error);
    }
});