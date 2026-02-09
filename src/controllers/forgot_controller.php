<?php
/**
 * forgot_password_helpers.php
 * 
 * Helper functions for the "Forgot Password" flow.
 */

// Database configuration
require_once('..\includes\dbconfig.php');

// ====== DB Connection ======
function db(): mysqli {
    global $conn; // Use the existing $conn from dbconfig.php
    return $conn; // Return the existing connection object
}

// ====== User Functions ======
function get_user_by_email(string $email): ?array {
    $sql = "SELECT email, password_hash, account_disabled FROM users WHERE email = ? LIMIT 1";
    $stmt = db()->prepare($sql);
    $stmt->bind_param('s', $email);
    $stmt->execute();
    $result = $stmt->get_result();
    return $result->fetch_assoc() ?: null;
}

?>