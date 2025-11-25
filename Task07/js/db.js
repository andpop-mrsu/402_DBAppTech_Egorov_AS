const DB_NAME = 'TicTacToeDB_Task07';
const DB_VERSION = 1;
const STORES = {
    GAMES: 'games',
    MOVES: 'moves'
};

let db = null;

export function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(STORES.GAMES)) {
                db.createObjectStore(STORES.GAMES, { keyPath: 'id', autoIncrement: true });
            }
            if (!db.objectStoreNames.contains(STORES.MOVES)) {
                const movesStore = db.createObjectStore(STORES.MOVES, { keyPath: 'id', autoIncrement: true });
                movesStore.createIndex('gameId', 'gameId', { unique: false });
            }
        };

        request.onsuccess = (e) => {
            db = e.target.result;
            console.log('DB Initialized');
            resolve(db);
        };

        request.onerror = (e) => reject(e.target.error);
    });
}

// Создание новой записи об игре
export async function createGameInDB(boardSize, playerX, playerO) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction([STORES.GAMES], 'readwrite');
        const store = tx.objectStore(STORES.GAMES);
        const game = {
            boardSize,
            playerX,
            playerO,
            startTime: new Date(),
            winner: null,
            isDraw: false
        };
        const req = store.add(game);
        req.onsuccess = (e) => resolve(e.target.result); // Возвращает ID
        req.onerror = () => reject('Error creating game');
    });
}

// Запись хода
export async function saveMoveToDB(gameId, symbol, row, col, moveNumber) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction([STORES.MOVES], 'readwrite');
        const store = tx.objectStore(STORES.MOVES);
        const move = { gameId, symbol, row, col, moveNumber };
        store.add(move).onsuccess = resolve;
        store.onerror = reject;
    });
}

// Обновление результата игры
export async function finalizeGameInDB(gameId, winner, isDraw) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction([STORES.GAMES], 'readwrite');
        const store = tx.objectStore(STORES.GAMES);
        
        store.get(gameId).onsuccess = (e) => {
            const data = e.target.result;
            if (data) {
                data.winner = winner;
                data.isDraw = isDraw;
                data.endTime = new Date();
                store.put(data).onsuccess = resolve;
            } else {
                reject('Game not found');
            }
        };
    });
}

// Получение списка игр
export async function getGamesList() {
    return new Promise((resolve) => {
        const tx = db.transaction([STORES.GAMES], 'readonly');
        const store = tx.objectStore(STORES.GAMES);
        store.getAll().onsuccess = (e) => {
            // Сортировка: новые сверху
            resolve(e.target.result.sort((a, b) => b.startTime - a.startTime));
        };
    });
}

// Получение ходов конкретной игры
export async function getGameMoves(gameId) {
    return new Promise((resolve) => {
        const tx = db.transaction([STORES.MOVES], 'readonly');
        const store = tx.objectStore(STORES.MOVES);
        const index = store.index('gameId');
        index.getAll(gameId).onsuccess = (e) => {
            resolve(e.target.result.sort((a, b) => a.moveNumber - b.moveNumber));
        };
    });
}