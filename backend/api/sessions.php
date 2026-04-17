<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
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

    $template_id = isset($_GET['template_id']) ? intval($_GET['template_id']) : 0;
    $limit       = isset($_GET['limit'])       ? intval($_GET['limit'])       : 20;

    if ($template_id > 0) {
        $sql  = "SELECT ws.*,
                        COALESCE(wt.name, ws.template_name, '(izbrisan šablon)') AS template_name
                 FROM workout_sessions ws
                 LEFT JOIN workout_templates wt ON ws.template_id = wt.id
                 WHERE ws.user_id = ? AND ws.template_id = ?
                 ORDER BY ws.session_date DESC LIMIT ?";
        $stmt = mysqli_prepare($conn, $sql);
        mysqli_stmt_bind_param($stmt, 'iii', $user_id, $template_id, $limit);
    } else {
        $sql  = "SELECT ws.*,
                        COALESCE(wt.name, ws.template_name, '(izbrisan šablon)') AS template_name
                 FROM workout_sessions ws
                 LEFT JOIN workout_templates wt ON ws.template_id = wt.id
                 WHERE ws.user_id = ?
                 ORDER BY ws.session_date DESC LIMIT ?";
        $stmt = mysqli_prepare($conn, $sql);
        mysqli_stmt_bind_param($stmt, 'ii', $user_id, $limit);
    }

    mysqli_stmt_execute($stmt);
    $result   = mysqli_stmt_get_result($stmt);
    $sessions = [];

    while ($row = mysqli_fetch_assoc($result)) {
        $log_sql  = "SELECT sl.*, el.name as exercise_name, el.muscle_group
                     FROM session_logs sl
                     JOIN exercise_library el ON sl.exercise_id = el.id
                     WHERE sl.session_id = ?
                     ORDER BY sl.exercise_id, sl.set_number";
        $log_stmt = mysqli_prepare($conn, $log_sql);
        mysqli_stmt_bind_param($log_stmt, 'i', $row['id']);
        mysqli_stmt_execute($log_stmt);
        $log_result = mysqli_stmt_get_result($log_stmt);

        $logs = [];
        while ($log = mysqli_fetch_assoc($log_result)) { $logs[] = $log; }
        mysqli_stmt_close($log_stmt);

        $row['logs'] = $logs;
        $sessions[]  = $row;
    }
    mysqli_stmt_close($stmt);
    db_close($conn);

    echo json_encode(['success' => true, 'data' => $sessions]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    $data = json_decode(file_get_contents('php://input'), true);

    if (!$data || empty($data['template_id']) || empty($data['session_date'])) {
        echo json_encode(['success' => false, 'error' => ['message' => 'Manjkajo podatki', 'code' => 'VALIDATION_ERROR']]);
        exit;
    }

    $template_id  = intval($data['template_id']);
    $session_date = $data['session_date'];
    $duration     = isset($data['duration_minutes']) && $data['duration_minutes'] !== '' ? intval($data['duration_minutes']) : null;
    $notes        = isset($data['notes']) ? trim($data['notes']) : '';
    $logs         = isset($data['logs']) ? $data['logs'] : [];

    $tpl_name = '';
    $tn_stmt  = mysqli_prepare($conn, "SELECT name FROM workout_templates WHERE id = ? AND user_id = ?");
    mysqli_stmt_bind_param($tn_stmt, 'ii', $template_id, $user_id);
    mysqli_stmt_execute($tn_stmt);
    $tn_result = mysqli_stmt_get_result($tn_stmt);
    if ($tn_row = mysqli_fetch_assoc($tn_result)) { $tpl_name = $tn_row['name']; }
    mysqli_stmt_close($tn_stmt);

    mysqli_begin_transaction($conn);

    if ($duration !== null) {
        $stmt = mysqli_prepare($conn, "INSERT INTO workout_sessions (user_id, template_id, template_name, session_date, duration_minutes, notes) VALUES (?, ?, ?, ?, ?, ?)");
        mysqli_stmt_bind_param($stmt, 'iissis', $user_id, $template_id, $tpl_name, $session_date, $duration, $notes);
    } else {
        $stmt = mysqli_prepare($conn, "INSERT INTO workout_sessions (user_id, template_id, template_name, session_date, duration_minutes, notes) VALUES (?, ?, ?, ?, NULL, ?)");
        mysqli_stmt_bind_param($stmt, 'iisss', $user_id, $template_id, $tpl_name, $session_date, $notes);
    }
    mysqli_stmt_execute($stmt);
    $session_id = mysqli_insert_id($conn);
    mysqli_stmt_close($stmt);

    if (!empty($logs)) {
        $counters = [];
        foreach ($logs as $entry) {
            $ex_id  = intval($entry['exercise_id']);
            $reps   = intval($entry['reps']);
            $weight = (isset($entry['weight']) && $entry['weight'] !== '' && $entry['weight'] !== null)
                      ? floatval($entry['weight']) : null;

            if (!isset($counters[$ex_id])) $counters[$ex_id] = 0;
            $counters[$ex_id]++;
            $set_num = $counters[$ex_id];

            if ($weight !== null) {
                $stmt = mysqli_prepare($conn, "INSERT INTO session_logs (session_id, exercise_id, set_number, reps, weight) VALUES (?, ?, ?, ?, ?)");
                mysqli_stmt_bind_param($stmt, 'iiiid', $session_id, $ex_id, $set_num, $reps, $weight);
            } else {
                $stmt = mysqli_prepare($conn, "INSERT INTO session_logs (session_id, exercise_id, set_number, reps, weight) VALUES (?, ?, ?, ?, NULL)");
                mysqli_stmt_bind_param($stmt, 'iiii', $session_id, $ex_id, $set_num, $reps);
            }
            mysqli_stmt_execute($stmt);
            mysqli_stmt_close($stmt);
        }
    }

    mysqli_commit($conn);
    db_close($conn);

    echo json_encode(['success' => true, 'message' => 'Seja zabeleženа!', 'data' => ['session_id' => $session_id]]);
    exit;
}

db_close($conn);
echo json_encode(['success' => false, 'error' => ['message' => 'Metoda ni dovoljena', 'code' => 'METHOD_ERROR']]);
?>
