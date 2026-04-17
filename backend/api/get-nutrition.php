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

$user_id = $_SESSION['user_id'];
$date = isset($_GET['date']) ? $_GET['date'] : date('Y-m-d');

$conn = db_connect();

$sql = "SELECT * FROM nutrition_entries 
        WHERE user_id = ? AND entry_date = ? 
        ORDER BY meal_type, created_at";
$stmt = mysqli_prepare($conn, $sql);
mysqli_stmt_bind_param($stmt, 'is', $user_id, $date);
mysqli_stmt_execute($stmt);
$result = mysqli_stmt_get_result($stmt);

$entries = [];
$totals = ['calories' => 0, 'protein' => 0, 'carbs' => 0, 'fats' => 0];

while ($row = mysqli_fetch_assoc($result)) {
    $entries[] = $row;
    $totals['calories'] += $row['calories'];
    $totals['protein'] += $row['protein'];
    $totals['carbs'] += $row['carbs'];
    $totals['fats'] += $row['fats'];
}

mysqli_stmt_close($stmt);
db_close($conn);

echo json_encode([
    'success' => true,
    'data' => [
        'entries' => $entries,
        'totals' => $totals
    ]
]);
?>
