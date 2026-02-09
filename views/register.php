<?php
    // Database configuration
    require_once('../includes/dbconfig.php');
    // include('../assets/php/register_controller.php');
?>

<!DOCTYPE html>
<html>
<head>
    <title>Register Page</title>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" rel="stylesheet">
    <!-- <link rel="stylesheet" href="../assets/css/style.css"> -->
</head>
<body class="register-body">
    <div class="login-bg-gradient"></div>

<body>
    <div class="login-bg-gradient"></div>

    <div class="register_container">
        <h2 class="register_subtitle">REGISTER YOUR <span style="color: CornflowerBlue;">MicroPOS</span> ACCOUNT</h2>
        <div class="register_separator"></div>

        <form method="post" action="">
            <div class="register_name_row">
                <div class="register_name_column">
                    <label for="first_name" class="register_label">First Name</label>
                    <input type="text" id="first_name" name="first_name" class="register_input" required placeholder="Enter your First Name">
                </div>
                <div class="register_name_column">
                    <label for="last_name" class="register_label">Last Name</label>
                    <input type="text" id="last_name" name="last_name" class="register_input" required placeholder="Enter your Last Name">
                </div>
            </div>

            <div class="register_field_group">
                <label for="email" class="register_label">Email</label>
                <input type="email" id="email" name="email" class="register_input" required placeholder="example@email.com">
            </div>

            <div class="register_field_group">
                <label for="password" class="register_label">Enter Password</label>
                <input type="password" id="password" name="password" class="register_input" required placeholder="Enter your Password">
            </div>

            <div class="register_field_group">
                <label for="confirm_password" class="register_label">Re-enter Password</label>
                <input type="password" id="confirm_password" name="confirm_password" class="register_input" required placeholder="Re-enter your Password">
            </div>

            <button type="submit" class="register_button">Register Account</button>

            <p class="register_prompt">
                Already have an account? <a href="login.php">Login</a>
            </p>
        </form>
    </div>

</body>
</html>