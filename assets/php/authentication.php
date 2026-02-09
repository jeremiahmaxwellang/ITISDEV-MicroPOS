<?php 
/* 
    authentication.php
    - redirect user depending on role
*/

function redirectUser($user){
    // Redirect based on role
    if ($user['role'] == 'A' || $user['role'] == 'S') {
        header("Location: admin.php");
        exit();
    } 
    
    else {
        header("Location: property_listing.php");
        exit();
    }
}

// Log successful authentication to EVENT_LOGS table
function logAuthentication(&$conn, $email, $resource, $reason, $status) {

    $type = 'A'; // Authentication Log

    /*
        CREATE PROCEDURE sp_log_event
        IN this_type VARCHAR(1),
        IN this_user_email VARCHAR(254),
        IN this_resource TEXT,
        IN this_reason TEXT,
        IN this_result VARCHAR(10)
    
    */
    $log_stmt = $conn->prepare("CALL sp_log_event(?, ?, ?, ?, ?)");

    $log_stmt->bind_param("sssss", $type, $email, $resource, $reason, $status);
    $log_stmt->execute();

}
?>