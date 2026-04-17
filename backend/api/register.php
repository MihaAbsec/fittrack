<?php
/**
 * Registracija uporabnika
 * POST /backend/api/register.php
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');

require_once '../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode([
        'success' => false,
        'error' => ['message' => 'Metoda ni dovoljena', 'code' => 'METHOD_ERROR']
    ]);
    exit;
}

$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data) {
    echo json_encode([
        'success' => false,
        'error' => ['message' => 'Napačen JSON format', 'code' => 'JSON_ERROR']
    ]);
    exit;
}

if (empty($data['email']) || empty($data['username']) || empty($data['password'])) {
    echo json_encode([
        'success' => false,
        'error' => ['message' => 'Manjkajo obvezna polja', 'code' => 'VALIDATION_ERROR']
    ]);
    exit;
}

$email = trim($data['email']);
$username = trim($data['username']);
$password = $data['password'];
$full_name = isset($data['full_name']) ? trim($data['full_name']) : '';

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode([
        'success' => false,
        'error' => ['message' => 'Neveljaven email naslov', 'code' => 'VALIDATION_ERROR']
    ]);
    exit;
}

if (strlen($password) < 6) {
    echo json_encode([
        'success' => false,
        'error' => ['message' => 'Geslo mora biti dolgo vsaj 6 znakov', 'code' => 'VALIDATION_ERROR']
    ]);
    exit;
}

if (strlen($username) < 3 || strlen($username) > 50) {
    echo json_encode([
        'success' => false,
        'error' => ['message' => 'Uporabniško ime mora biti dolgo med 3 in 50 znaki', 'code' => 'VALIDATION_ERROR']
    ]);
    exit;
}

$conn = db_connect();

$check_sql = "SELECT id FROM users WHERE email = ? OR username = ?";
$stmt = mysqli_prepare($conn, $check_sql);
mysqli_stmt_bind_param($stmt, 'ss', $email, $username);
mysqli_stmt_execute($stmt);
mysqli_stmt_store_result($stmt);

if (mysqli_stmt_num_rows($stmt) > 0) {
    mysqli_stmt_close($stmt);
    db_close($conn);
    
    echo json_encode([
        'success' => false,
        'error' => ['message' => 'Uporabnik s tem email naslovom ali uporabniškim imenom že obstaja', 'code' => 'DUPLICATE_ERROR']
    ]);
    exit;
}

mysqli_stmt_close($stmt);

$password_hash = password_hash($password, PASSWORD_DEFAULT);

$insert_sql = "INSERT INTO users (email, username, password_hash, full_name) VALUES (?, ?, ?, ?)";
$stmt = mysqli_prepare($conn, $insert_sql);
mysqli_stmt_bind_param($stmt, 'ssss', $email, $username, $password_hash, $full_name);

if (mysqli_stmt_execute($stmt)) {
    $user_id = mysqli_insert_id($conn);
    
    session_start();
    $_SESSION['user_id'] = $user_id;
    $_SESSION['username'] = $username;
    $_SESSION['email'] = $email;
    
    mysqli_stmt_close($stmt);
    db_close($conn);
    
    echo json_encode([
        'success' => true,
        'message' => 'Registracija uspešna!',
        'data' => [
            'user_id' => $user_id,
            'username' => $username,
            'email' => $email,
            'full_name' => $full_name
        ]
    ]);
} else {
    mysqli_stmt_close($stmt);
    db_close($conn);
    
    echo json_encode([
        'success' => false,
        'error' => ['message' => 'Napaka pri registraciji: ' . mysqli_error($conn), 'code' => 'DATABASE_ERROR']
    ]);
}
?>
