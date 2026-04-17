<?php
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

if (empty($data['login']) || empty($data['password'])) {
    echo json_encode([
        'success' => false,
        'error' => ['message' => 'Manjkajo obvezna polja', 'code' => 'VALIDATION_ERROR']
    ]);
    exit;
}

$login = trim($data['login']);
$password = $data['password'];

$conn = db_connect();

$sql = "SELECT id, email, username, password_hash, full_name, is_active FROM users WHERE email = ? OR username = ? LIMIT 1";
$stmt = mysqli_prepare($conn, $sql);
mysqli_stmt_bind_param($stmt, 'ss', $login, $login);
mysqli_stmt_execute($stmt);
$result = mysqli_stmt_get_result($stmt);

if (mysqli_num_rows($result) == 0) {
    mysqli_stmt_close($stmt);
    db_close($conn);
    
    echo json_encode([
        'success' => false,
        'error' => ['message' => 'Napačno uporabniško ime ali geslo', 'code' => 'AUTH_ERROR']
    ]);
    exit;
}

$user = mysqli_fetch_assoc($result);
mysqli_stmt_close($stmt);

if (!$user['is_active']) {
    db_close($conn);
    
    echo json_encode([
        'success' => false,
        'error' => ['message' => 'Vaš račun je onemogočen', 'code' => 'AUTH_ERROR']
    ]);
    exit;
}

if (!password_verify($password, $user['password_hash'])) {
    db_close($conn);
    
    echo json_encode([
        'success' => false,
        'error' => ['message' => 'Napačno uporabniško ime ali geslo', 'code' => 'AUTH_ERROR']
    ]);
    exit;
}

$update_sql = "UPDATE users SET last_login = NOW() WHERE id = ?";
$stmt = mysqli_prepare($conn, $update_sql);
mysqli_stmt_bind_param($stmt, 'i', $user['id']);
mysqli_stmt_execute($stmt);
mysqli_stmt_close($stmt);

db_close($conn);

session_start();
$_SESSION['user_id'] = $user['id'];
$_SESSION['username'] = $user['username'];
$_SESSION['email'] = $user['email'];

echo json_encode([
    'success' => true,
    'message' => 'Prijava uspešna!',
    'data' => [
        'user_id' => $user['id'],
        'username' => $user['username'],
        'email' => $user['email'],
        'full_name' => $user['full_name']
    ]
]);
?>
