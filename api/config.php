<?php
// Kitchlet API configuration. Defaults match a stock XAMPP install.
return [
    'db' => [
        'host'     => getenv('KITCHLET_DB_HOST') ?: '127.0.0.1',
        'port'     => getenv('KITCHLET_DB_PORT') ?: '3306',
        'name'     => getenv('KITCHLET_DB_NAME') ?: 'kitchlet',
        'user'     => getenv('KITCHLET_DB_USER') ?: 'root',
        'password' => getenv('KITCHLET_DB_PASSWORD') ?: '',
    ],

    // Where uploaded utensil photos are stored (relative to this folder).
    'upload_dir'     => __DIR__ . '/uploads',
    'max_image_size' => 5 * 1024 * 1024, // 5 MB

    'categories' => [
        'Cookware',
        'Bakeware',
        'Cutlery',
        'Prep Tools',
        'Utensils',
        'Appliances',
        'Storage',
        'Serveware',
    ],
];
