const DB_NAME = 'TicTacToeDB';
const DB_VERSION = 1;
const GAMES_STORE = 'games';
const MOVES_STORE = 'moves';
let db;

function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
            console.error('Database error:', event.target.error);
            reject('Database error');
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;

            if (!db.objectStoreNames.contains(GAMES_STORE)) {
                const gamesStore = db.createObjectStore(GAMES_STORE, { keyPath: 'id', autoIncrement: true });
                gamesStore.createIndex('startTime', 'startTime', { unique: false });
            }
            if (!db.objectStoreNames.contains(MOVES_STORE)) {
                const movesStore = db.createObjectStore(MOVES_STORE, { keyPath: 'id', autoIncrement: true });
                movesStore.createIndex('gameId', 'gameId', { unique: false });
            }
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            console.log('Database opened successfully.');
            resolve(db);
        };
    });
}

async function createGame(boardSize, playerXName, playerOName) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([GAMES_STORE], 'readwrite');
        const store = transaction.objectStore(GAMES_STORE);
        const game = {
            board_size: boardSize,
            player_x_name: playerXName,
            player_o_name: playerOName,
            start_time: new Date(),
            winner: null,
            draw: false,
        };

        const request = store.add(game);

        request.onsuccess = (event) => {
            resolve(event.target.result); // Возвращает ID новой игры
        };

        request.onerror = (event) => {
            console.error('Error creating game:', event.target.error);
            reject('Error creating game');
        };
    });
}

async function recordMove(gameId, playerSymbol, row, col, moveNumber) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([MOVES_STORE], 'readwrite');
        const store = transaction.objectStore(MOVES_STORE);
        const move = {
            gameId,
            player_symbol: playerSymbol,
            row,
            col,
            move_number: moveNumber,
        };
        const request = store.add(move);
        request.onsuccess = resolve;
        request.onerror = reject;
    });
}

async function endGame(gameId, winnerSymbol, isDraw) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([GAMES_STORE], 'readwrite');
        const store = transaction.objectStore(GAMES_STORE);
        const getRequest = store.get(gameId);

        getRequest.onsuccess = (event) => {
            const game = event.target.result;
            if (game) {
                game.end_time = new Date();
                game.winner = winnerSymbol;
                game.draw = isDraw;

                const updateRequest = store.put(game);
                updateRequest.onsuccess = resolve;
                updateRequest.onerror = reject;
            } else {
                reject('Game not found');
            }
        };
        getRequest.onerror = reject;
    });
}

async function getAllGames() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([GAMES_STORE], 'readonly');
        const store = transaction.objectStore(GAMES_STORE);
        const request = store.getAll();

        request.onsuccess = () => {
            // Сортируем по дате начала (от новых к старым)
            resolve(request.result.sort((a, b) => b.start_time - a.start_time));
        };
        request.onerror = reject;
    });
}

async function getGameDetails(gameId) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([GAMES_STORE], 'readonly');
        const store = transaction.objectStore(GAMES_STORE);
        const request = store.get(gameId);

        request.onsuccess = () => resolve(request.result);
        request.onerror = reject;
    });
}

async function getGameMoves(gameId) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([MOVES_STORE], 'readonly');
        const store = transaction.objectStore(MOVES_STORE);
        const index = store.index('gameId');
        const request = index.getAll(gameId);

        request.onsuccess = () => {
            // Сортируем по номеру хода
            resolve(request.result.sort((a, b) => a.move_number - b.move_number));
        };
        request.onerror = reject;
    });
}

// Экспортируем функции для использования в других модулях
export { initDB, createGame, recordMove, endGame, getAllGames, getGameDetails, getGameMoves };