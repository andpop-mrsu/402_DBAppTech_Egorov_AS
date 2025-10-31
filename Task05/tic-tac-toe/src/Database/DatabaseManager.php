<?php

namespace Eario13\TicTacToe\Database;

use RedBeanPHP\R as R; // Импортируем фасад RedBeanPHP для удобства

/**
 * Class DatabaseManager
 * Управляет всеми операциями с базой данных, используя RedBeanPHP ORM.
 */
class DatabaseManager
{
    /**
     * Конструктор настраивает соединение с базой данных SQLite.
     * RedBeanPHP автоматически создаст файл базы данных и таблицы при необходимости.
     *
     * @param string $dbPath Путь к файлу базы данных SQLite.
     */
    public function __construct(string $dbPath)
    {
        // Проверяем, не установлено ли уже соединение, чтобы избежать дублирования
        if (!R::testConnection()) {
            R::setup('sqlite:' . $dbPath);
        }
    }

    /**
     * Создает новую запись об игре в базе данных.
     *
     * @param int    $boardSize   Размер игрового поля.
     * @param string $playerXName Имя игрока, играющего за 'X'.
     * @param string $playerOName Имя игрока, играющего за 'O'.
     * @return int ID созданной игры.
     */
    public function createGame(int $boardSize, string $playerXName, string $playerOName): int
    {
        // R::dispense() создает новый "бин" (объект-представление строки таблицы)
        $game = R::dispense('games');

        // Устанавливаем свойства бина
        $game->board_size = $boardSize;
        $game->player_x_name = $playerXName;
        $game->player_o_name = $playerOName;
        $game->start_time = date('Y-m-d H:i:s'); // Текущее время
        $game->winner = null; // Победитель пока не определен
        $game->draw = false; // Ничьей пока нет

        // R::store() сохраняет бин в базе данных и возвращает его ID
        return (int)R::store($game);
    }

    /**
     * Записывает ход игрока в базу данных, связывая его с конкретной игрой.
     *
     * @param int    $gameId       ID игры.
     * @param string $playerSymbol Символ игрока ('X' или 'O').
     * @param int    $row          Координата строки.
     * @param int    $col          Координата столбца.
     * @param int    $moveNumber   Порядковый номер хода.
     */
    public function recordMove(int $gameId, string $playerSymbol, int $row, int $col, int $moveNumber): void
    {
        // R::load() загружает существующий бин по его типу ('games') и ID
        $game = R::load('games', $gameId);

        $move = R::dispense('moves');
        $move->player_symbol = $playerSymbol;
        $move->row = $row;
        $move->col = $col;
        $move->move_number = $moveNumber;

        // RedBeanPHP автоматически управляет связями.
        // `ownMovesList` создает связь "один-ко-многим": одна игра (game) владеет многими ходами (moves).
        // Имя таблицы для ходов будет `moves`.
        $game->ownMovesList[] = $move;

        // Сохраняем родительский объект, и RedBeanPHP автоматически сохранит связанный с ним новый ход.
        R::store($game);
    }

    /**
     * Обновляет запись об игре, отмечая ее завершение.
     *
     * @param int      $gameId         ID игры.
     * @param string|null $winnerSymbol   Символ победителя или null.
     * @param bool     $isDraw         True, если игра закончилась вничью.
     */
    public function endGame(int $gameId, ?string $winnerSymbol = null, bool $isDraw = false): void
    {
        $game = R::load('games', $gameId);
        $game->end_time = date('Y-m-d H:i:s');
        $game->winner = $winnerSymbol;
        $game->draw = $isDraw;

        R::store($game);
    }

    /**
     * Возвращает список всех сохраненных игр.
     *
     * @return array Массив с данными всех игр.
     */
    public function getAllGames(): array
    {
        // R::findAll() находит все бины указанного типа с возможностью добавления SQL-условия
        $games = R::findAll('games', 'ORDER BY start_time DESC');

        // R::exportAll() конвертирует массив бинов в простой многомерный массив
        return R::exportAll($games);
    }

    /**
     * Возвращает детальную информацию о конкретной игре.
     *
     * @param int $gameId ID игры.
     * @return array|null Данные игры или null, если игра не найдена.
     */
    public function getGameDetails(int $gameId): ?array
    {
        $game = R::load('games', $gameId);

        // Если R::load() не находит запись, он возвращает бин с ID = 0
        if ($game->id === 0) {
            return null;
        }

        // $game->export() конвертирует один бин в ассоциативный массив
        return $game->export();
    }

    /**
     * Возвращает все ходы для указанной игры.
     *
     * @param int $gameId ID игры.
     * @return array Массив с данными всех ходов.
     */
    public function getGameMoves(int $gameId): array
    {
        $game = R::load('games', $gameId);

        if ($game->id === 0) {
            return [];
        }

        // Обращаемся к связанным ходам.
        // Метод with() позволяет добавить SQL-условие для выборки связанных бинов.
        $moves = $game->with('ORDER BY move_number ASC')->ownMovesList;

        return R::exportAll($moves);
    }
}