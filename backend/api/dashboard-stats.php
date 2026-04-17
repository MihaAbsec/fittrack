<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once '../config/db.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'error' => ['message' => 'Niste prijavljeni', 'code' => 'AUTH_ERROR']]);
    exit;
}

$user_id = $_SESSION['user_id'];
$conn    = db_connect();
$stats   = [];

$stmt = mysqli_prepare($conn, "SELECT COUNT(*) as cnt FROM workout_sessions WHERE user_id = ? AND MONTH(session_date) = MONTH(CURDATE()) AND YEAR(session_date) = YEAR(CURDATE())");
mysqli_stmt_bind_param($stmt, 'i', $user_id);
mysqli_stmt_execute($stmt);
$r = mysqli_stmt_get_result($stmt);
$stats['sessions_this_month'] = mysqli_fetch_assoc($r)['cnt'];
mysqli_stmt_close($stmt);

$stmt = mysqli_prepare($conn, "SELECT COUNT(*) as cnt FROM workout_sessions WHERE user_id = ?");
mysqli_stmt_bind_param($stmt, 'i', $user_id);
mysqli_stmt_execute($stmt);
$r = mysqli_stmt_get_result($stmt);
$stats['total_sessions'] = mysqli_fetch_assoc($r)['cnt'];
mysqli_stmt_close($stmt);

$today = date('Y-m-d');
$stmt = mysqli_prepare($conn, "SELECT COALESCE(SUM(calories), 0) as total FROM nutrition_entries WHERE user_id = ? AND entry_date = ?");
mysqli_stmt_bind_param($stmt, 'is', $user_id, $today);
mysqli_stmt_execute($stmt);
$r = mysqli_stmt_get_result($stmt);
$stats['calories_today'] = intval(mysqli_fetch_assoc($r)['total']);
mysqli_stmt_close($stmt);

$stmt = mysqli_prepare($conn, "SELECT current_weight_kg FROM user_profile WHERE user_id = ?");
mysqli_stmt_bind_param($stmt, 'i', $user_id);
mysqli_stmt_execute($stmt);
$r = mysqli_stmt_get_result($stmt);
$row = mysqli_fetch_assoc($r);
$stats['current_weight'] = $row ? $row['current_weight_kg'] : null;
mysqli_stmt_close($stmt);

$stmt = mysqli_prepare($conn, "SELECT ws.*, COALESCE(wt.name, ws.template_name, '(izbrisan šablon)') as template_name FROM workout_sessions ws LEFT JOIN workout_templates wt ON ws.template_id = wt.id WHERE ws.user_id = ? ORDER BY ws.session_date DESC LIMIT 5");
mysqli_stmt_bind_param($stmt, 'i', $user_id);
mysqli_stmt_execute($stmt);
$r = mysqli_stmt_get_result($stmt);
$recent = [];
while ($row = mysqli_fetch_assoc($r)) {
    $ls = mysqli_prepare($conn, "SELECT DISTINCT el.name FROM session_logs sl JOIN exercise_library el ON sl.exercise_id = el.id WHERE sl.session_id = ? LIMIT 3");
    mysqli_stmt_bind_param($ls, 'i', $row['id']);
    mysqli_stmt_execute($ls);
    $lr = mysqli_stmt_get_result($ls);
    $names = [];
    while ($n = mysqli_fetch_assoc($lr)) { $names[] = $n['name']; }
    mysqli_stmt_close($ls);
    $row['exercise_names'] = $names;
    $recent[] = $row;
}
mysqli_stmt_close($stmt);
$stats['recent_sessions'] = $recent;

db_close($conn);
echo json_encode(['success' => true, 'data' => $stats]);
?>
