<?php

namespace Eario13\TicTacToe;

use cli\Arguments;
use cli\Streams;

class CliApp
{
    private Arguments $args;

    public function __construct()
    {
        $this->args = new Arguments();
        $this->configureArguments();
    }

    private function configureArguments(): void
    {
        $this->args->addFlag(['new-game', 'n'], 'Начать новую игру в крестики-нолики.');

        $this->args->addOption(
            ['board-size', 's'],
            [
                'default' => 3,
                'description' => 'Установить размер доски (например, --board-size=5 для доски 5x5). Мин. 3, макс. 10.'
            ]
        );

        $this->args->addOption(
            ['player-name', 'p'],
            [
                'default' => 'Игрок',
                'description' => 'Установить имя игрока (например, --player-name="Иван Петров").'
            ]
        );

        $this->args->addFlag(
            ['list-games', 'l'],
            'Показать список всех сохраненных игр (не поддерживается в этой версии).'
        );

        $this->args->addOption(
            ['replay-game', 'r'],
            [
                'default' => null,
                'description' => 'Повторить сохраненную игру по ID (не поддерживается в этой версии).'
            ]
        );
    }

    public function run(): void
    {
        $this->args->parse();

        if ($this->args['help']) {
            $this->showHelp();
            return;
        }

        if ($this->args['new-game']) {
            $this->startNewGame();
        } elseif ($this->args['list-games']) {
            Streams::line(
                'Вывод списка сохраненных игр не поддерживается в этой версии. ' .
                'Операции с базой данных отключены.'
            );
        } elseif ($this->args['replay-game']) {
            Streams::line('Повтор игр не поддерживается в этой версии. Операции с базой данных отключены.');
        } else {
            $this->showHelp();
        }
    }

    private function showHelp(): void
    {
        Streams::line('Использование: tic-tac-toe [опции]');
        Streams::line('');
        Streams::line('Опции:');
        Streams::line($this->args->getHelpScreen());
    }

    private function startNewGame(): void
    {
        $boardSize = (int) $this->args['board-size'];
        $playerName = (string) $this->args['player-name'];

        if ($boardSize < 3 || $boardSize > 10) {
            Streams::line('Неверный размер доски. Должен быть от 3 до 10.');
            return;
        }

        Streams::line('Имя игрока: ' . $playerName);
        Streams::line('Размер доски: ' . $boardSize . 'x' . $boardSize);
        Streams::line('База данных не используется в этой версии. Результаты игры не будут сохранены.');

        $game = new Game($boardSize, $playerName, $this->args);
        $game->run();
    }
}
