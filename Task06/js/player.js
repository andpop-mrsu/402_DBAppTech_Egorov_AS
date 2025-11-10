class Player {
    constructor(symbol, name) {
        this.symbol = symbol;
        this.name = name;
    }

    getSymbol() {
        return this.symbol;
    }

    getName() {
        return this.name;
    }
}

export class HumanPlayer extends Player {
    // В веб-версии ход делает UI, а не этот класс. 
    // Этот класс просто хранит данные игрока.
}

export class ComputerPlayer extends Player {
    makeMove(board) {
        const availableMoves = [];
        for (let row = 0; row < board.getSize(); row++) {
            for (let col = 0; col < board.getSize(); col++) {
                if (board.isValidMove(row, col)) {
                    availableMoves.push({ row, col });
                }
            }
        }

        if (availableMoves.length > 0) {
            // Просто случайный ход
            const randomIndex = Math.floor(Math.random() * availableMoves.length);
            return availableMoves[randomIndex];
        }
        return null; // Нет доступных ходов
    }
}