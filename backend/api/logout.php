<?php
session_start();

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$_SESSION = array();

if (isset($_COOKIE[session_name()])) {
    setcookie(session_name(), '', time() - 3600, '/');
}

session_destroy();

echo json_encode([
    'success' => true,
    'message' => 'Odjava uspešna!'
]);
?>
