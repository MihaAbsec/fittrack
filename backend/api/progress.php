<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once '../config/db.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'error' => ['message' => 'Niste prijavljeni', 'code' => 'AUTH_ERROR']]);
    exit;
}

$user_id     = $_SESSION['user_id'];
$exercise_id = isset($_GET['exercise_id']) ? intval($_GET['exercise_id']) : 0;
$conn        = db_connect();

if ($exercise_id === 0) {
    $sql = "SELECT DISTINCT el.id, el.name, el.muscle_group
            FROM session_logs sl
            JOIN workout_sessions ws ON sl.session_id = ws.id
            JOIN exercise_library el ON sl.exercise_id = el.id
            WHERE ws.user_id = ?
            ORDER BY el.muscle_group, el.name";
    $stmt = mysqli_prepare($conn, $sql);
    mysqli_stmt_bind_param($stmt, 'i', $user_id);
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);

    $exercises = [];
    while ($row = mysqli_fetch_assoc($result)) {
        $exercises[] = $row;
    }
    mysqli_stmt_close($stmt);
    db_close($conn);

    echo json_encode(['success' => true, 'data' => $exercises]);
    exit;
}

$sql = "SELECT 
            ws.session_date,
            MAX(sl.weight) as max_weight,
            MAX(sl.reps)   as max_reps,
            SUM(sl.reps)   as total_reps,
            COUNT(*)       as total_sets,
            el.name        as exercise_name
        FROM session_logs sl
        JOIN workout_sessions ws ON sl.session_id = ws.id
        JOIN exercise_library el ON sl.exercise_id = el.id
        WHERE ws.user_id = ? AND sl.exercise_id = ?
        GROUP BY ws.id
        ORDER BY ws.session_date ASC";

$stmt = mysqli_prepare($conn, $sql);
mysqli_stmt_bind_param($stmt, 'ii', $user_id, $exercise_id);
mysqli_stmt_execute($stmt);
$result = mysqli_stmt_get_result($stmt);

$progress = [];
while ($row = mysqli_fetch_assoc($result)) {
    $progress[] = $row;
}
mysqli_stmt_close($stmt);
db_close($conn);

echo json_encode(['success' => true, 'data' => $progress]);
?>
