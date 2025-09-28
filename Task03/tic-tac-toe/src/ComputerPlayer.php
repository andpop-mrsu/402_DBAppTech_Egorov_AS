<?php

namespace Eario13\TicTacToe;

class ComputerPlayer extends Player
{
    public function makeMove(Board $board): array
    {
        $size = $board->getSize();
        $availableMoves = [];

        for ($row = 0; $row < $size; $row++) {
            for ($col = 0; $col < $size; $col++) {
                if ($board->isValidMove($row, $col)) {
                    $availableMoves[] = [$row, $col];
                }
            }
        }

        if (empty($availableMoves)) {
            throw new \RuntimeException('Нет доступных ходов для компьютера.');
        }

        return $availableMoves[array_rand($availableMoves)];
    }
}
