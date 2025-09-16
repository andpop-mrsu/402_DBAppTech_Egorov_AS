<?php
namespace Eario13\TicTacToe\View;

use function cli\line;

class View
{
    public static function printTitle(): void
    {
        line("Добро пожаловать в 'Крестики-нолики'!");
        line("-----------------------------------");
    }

    public static function showMessage(string $msg): void
    {
        line($msg);
    }
}
