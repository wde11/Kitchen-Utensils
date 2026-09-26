<?php
/**
 * Opens the PDO connection and makes sure the schema exists, so the API
 * works on a fresh XAMPP install without importing schema.sql by hand.
 */
function db(array $config): PDO
{
    static $pdo = null;
    if ($pdo !== null) {
        return $pdo;
    }

    $c = $config['db'];
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];

    $server = new PDO("mysql:host={$c['host']};port={$c['port']};charset=utf8mb4", $c['user'], $c['password'], $options);
    $name = str_replace('`', '', $c['name']);
    $server->exec("CREATE DATABASE IF NOT EXISTS `$name` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    $server = null;

    $pdo = new PDO("mysql:host={$c['host']};port={$c['port']};dbname=$name;charset=utf8mb4", $c['user'], $c['password'], $options);
    // TIMESTAMP columns are returned in the session zone; keep it UTC so iso_date() is correct.
    $pdo->exec("SET time_zone = '+00:00'");

    $isNew =$pdo->query("SHOW TABLES LIKE 'utensils'")->fetchColumn() === false;
    $pdo->exec(file_get_contents(__DIR__ . '/schema.sql'));
    if ($isNew) {
        $pdo->exec(file_get_contents(__DIR__ . '/seed.sql'));
    }

    return $pdo;
}
