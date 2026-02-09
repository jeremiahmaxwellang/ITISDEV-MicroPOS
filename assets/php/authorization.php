<?php
function adminAccess(&$conn){
    $resource = "/admin";
    $reason = "Non-admin user attempted unauthorized access";
    $status = "Fail";

    if ($_SESSION['user_role'] == 'A' || $_SESSION['user_role'] == 'S') {
        $reason = "Authorized admin user accessed resource";
        $status = "Success";
        logAuthorization($conn, $_SESSION['user_email'], $resource, $reason, $status);
    }
    
    else {
        // Log access control failure
        logAuthorization($conn, $_SESSION['user_email'], $resource, $reason, $status);

        if($_SESSION['user_role'] == 'C'){
            header("Location: property_listing.php");
            exit();
        }
        else{
            header("Location: login.php");
            exit();
        } 

    }
}

function customerAccess(&$conn, $resource){
    $reason = "User without role attempted unauthorized access";
    $status = "Fail";

    if ($_SESSION['user_role'] != 'C') {
        header("Location: login.php");
        logAuthorization($conn, $_SESSION['user_email'], $resource, $reason, $status);
        exit();
    }
    else {
        $reason = "Logged-in customer user accessed resource";
        $status = "Success";
        logAuthorization($conn, $_SESSION['user_email'], $resource, $reason, $status);    
    }
}

// Log access control event to EVENT_LOGS table
function logAuthorization(&$conn, $email, $resource, $reason, $status) {

    $type = 'C'; // ACCESS CONTROL Log

    $log_stmt = $conn->prepare("CALL sp_log_event(?, ?, ?, ?, ?)");

    $log_stmt->bind_param("sssss", $type, $email, $resource, $reason, $status);
    $log_stmt->execute();

}

?>