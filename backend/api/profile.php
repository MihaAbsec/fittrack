<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

require_once '../config/db.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'error' => ['message' => 'Niste prijavljeni', 'code' => 'AUTH_ERROR']]);
    exit;
}

$user_id = $_SESSION['user_id'];
$conn    = db_connect();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {

    $stmt = mysqli_prepare($conn, "SELECT id, email, username, full_name, created_at FROM users WHERE id = ?");
    mysqli_stmt_bind_param($stmt, 'i', $user_id);
    mysqli_stmt_execute($stmt);
    $r    = mysqli_stmt_get_result($stmt);
    $user = mysqli_fetch_assoc($r);
    mysqli_stmt_close($stmt);

    $stmt = mysqli_prepare($conn, "SELECT * FROM user_profile WHERE user_id = ?");
    mysqli_stmt_bind_param($stmt, 'i', $user_id);
    mysqli_stmt_execute($stmt);
    $r       = mysqli_stmt_get_result($stmt);
    $profile = mysqli_fetch_assoc($r);  
    mysqli_stmt_close($stmt);

    $stmt = mysqli_prepare($conn, "SELECT COUNT(DISTINCT session_date) as cnt FROM workout_sessions WHERE user_id = ?");
    mysqli_stmt_bind_param($stmt, 'i', $user_id);
    mysqli_stmt_execute($stmt);
    $r = mysqli_stmt_get_result($stmt);
    $training_days = mysqli_fetch_assoc($r)['cnt'];
    mysqli_stmt_close($stmt);

    $stmt = mysqli_prepare($conn, "SELECT COUNT(*) as cnt FROM workout_sessions WHERE user_id = ?");
    mysqli_stmt_bind_param($stmt, 'i', $user_id);
    mysqli_stmt_execute($stmt);
    $r = mysqli_stmt_get_result($stmt);
    $total_sessions = mysqli_fetch_assoc($r)['cnt'];
    mysqli_stmt_close($stmt);

    $stmt = mysqli_prepare($conn, "SELECT COUNT(DISTINCT DATE_FORMAT(session_date, '%Y-%m')) as cnt FROM workout_sessions WHERE user_id = ?");
    mysqli_stmt_bind_param($stmt, 'i', $user_id);
    mysqli_stmt_execute($stmt);
    $r = mysqli_stmt_get_result($stmt);
    $active_months = mysqli_fetch_assoc($r)['cnt'];
    mysqli_stmt_close($stmt);

    db_close($conn);

    echo json_encode([
        'success' => true,
        'data' => [
            'user'          => $user,
            'profile'       => $profile ?: [],
            'training_days' => $training_days,
            'total_sessions'=> $total_sessions,
            'active_months' => $active_months
        ]
    ]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    $data = json_decode(file_get_contents('php://input'), true);
    if (!$data) { echo json_encode(['success' => false, 'error' => ['message' => 'Ni podatkov', 'code' => 'VALIDATION_ERROR']]); exit; }

    if (isset($data['full_name'])) {
        $fn = trim($data['full_name']);
        $stmt = mysqli_prepare($conn, "UPDATE users SET full_name = ? WHERE id = ?");
        mysqli_stmt_bind_param($stmt, 'si', $fn, $user_id);
        mysqli_stmt_execute($stmt);
        mysqli_stmt_close($stmt);
    }

    $stmt = mysqli_prepare($conn, "SELECT user_id FROM user_profile WHERE user_id = ?");
    mysqli_stmt_bind_param($stmt, 'i', $user_id);
    mysqli_stmt_execute($stmt);
    mysqli_stmt_store_result($stmt);
    $exists = mysqli_stmt_num_rows($stmt) > 0;
    mysqli_stmt_close($stmt);

    $birth_date    = isset($data['birth_date'])    && $data['birth_date']    !== '' ? $data['birth_date']    : null;
    $gender        = isset($data['gender'])        && $data['gender']        !== '' ? $data['gender']        : null;
    $height        = isset($data['height_cm'])     && $data['height_cm']     !== '' ? intval($data['height_cm'])     : null;
    $weight        = isset($data['current_weight'])&& $data['current_weight']!== '' ? floatval($data['current_weight']) : null;
    $goal_weight   = isset($data['goal_weight'])   && $data['goal_weight']   !== '' ? floatval($data['goal_weight'])   : null;

    if ($exists) {
        $stmt = mysqli_prepare($conn, "UPDATE user_profile SET birth_date = ?, gender = ?, height_cm = ?, current_weight_kg = ?, goal_weight_kg = ? WHERE user_id = ?");
        mysqli_stmt_bind_param($stmt, 'ssiiis', $birth_date, $gender, $height, $weight, $goal_weight, $user_id);
        mysqli_stmt_execute($stmt);
        mysqli_stmt_close($stmt);
    } else {
        $stmt = mysqli_prepare($conn, "INSERT INTO user_profile (user_id, birth_date, gender, height_cm, current_weight_kg, goal_weight_kg) VALUES (?, ?, ?, ?, ?, ?)");
        mysqli_stmt_bind_param($stmt, 'issids', $user_id, $birth_date, $gender, $height, $weight, $goal_weight);
        mysqli_stmt_execute($stmt);
        mysqli_stmt_close($stmt);
    }

    db_close($conn);
    echo json_encode(['success' => true, 'message' => 'Profil shranjen!']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {

    $data     = json_decode(file_get_contents('php://input'), true);
    $password = isset($data['password']) ? $data['password'] : '';

    if (empty($password)) {
        echo json_encode(['success' => false, 'error' => ['message' => 'Vnesi geslo za potrditev', 'code' => 'VALIDATION_ERROR']]);
        exit;
    }

    $stmt = mysqli_prepare($conn, "SELECT password_hash FROM users WHERE id = ?");
    mysqli_stmt_bind_param($stmt, 'i', $user_id);
    mysqli_stmt_execute($stmt);
    $r    = mysqli_stmt_get_result($stmt);
    $row  = mysqli_fetch_assoc($r);
    mysqli_stmt_close($stmt);

    if (!$row || !password_verify($password, $row['password_hash'])) {
        echo json_encode(['success' => false, 'error' => ['message' => 'Napačno geslo', 'code' => 'AUTH_ERROR']]);
        exit;
    }

    $stmt = mysqli_prepare($conn, "DELETE FROM users WHERE id = ?");
    mysqli_stmt_bind_param($stmt, 'i', $user_id);
    mysqli_stmt_execute($stmt);
    mysqli_stmt_close($stmt);

    session_destroy();

    db_close($conn);
    echo json_encode(['success' => true, 'message' => 'Račun izbrisan.']);
    exit;
}

db_close($conn);
echo json_encode(['success' => false, 'error' => ['message' => 'Metoda ni dovoljena', 'code' => 'METHOD_ERROR']]);
?>
