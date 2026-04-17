<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once '../config/db.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode([
        'success' => false,
        'error' => ['message' => 'Niste prijavljeni', 'code' => 'AUTH_ERROR']
    ]);
    exit;
}

$conn = db_connect();

$muscle_group = isset($_GET['muscle_group']) ? $_GET['muscle_group'] : '';

if ($muscle_group) {
    $sql = "SELECT * FROM exercise_library WHERE muscle_group = ? ORDER BY name";
    $stmt = mysqli_prepare($conn, $sql);
    mysqli_stmt_bind_param($stmt, 's', $muscle_group);
} else {
    $sql = "SELECT * FROM exercise_library ORDER BY muscle_group, name";
    $stmt = mysqli_prepare($conn, $sql);
}

mysqli_stmt_execute($stmt);
$result = mysqli_stmt_get_result($stmt);

$exercises = [];
while ($row = mysqli_fetch_assoc($result)) {
    $exercises[] = $row;
}

mysqli_stmt_close($stmt);
db_close($conn);

echo json_encode([
    'success' => true,
    'data' => $exercises
]);
?>
