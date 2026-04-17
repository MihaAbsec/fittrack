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
$conn = db_connect();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {

    $sql = "SELECT * FROM workout_templates WHERE user_id = ? ORDER BY created_at DESC";
    $stmt = mysqli_prepare($conn, $sql);
    mysqli_stmt_bind_param($stmt, 'i', $user_id);
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);

    $templates = [];
    while ($row = mysqli_fetch_assoc($result)) {
        $ex_sql = "SELECT te.id as te_id, el.id as exercise_id, el.name, el.muscle_group, el.equipment, te.sort_order
                   FROM template_exercises te
                   JOIN exercise_library el ON te.exercise_id = el.id
                   WHERE te.template_id = ?
                   ORDER BY te.sort_order";
        $ex_stmt = mysqli_prepare($conn, $ex_sql);
        mysqli_stmt_bind_param($ex_stmt, 'i', $row['id']);
        mysqli_stmt_execute($ex_stmt);
        $ex_result = mysqli_stmt_get_result($ex_stmt);

        $exercises = [];
        while ($ex = mysqli_fetch_assoc($ex_result)) {
            $exercises[] = $ex;
        }
        mysqli_stmt_close($ex_stmt);

        $row['exercises'] = $exercises;
        $templates[] = $row;
    }
    mysqli_stmt_close($stmt);
    db_close($conn);

    echo json_encode(['success' => true, 'data' => $templates]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    $data = json_decode(file_get_contents('php://input'), true);
    if (!$data || empty($data['name'])) {
        echo json_encode(['success' => false, 'error' => ['message' => 'Manjka ime šablona', 'code' => 'VALIDATION_ERROR']]);
        exit;
    }

    $name        = trim($data['name']);
    $description = isset($data['description']) ? trim($data['description']) : '';
    $exercises   = isset($data['exercises']) ? $data['exercises'] : [];   

    mysqli_begin_transaction($conn);

    $stmt = mysqli_prepare($conn, "INSERT INTO workout_templates (user_id, name, description) VALUES (?, ?, ?)");
    mysqli_stmt_bind_param($stmt, 'iss', $user_id, $name, $description);
    mysqli_stmt_execute($stmt);
    $template_id = mysqli_insert_id($conn);
    mysqli_stmt_close($stmt);

    if (!empty($exercises)) {
        $stmt = mysqli_prepare($conn, "INSERT INTO template_exercises (template_id, exercise_id, sort_order) VALUES (?, ?, ?)");
        foreach ($exercises as $idx => $ex_id) {
            mysqli_stmt_bind_param($stmt, 'iii', $template_id, $ex_id, $idx);
            mysqli_stmt_execute($stmt);
        }
        mysqli_stmt_close($stmt);
    }

    mysqli_commit($conn);
    db_close($conn);

    echo json_encode(['success' => true, 'message' => 'Šablon ustvari!', 'data' => ['template_id' => $template_id]]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {

    $template_id = isset($_GET['id']) ? intval($_GET['id']) : 0;
    if ($template_id === 0) {
        echo json_encode(['success' => false, 'error' => ['message' => 'Manjka ID', 'code' => 'VALIDATION_ERROR']]);
        exit;
    }

    $stmt = mysqli_prepare($conn, "SELECT id FROM workout_templates WHERE id = ? AND user_id = ?");
    mysqli_stmt_bind_param($stmt, 'ii', $template_id, $user_id);
    mysqli_stmt_execute($stmt);
    mysqli_stmt_store_result($stmt);
    if (mysqli_stmt_num_rows($stmt) === 0) {
        mysqli_stmt_close($stmt);
        db_close($conn);
        echo json_encode(['success' => false, 'error' => ['message' => 'Šablon ne obstaja', 'code' => 'NOT_FOUND']]);
        exit;
    }
    mysqli_stmt_close($stmt);

    mysqli_begin_transaction($conn);

    $stmt = mysqli_prepare($conn, "UPDATE workout_sessions SET template_id = NULL WHERE template_id = ?");
    mysqli_stmt_bind_param($stmt, 'i', $template_id);
    mysqli_stmt_execute($stmt);
    mysqli_stmt_close($stmt);

    $stmt = mysqli_prepare($conn, "DELETE FROM template_exercises WHERE template_id = ?");
    mysqli_stmt_bind_param($stmt, 'i', $template_id);
    mysqli_stmt_execute($stmt);
    mysqli_stmt_close($stmt);

    $stmt = mysqli_prepare($conn, "DELETE FROM workout_templates WHERE id = ?");
    mysqli_stmt_bind_param($stmt, 'i', $template_id);
    mysqli_stmt_execute($stmt);
    mysqli_stmt_close($stmt);

    mysqli_commit($conn);
    db_close($conn);

    echo json_encode(['success' => true, 'message' => 'Šablon izbrisan! Napredek vadb ostane shranjen.']);
    exit;
}

db_close($conn);
echo json_encode(['success' => false, 'error' => ['message' => 'Metoda ni dovoljena', 'code' => 'METHOD_ERROR']]);
?>
