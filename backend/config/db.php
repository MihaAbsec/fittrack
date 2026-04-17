<?php
define('DB_HOST', 'localhost');
define('DB_USER', 'miha');
define('DB_PASS', '2617');
define('DB_NAME', 'fittrack');

function db_connect() {
    $conn = mysqli_connect(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    
    if (!$conn) {
        die(json_encode([
            'success' => false,
            'error' => [
                'message' => 'Napaka pri povezavi z bazo: ' . mysqli_connect_error(),
                'code' => 'DATABASE_ERROR'
            ]
        ]));
    }
    
    mysqli_set_charset($conn, 'utf8mb4');
    
    return $conn;
}

function db_close($conn) {
    if ($conn) {
        mysqli_close($conn);
    }
}
?>
