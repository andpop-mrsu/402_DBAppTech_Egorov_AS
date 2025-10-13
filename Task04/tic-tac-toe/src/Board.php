<?php

namespace Eario13\TicTacToe;

class Board
{
    private array $board;
    private int $size;

    public function __construct(int $size)
    {
        $this->size = $size;
        $this->board = array_fill(0, $size, array_fill(0, $size, ' '));
    }

    public function getSize(): int
    {
        return $this->size;
    }

    public function getCell(int $row, int $col): string
    {
        return $this->board[$row][$col];
    }

    public function setCell(int $row, int $col, string $player): void
    {
        if (!$this->isValidMove($row, $col)) {
            throw new \InvalidArgumentException('Недопустимый ход');
        }
        $this->board[$row][$col] = $player;
    }

    public function isValidMove(int $row, int $col): bool
    {
        return $row >= 0 && $row < $this->size &&
               $col >= 0 && $col < $this->size &&
               $this->board[$row][$col] === ' ';
    }

    public function isFull(): bool
    {
        foreach ($this->board as $row) {
            foreach ($row as $cell) {
                if ($cell === ' ') {
                    return false;
                }
            }
        }
        return true;
    }

    public function checkWin(string $player): bool
    {
        return $this->checkRows($player) || $this->checkColumns($player) || $this->checkDiagonals($player);
    }

    private function checkRows(string $player): bool
    {
        for ($i = 0; $i < $this->size; $i++) {
            $win = true;
            for ($j = 0; $j < $this->size; $j++) {
                if ($this->board[$i][$j] !== $player) {
                    $win = false;
                    break;
                }
            }
            if ($win) {
                return true;
            }
        }
        return false;
    }

    private function checkColumns(string $player): bool
    {
        for ($j = 0; $j < $this->size; $j++) {
            $win = true;
            for ($i = 0; $i < $this->size; $i++) {
                if ($this->board[$i][$j] !== $player) {
                    $win = false;
                    break;
                }
            }
            if ($win) {
                return true;
            }
        }
        return false;
    }

    private function checkDiagonals(string $player): bool
    {
        $winMain = true;
        for ($i = 0; $i < $this->size; $i++) {
            if ($this->board[$i][$i] !== $player) {
                $winMain = false;
                break;
            }
        }
        if ($winMain) {
            return true;
        }

        $winAnti = true;
        for ($i = 0; $i < $this->size; $i++) {
            if ($this->board[$i][$this->size - 1 - $i] !== $player) {
                $winAnti = false;
                break;
            }
        }
        return $winAnti;
    }
}
