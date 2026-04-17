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
        'error' => ['message' => 'Napačen JSON', 'code' => 'JSON_ERROR']
    ]);
    exit;
}

if (empty($data['food_name']) || empty($data['meal_type'])) {
    echo json_encode([
        'success' => false,
        'error' => ['message' => 'Manjkajo obvezna polja', 'code' => 'VALIDATION_ERROR']
    ]);
    exit;
}

$user_id = $_SESSION['user_id'];
$entry_date = isset($data['entry_date']) ? $data['entry_date'] : date('Y-m-d');
$meal_type = $data['meal_type'];
$food_name = trim($data['food_name']);
$calories = isset($data['calories']) ? intval($data['calories']) : null;
$protein = isset($data['protein']) ? floatval($data['protein']) : null;
$carbs = isset($data['carbs']) ? floatval($data['carbs']) : null;
$fats = isset($data['fats']) ? floatval($data['fats']) : null;

$conn = db_connect();

$sql = "INSERT INTO nutrition_entries (user_id, entry_date, meal_type, food_name, calories, protein, carbs, fats) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
$stmt = mysqli_prepare($conn, $sql);
mysqli_stmt_bind_param($stmt, 'isssiddd', $user_id, $entry_date, $meal_type, $food_name, $calories, $protein, $carbs, $fats);

if (mysqli_stmt_execute($stmt)) {
    $entry_id = mysqli_insert_id($conn);
    mysqli_stmt_close($stmt);
    db_close($conn);
    
    echo json_encode([
        'success' => true,
        'message' => 'Vnos prehrane uspešno dodan!',
        'data' => ['entry_id' => $entry_id]
    ]);
} else {
    mysqli_stmt_close($stmt);
    db_close($conn);
    
    echo json_encode([
        'success' => false,
        'error' => ['message' => 'Napaka pri dodajanju vnosa', 'code' => 'DATABASE_ERROR']
    ]);
}
?>
