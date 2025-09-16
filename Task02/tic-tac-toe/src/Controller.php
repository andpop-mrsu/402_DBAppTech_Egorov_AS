<?php
namespace Eario13\TicTacToe\Controller;

use function cli\line;
use function cli\prompt;

class Controller
{
    public static function startGame(): void
    {
        line("Добро пожаловать в 'Крестики-нолики'!");
        line("1) Новая игра");
        line("2) Список сохранённых партий");
        line("3) Повтор партии");

        $choice = prompt("Выберите режим (1-3)");

        switch (trim($choice)) {
            case '1': line("Запуск новой игры..."); break;
            case '2': line("Список партий..."); break;
            case '3': line("Повтор партии..."); break;
            default: line("Неверный выбор.");
        }
    }
}
