<?php

namespace Eario13\TicTacToe;

abstract class Player
{
    protected string $symbol;

    public function __construct(string $symbol)
    {
        $this->symbol = $symbol;
    }

    public function getSymbol(): string
    {
        return $this->symbol;
    }

    abstract public function makeMove(Board $board): array;
}
