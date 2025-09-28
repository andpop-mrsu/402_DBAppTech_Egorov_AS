<?php

namespace Eario13\TicTacToe;

use cli\Streams;
use cli\Arguments;

class Game
{
    private Board $board;
    private Player $playerX;
    private Player $playerO;
    private array $players;
    private string $currentPlayerSymbol;
    private string $humanSymbol;

    public function __construct(int $boardSize, string $humanName, Arguments $args)
    {
        $this->board = new Board($boardSize);

        $this->humanSymbol = (rand(0, 1) === 0) ? 'X' : 'O';

        Streams::line('Вы будете играть за ' . $this->humanSymbol);

        if ($this->humanSymbol === 'X') {
            $this->playerX = new HumanPlayer('X');
            $this->playerO = new ComputerPlayer('O');
        } else {
            $this->playerX = new ComputerPlayer('X');
            $this->playerO = new HumanPlayer('O');
        }

        $this->players = ['X' => $this->playerX, 'O' => $this->playerO];
        $this->currentPlayerSymbol = 'X';
    }

    public function run(): void
    {
        Streams::line('Начинаем новую игру...');
        Streams::line('Игрок ' . $this->currentPlayerSymbol . ' ходит первым.');

        while (true) {
            $this->displayBoard();

            $currentPlayer = $this->players[$this->currentPlayerSymbol];

            Streams::line('Текущий игрок: ' . $this->currentPlayerSymbol .
                           ' (' . (get_class($currentPlayer) === HumanPlayer::class ? 'Человек' : 'Компьютер') . ')');

            [$row, $col] = $currentPlayer->makeMove($this->board);
            $this->board->setCell($row, $col, $this->currentPlayerSymbol);

            if ($this->board->checkWin($this->currentPlayerSymbol)) {
                $this->displayBoard();
                Streams::line('Игрок ' . $this->currentPlayerSymbol . ' победил!');
                break;
            }

            if ($this->board->isFull()) {
                $this->displayBoard();
                Streams::line('Ничья!');
                break;
            }

            $this->switchPlayer();
        }

        Streams::line('Игра окончена. В этой версии данные не будут сохранены в базу данных.');
    }

    private function displayBoard(): void
    {
        Streams::line(str_repeat('-', $this->board->getSize() * 4 + 1));
        for ($i = 0; $i < $this->board->getSize(); $i++) {
            $rowString = '|';
            for ($j = 0; $j < $this->board->getSize(); $j++) {
                $rowString .= ' ' . $this->board->getCell($i, $j) . ' |';
            }
            Streams::line($rowString);
            Streams::line(str_repeat('-', $this->board->getSize() * 4 + 1));
        }
    }

    private function switchPlayer(): void
    {
        $this->currentPlayerSymbol = ($this->currentPlayerSymbol === 'X') ? 'O' : 'X';
    }
}
