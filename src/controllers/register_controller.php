<?php
    /*
        register_controller.php
        - backend of views/register.php
    */

    include('validate_password.php');

    // Called in <div class="register_container">
    function register(&$conn) {

        if ($_SERVER["REQUEST_METHOD"] == "POST") {
            // Collect and sanitize user input
            $email = filter_input(INPUT_POST, 'email', FILTER_SANITIZE_EMAIL);
            $first_name = trim($_POST['first_name']);
            $last_name = trim($_POST['last_name']);
            $error = "";

            // Collect the password and hash it
            $password = $_POST['password'];
            $confirm_password = $_POST['confirm_password'];
            $hash = password_hash($password, PASSWORD_DEFAULT); 

            // Validate email format
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                $error = "Invalid email format";
            }
            // Validate the password
            elseif (!passwordIsValid($conn, $email, $password, $confirm_password, $error)) {
                // Error is already set inside passwordIsValid function
            }

            // If no errors, proceed with registration
            if (empty($error)) {
                // STORED PROCEDURE: CALL sp_add_user
                $stmt = $conn->prepare("CALL sp_add_user(?, ?, ?, ?)");

                // Bind the email, first name, last name, and hashed password
                $stmt->bind_param("ssss", $email, $first_name, $last_name, $hash);

                if ($stmt->execute()) {
                    $success = "Account created successfully!";

                    // Store password in OLD_PASSWORDS TABLE to prevent future reuse
                    $pass_stmt = $conn->prepare("CALL sp_record_password(?, ?)");
                    $pass_stmt->bind_param("ss", $email, $hash);
                    $pass_stmt->execute();
                } else {
                    $error = "Error: " . $stmt->error;
                }

                $stmt->close();
            }

            $conn->close();
        }

        // If Successful, user proceeds to login
        if (isset($success)) {
            header("Location: login.php");
            exit();
        } elseif (isset($error)) {
            // If error contains new lines, replace them with actual line breaks in the alert
            $error_message = str_replace("\n", '\\n', $error);
            echo "<script>alert('{$error_message}');</script>";
        }
    }
?>