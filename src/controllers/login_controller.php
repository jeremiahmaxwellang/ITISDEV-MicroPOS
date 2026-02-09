<?php
/*
    login_controller.php 
    - backend for views/login.php
*/

include('authentication.php');

function login(&$conn) {
    $resource = "/login";
    $reason = "Wrong password entered";
    $status = "Fail";
    $fail_count = 0;

    // Start session if not already started
    if (session_status() == PHP_SESSION_NONE) {
        session_start();
    }

    echo "<script>console.log('Session is starting!!!');</script>";

    if ($_SERVER['REQUEST_METHOD'] == 'POST') {
        // Sanitize and validate input
        $email = filter_input(INPUT_POST, 'email', FILTER_SANITIZE_EMAIL);

        //Collect the password and hash it
        $password = $_POST['password'];

        echo "<script>console.log('Checking for valid email format!!!');</script>";
        // Check for valid email format
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            echo "<script>alert('Invalid email format');</script>";

        } else {

            // Check the number of failed login attempts in the last 5 minutes in the event_logs table
            $stmt = $conn->prepare("
                SELECT COUNT(*) AS fail_count 
                FROM event_logs 
                WHERE user_email = ? 
                AND result = 'Fail' 
                AND datetime > NOW() - INTERVAL 5 MINUTE
            ");
            $stmt->bind_param("s", $email);
            $stmt->execute();
            $stmt->bind_result($fail_count);
            $stmt->fetch();
            $stmt->close();

            // If the user has exceeded 5 failed login attempts in the last 5 minutes, lock the account
            if ($fail_count >= 5) {
                // Update account_disabled to 'Y' in the users table
                $stmt = $conn->prepare("UPDATE users SET account_disabled = 'Y' WHERE email = ?");
                $stmt->bind_param("s", $email);
                $stmt->execute();
                $stmt->close();

                echo "<script>alert('Your account has been locked due to too many failed login attempts in the last 5 minutes. Please contact support.');</script>";
                return;
            }

            echo "<script>console.log('Preparing SQL Statement to check for user credentials!!!');</script>";

            // ==================================================================
            // Code for Logging the login attempt to event_logs table 
            // ==================================================================

            // Prepare SQL statement to check user credentials
            $stmt = $conn->prepare("SELECT * FROM users WHERE email = ?");
            $stmt->bind_param("s", $email);

            // Execute SQL statement
            if($stmt->execute()){
                $success = "Sign-in successful!";
            } else {
                $error = "Error: " . $stmt->error;
            }

            $result = $stmt->get_result();

            if ($result->num_rows == 1) {
                $user = $result->fetch_assoc();
                $stored_hash = $user['password_hash'];

                echo "<script>console.log('User found, checking password hash!');</script>";

                // Check if the account is disabled
                if ($user['account_disabled'] == 'Y') {
                    echo "<script>alert('Your account is disabled. Please contact support.');</script>";
                    $stmt->close();
                    return;
                }

                echo "<script>console.log('Verifying password by comparing the hash of the input ');</script>";

                // Verify password by comparing the hash of the input vs the actual password hash
                if( password_verify($password, $user['password_hash']) ){

                    // Log successful authentication to EVENT_LOGS table
                    $reason = "Correct password submitted";
                    $status = "Success";
                    logAuthentication($conn, $user['email'], $resource, $reason, $status);
                    
                    // Set session variables
                    $_SESSION['user_email'] = $user['email'];
                    $_SESSION['first_name'] = $user['first_name'];
                    $_SESSION['last_name'] = $user['last_name'];
                    $_SESSION['user_role'] = $user['role'];
                    $_SESSION['logged_in'] = true;
                    $_SESSION['show_overlay'] = true; // Ensure overlay is set after login

                    redirectUser($user);
                        
                        
                } 
                // If login attempt Failed
                else {
                    
                    echo "<p class='error-message'>Invalid email or password</p>";
                    $status = "Fail";

                    // logAuthentication(&$conn, $email, $resource, $reason, $status)
                    logAuthentication($conn, $user['email'], $resource, $reason, $status);
                }

            } // end of if ($result->num_rows == 1)

            else {
                echo "<p class='error-message'>Invalid email or password</p>";
            }
                
                $stmt->close();
                $conn->close();
            }
        }

        // Display system messages
        if (isset($_GET['logout'])) {
            echo "<p class='success-message'>You have been successfully logged out.</p>";
        }

        if (isset($_GET['registered'])) {
            echo "<p class='success-message'>Registration successful! Please login.</p>";
        }

        if (isset($_GET['error'])) {
            echo "<p class='error-message'>" . htmlspecialchars($_GET['error']) . "</p>";
        }
}

?>