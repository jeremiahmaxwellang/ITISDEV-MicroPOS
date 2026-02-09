<?php
// Database configuration
require_once('../../includes/dbconfig.php');

if($_SERVER["REQUEST_METHOD"] === "POST" && isset($_POST['id'])){
    // Sanitize ID
    $id = intval($_POST['id']);

    $stmt = $conn->prepare("DELETE FROM properties WHERE property_id = ?");
    $stmt->bind_param("i", $id);

    $stmt->execute();

    $stmt->close();
    $conn->close();
}
?>