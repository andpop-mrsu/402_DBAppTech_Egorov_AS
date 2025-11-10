import Board from './board.js';
import { HumanPlayer, ComputerPlayer } from './player.js';
import * as db from './db.js';

export default class Game {
    constructor(boardSize, humanName, ui) {
        this.board = new Board(boardSize);
        this.ui = ui; // Передаем UI для обновления
        this.moveNumber = 0;
        this.gameId = null;

        const humanSymbol = Math.random() < 0.5 ? 'X' : 'O';
        const computerSymbol = humanSymbol === 'X' ? 'O' : 'X';
        
        this.humanPlayer = new HumanPlayer(humanSymbol, humanName);
        this.computerPlayer = new ComputerPlayer(computerSymbol, 'Компьютер');
        
        this.players = {
            'X': humanSymbol === 'X' ? this.humanPlayer : this.computerPlayer,
            'O': humanSymbol === 'O' ? this.humanPlayer : this.computerPlayer
        };
        
        this.currentPlayerSymbol = 'X'; // X всегда ходит первым
        this.isGameOver = false;
    }

    async start() {
        this.ui.updateStatus(`Вы играете за ${this.humanPlayer.getSymbol()}. Ход игрока ${this.currentPlayerSymbol}.`);
        this.gameId = await db.createGame(
            this.board.getSize(), 
            this.players['X'].getName(), 
            this.players['O'].getName()
        );
        this.nextTurn();
    }

    async handleHumanMove(row, col) {
        if (this.isGameOver || this.currentPlayerSymbol !== this.humanPlayer.getSymbol()) {
            return;
        }

        if (this.board.setCell(row, col, this.currentPlayerSymbol)) {
            this.ui.renderBoard(this.board);
            await db.recordMove(this.gameId, this.currentPlayerSymbol, row, col, ++this.moveNumber);
            this.checkGameState();
        }
    }

    nextTurn() {
        if (this.isGameOver) return;

        if (this.currentPlayerSymbol === this.computerPlayer.getSymbol()) {
            // Ход компьютера
            setTimeout(() => {
                const move = this.computerPlayer.makeMove(this.board);
                if (move) {
                    this.board.setCell(move.row, move.col, this.currentPlayerSymbol);
                    this.ui.renderBoard(this.board);
                    db.recordMove(this.gameId, this.currentPlayerSymbol, move.row, move.col, ++this.moveNumber);
                    this.checkGameState();
                }
            }, 500); // Небольшая задержка для имитации "раздумий"
        }
    }

    checkGameState() {
        if (this.board.checkWin(this.currentPlayerSymbol)) {
            this.isGameOver = true;
            this.ui.updateStatus(`Победил ${this.players[this.currentPlayerSymbol].getName()}!`);
            db.endGame(this.gameId, this.currentPlayerSymbol, false);
        } else if (this.board.isFull()) {
            this.isGameOver = true;
            this.ui.updateStatus('Ничья!');
            db.endGame(this.gameId, null, true);
        } else {
            this.switchPlayer();
            this.ui.updateStatus(`Ход игрока ${this.currentPlayerSymbol} (${this.players[this.currentPlayerSymbol].getName()})`);
            this.nextTurn();
        }
    }

    switchPlayer() {
        this.currentPlayerSymbol = this.currentPlayerSymbol === 'X' ? 'O' : 'X';
    }
}