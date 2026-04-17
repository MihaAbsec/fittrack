<?php
session_start();
header('Content-Type: application/json');
require_once '../config/db.php';

if (!isset($_SESSION['user_id'])) { echo json_encode(['success'=>false,'error'=>['message'=>'Niste prijavljeni','code'=>'AUTH_ERROR']]); exit; }

$data = json_decode(file_get_contents('php://input'), true);
if (!$data || empty($data['id'])) { echo json_encode(['success'=>false,'error'=>['message'=>'Manjka ID','code'=>'VALIDATION_ERROR']]); exit; }

$conn = db_connect();
$id   = intval($data['id']);
$user = $_SESSION['user_id'];

// Preveri da je vnos od tega userja
$stmt = mysqli_prepare($conn, "SELECT id FROM nutrition_entries WHERE id = ? AND user_id = ?");
mysqli_stmt_bind_param($stmt, 'ii', $id, $user);
mysqli_stmt_execute($stmt);
mysqli_stmt_store_result($stmt);
if (mysqli_stmt_num_rows($stmt) === 0) { mysqli_stmt_close($stmt); db_close($conn); echo json_encode(['success'=>false,'error'=>['message'=>'Ne obstaja','code'=>'NOT_FOUND']]); exit; }
mysqli_stmt_close($stmt);

$stmt = mysqli_prepare($conn, "DELETE FROM nutrition_entries WHERE id = ?");
mysqli_stmt_bind_param($stmt, 'i', $id);
mysqli_stmt_execute($stmt);
mysqli_stmt_close($stmt);
db_close($conn);

echo json_encode(['success'=>true,'message'=>'Vnos izbrisan']);
?>
