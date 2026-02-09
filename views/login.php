<?php
// Database configuration
// require_once('../includes/dbconfig.php');
// include('../src/controllers/login_controller.php');

// session_start();

?>

<!DOCTYPE html>
<html>
<head>
    <title>Login Page - MicroPOS</title>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" rel="stylesheet">
    <!-- <link rel="stylesheet" href="../assets/css/style.css"> -->
</head>
<body>
    <div class="login-bg-gradient"></div>

    <div class="login_container">
        <h2 class="login_subtitle">LOGIN WITH YOUR <span style="color: CornflowerBlue;">MicroPOS</span> ACCOUNT</h2>

        <div class="login_separator"></div>

        <div class="login_formDiv">

            <form method="post" action="" class="login_form" id="loginForm">
                <label for="email" class="login_label">Email:</label>
                <input type="email" id="email" name="email" class="login_input" required placeholder="Enter your Email">
                
                <label for="password" class="login_label">Password:</label>
                <input type="password" id="password" name="password" class="login_input" required placeholder="Enter your Password">
                
                <button type="submit" class="login_button">Sign In</button>
                
                <p class="register_prompt">Don't have an account yet? <a href="register.php" class="register_link">Register</a></p>
                <p class="register_prompt">Forgot password? <a href="forgot_password.php" class="register_link">Reset here</a></p>
            </form>
        </div>
    </div>

</body>
</html>