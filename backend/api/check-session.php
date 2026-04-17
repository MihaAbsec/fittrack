<?php
session_start();

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

if (isset($_SESSION['user_id'])) {
    echo json_encode([
        'success' => true,
        'data' => [
            'logged_in' => true,
            'user_id' => $_SESSION['user_id'],
            'username' => $_SESSION['username'],
            'email' => $_SESSION['email']
        ]
    ]);
} else {
    echo json_encode([
        'success' => true,
        'data' => [
            'logged_in' => false
        ]
    ]);
}
?>
