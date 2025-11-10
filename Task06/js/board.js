export default class Board {
    constructor(size) {
        this.size = size;
        this.board = Array(size).fill(null).map(() => Array(size).fill(' '));
    }

    getSize() {
        return this.size;
    }

    getCell(row, col) {
        return this.board[row][col];
    }

    setCell(row, col, player) {
        if (this.isValidMove(row, col)) {
            this.board[row][col] = player;
            return true;
        }
        return false;
    }

    isValidMove(row, col) {
        return row >= 0 && row < this.size &&
               col >= 0 && col < this.size &&
               this.board[row][col] === ' ';
    }

    isFull() {
        return this.board.every(row => row.every(cell => cell !== ' '));
    }

    checkWin(player) {
        // Проверка строк
        for (let i = 0; i < this.size; i++) {
            if (this.board[i].every(cell => cell === player)) return true;
        }

        // Проверка столбцов
        for (let j = 0; j < this.size; j++) {
            if (this.board.every(row => row[j] === player)) return true;
        }

        // Проверка главной диагонали
        if (this.board.every((row, i) => row[i] === player)) return true;

        // Проверка побочной диагонали
        if (this.board.every((row, i) => row[this.size - 1 - i] === player)) return true;

        return false;
    }
}