<?php
/**
 * Kitchlet REST API
 *
 *   GET    /utensils              list (optional ?search= & ?category=)
 *   GET    /utensils/{id}         single utensil
 *   POST   /utensils              create (JSON or multipart with "image" file)
 *   PUT    /utensils/{id}         update (JSON)
 *   POST   /utensils/{id}         update (multipart, used when uploading a new image)
 *   DELETE /utensils/{id}         delete (also POST with _method=DELETE)
 *   GET    /categories            allowed categories
 */

declare(strict_types=1);

$config = require __DIR__ . '/config.php';
require __DIR__ . '/database.php';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept, X-HTTP-Method-Override');
header('Content-Type: application/json; charset=utf-8');

set_exception_handler(function (Throwable $e) {
    if ($e instanceof PDOException) {
        respond(['error' => 'Database unavailable. Make sure MySQL is running in XAMPP.'], 503);
    }
    error_log((string) $e);
    respond(['error' => 'Unexpected server error.'], 500);
});

$method = $_SERVER['REQUEST_METHOD'];
if ($method === 'OPTIONS') {
    http_response_code(204);
    exit;
}
if ($method === 'POST') {
    $override = strtoupper($_POST['_method'] ?? $_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE'] ?? '');
    if (in_array($override, ['PUT', 'PATCH', 'DELETE'], true)) {
        $method = $override;
    }
}

$segments = route_segments();
$resource = $segments[0] ?? '';
$id = isset($segments[1]) ? filter_var($segments[1], FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]) : null;

if ($resource === '' || $resource === 'health') {
    respond(['name' => 'Kitchlet API', 'status' => 'ok']);
}
if ($resource === 'categories' && $method === 'GET') {
    respond(['data' => $config['categories']]);
}
if ($resource !== 'utensils' || count($segments) > 2 || $id === false) {
    respond(['error' => 'Not found.'], 404);
}

$pdo = db($config);

if ($id === null) {
    match ($method) {
        'GET'   => list_utensils($pdo),
        'POST'  => create_utensil($pdo, $config),
        default => respond(['error' => 'Method not allowed.'], 405),
    };
} else {
    match ($method) {
        'GET'                  => respond(['data' => present(find_or_404($pdo, $id))]),
        'PUT', 'PATCH', 'POST' => update_utensil($pdo, $config, $id),
        'DELETE'               => delete_utensil($pdo, $config, $id),
        default                => respond(['error' => 'Method not allowed.'], 405),
    };
}

// ---------------------------------------------------------------- handlers

function list_utensils(PDO $pdo): never
{
    $sql = 'SELECT * FROM utensils WHERE 1=1';
    $params = [];

    $search = trim((string) ($_GET['search'] ?? ''));
    if ($search !== '') {
        $sql .= ' AND (name LIKE :search OR material LIKE :search2 OR description LIKE :search3)';
        $like = '%' . addcslashes($search, '%_\\') . '%';
        $params += [':search' => $like, ':search2' => $like, ':search3' => $like];
    }
    $category = trim((string) ($_GET['category'] ?? ''));
    if ($category !== '') {
        $sql .= ' AND category = :category';
        $params[':category'] = $category;
    }
    $sql .= ' ORDER BY created_at DESC, id DESC';

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    respond(['data' => array_map('present', $stmt->fetchAll())]);
}

function create_utensil(PDO $pdo, array $config): never
{
    [$fields, $errors] = validate(request_body(), $config);
    $image = uploaded_image($config, $errors);
    if ($errors) {
        respond(['error' => 'Please fix the highlighted fields.', 'errors' => $errors], 422);
    }

    $imagePath = $image ? store_image($image, $config) : null;
    $stmt = $pdo->prepare(
        'INSERT INTO utensils (name, category, material, quantity, description, image_path)
         VALUES (:name, :category, :material, :quantity, :description, :image_path)'
    );
    $stmt->execute(array_merge(prefix_keys($fields), [':image_path' => $imagePath]));

    $utensil = find_or_404($pdo, (int) $pdo->lastInsertId());
    header('Location: ' . base_url() . '/utensils/' . $utensil['id']);
    respond(['data' => present($utensil), 'message' => 'Utensil added.'], 201);
}

function update_utensil(PDO $pdo, array $config, int $id): never
{
    $existing = find_or_404($pdo, $id);
    $body = request_body();

    // Fields that are omitted keep their current value.
    $merged = array_merge(
        array_intersect_key($existing, array_flip(['name', 'category', 'material', 'quantity', 'description'])),
        array_intersect_key($body, array_flip(['name', 'category', 'material', 'quantity', 'description']))
    );
    [$fields, $errors] = validate($merged, $config);
    $image = uploaded_image($config, $errors);
    if ($errors) {
        respond(['error' => 'Please fix the highlighted fields.', 'errors' => $errors], 422);
    }

    $imagePath = $existing['image_path'];
    $removeImage = filter_var($body['remove_image'] ?? false, FILTER_VALIDATE_BOOLEAN);
    if ($image) {
        $imagePath = store_image($image, $config);
    } elseif ($removeImage) {
        $imagePath = null;
    }

    $stmt = $pdo->prepare(
        'UPDATE utensils SET name = :name, category = :category, material = :material,
             quantity = :quantity, description = :description, image_path = :image_path
         WHERE id = :id'
    );
    $stmt->execute(array_merge(prefix_keys($fields), [':image_path' => $imagePath, ':id' => $id]));

    if ($existing['image_path'] && $existing['image_path'] !== $imagePath) {
        delete_image($existing['image_path'], $config);
    }
    respond(['data' => present(find_or_404($pdo, $id)), 'message' => 'Utensil updated.']);
}

function delete_utensil(PDO $pdo, array $config, int $id): never
{
    $existing = find_or_404($pdo, $id);
    $pdo->prepare('DELETE FROM utensils WHERE id = :id')->execute([':id' => $id]);
    if ($existing['image_path']) {
        delete_image($existing['image_path'], $config);
    }
    respond(['data' => ['id' => $id], 'message' => 'Utensil deleted.']);
}

// ---------------------------------------------------------------- helpers

function validate(array $in, array $config): array
{
    $errors = [];

    $name = trim((string) ($in['name'] ?? ''));
    if ($name === '') {
        $errors['name'] = 'Name is required.';
    } elseif (mb_strlen($name) < 2 || mb_strlen($name) > 80) {
        $errors['name'] = 'Name must be 2–80 characters.';
    }

    $category = trim((string) ($in['category'] ?? ''));
    if (!in_array($category, $config['categories'], true)) {
        $errors['category'] = 'Choose one of the listed categories.';
    }

    $material = trim((string) ($in['material'] ?? ''));
    if (mb_strlen($material) > 60) {
        $errors['material'] = 'Material must be at most 60 characters.';
    }

    $quantity = filter_var($in['quantity'] ?? 1, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1, 'max_range' => 999]]);
    if ($quantity === false) {
        $errors['quantity'] = 'Quantity must be a whole number from 1 to 999.';
    }

    $description = trim((string) ($in['description'] ?? ''));
    if (mb_strlen($description) > 500) {
        $errors['description'] = 'Description must be at most 500 characters.';
    }

    return [[
        'name'        => $name,
        'category'    => $category,
        'material'    => $material === '' ? null : $material,
        'quantity'    => $quantity,
        'description' => $description === '' ? null : $description,
    ], $errors];
}

/** Returns the validated $_FILES entry, or null when no image was sent. Adds to $errors on failure. */
function uploaded_image(array $config, array &$errors): ?array
{
    $file = $_FILES['image'] ?? null;
    if (!$file || $file['error'] === UPLOAD_ERR_NO_FILE) {
        return null;
    }
    if (in_array($file['error'], [UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE], true) || $file['size'] > $config['max_image_size']) {
        $errors['image'] = 'Image must be 5 MB or smaller.';
        return null;
    }
    if ($file['error'] !== UPLOAD_ERR_OK || !is_uploaded_file($file['tmp_name'])) {
        $errors['image'] = 'The image could not be uploaded. Please try again.';
        return null;
    }
    $mime = (new finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']);
    $extensions = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp', 'image/gif' => 'gif'];
    if (!isset($extensions[$mime])) {
        $errors['image'] = 'Image must be a JPG, PNG, WebP or GIF.';
        return null;
    }
    $file['extension'] = $extensions[$mime];
    return $file;
}

function store_image(array $file, array $config): string
{
    if (!is_dir($config['upload_dir'])) {
        mkdir($config['upload_dir'], 0775, true);
    }
    $name = bin2hex(random_bytes(16)) . '.' . $file['extension'];
    if (!move_uploaded_file($file['tmp_name'], $config['upload_dir'] . '/' . $name)) {
        throw new RuntimeException('Failed to store uploaded image.');
    }
    return $name;
}

function delete_image(string $name, array $config): void
{
    $path = $config['upload_dir'] . '/' . basename($name);
    if (is_file($path)) {
        unlink($path);
    }
}

function find_or_404(PDO $pdo, int $id): array
{
    $stmt = $pdo->prepare('SELECT * FROM utensils WHERE id = :id');
    $stmt->execute([':id' => $id]);
    $row = $stmt->fetch();
    if (!$row) {
        respond(['error' => 'Utensil not found.'], 404);
    }
    return $row;
}

function present(array $row): array
{
    return [
        'id'          => (int) $row['id'],
        'name'        => $row['name'],
        'category'    => $row['category'],
        'material'    => $row['material'],
        'quantity'    => (int) $row['quantity'],
        'description' => $row['description'],
        'image_url'   => $row['image_path'] ? base_url() . '/uploads/' . rawurlencode($row['image_path']) : null,
        'created_at'  => iso_date($row['created_at']),
        'updated_at'  => iso_date($row['updated_at']),
    ];
}

function iso_date(string $value): string
{
    return (new DateTimeImmutable($value, new DateTimeZone('UTC')))->format('Y-m-d\TH:i:s\Z');
}

function request_body(): array
{
    $type = $_SERVER['CONTENT_TYPE'] ?? '';
    if (str_contains($type, 'application/json')) {
        $decoded = json_decode(file_get_contents('php://input') ?: '[]', true);
        if (!is_array($decoded)) {
            respond(['error' => 'Request body must be valid JSON.'], 400);
        }
        return $decoded;
    }
    return $_POST;
}

function prefix_keys(array $fields): array
{
    $out = [];
    foreach ($fields as $key => $value) {
        $out[':' . $key] = $value;
    }
    return $out;
}

/** Path segments after the API folder, e.g. "/Kitchen-Utensils/api/utensils/3" -> ["utensils", "3"]. */
function route_segments(): array
{
    $path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
    $base = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'])), '/');
    if ($base !== '' && str_starts_with($path, $base)) {
        $path = substr($path, strlen($base));
    }
    $path = preg_replace('#^/index\.php#', '', $path);
    return array_values(array_filter(explode('/', trim($path, '/')), 'strlen'));
}

function base_url(): string
{
    $https = ($_SERVER['HTTPS'] ?? 'off') !== 'off' || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https';
    $base = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'])), '/');
    return ($https ? 'https' : 'http') . '://' . $_SERVER['HTTP_HOST'] . $base;
}

function respond(array $payload, int $status = 200): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}
