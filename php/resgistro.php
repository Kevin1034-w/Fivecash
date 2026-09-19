<?php
/**
 * Five Cash - Platform Suite
 * MOdulo de Registro de Usuarios y Empresas
 * Lenguaje: PHP
 */

require_once __DIR__ . '/db.php';

// Permitir solicitudes CORS para entornos de prueba
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}



// Obtener los datos JSON o POST convencional
$rawInput = file_get_contents('php://input');
$inputData = json_decode($rawInput, true);

if (!$inputData && !empty($_POST)) {
    $inputData = $_POST;
}

$nombre = trim($inputData['nombre'] ?? '');
$empresa = trim($inputData['empresa'] ?? '');
$email = trim($inputData['email'] ?? '');
$password = $inputData['password'] ?? '';
$confirmPassword = $inputData['confirm_password'] ?? $password;
$rol = trim($inputData['rol'] ?? 'administradora');

// Normalizar y validar rol de jerarquía
$rolesPermitidos = ['administradora', 'empleado', 'tecnico'];
if (!in_array(strtolower($rol), $rolesPermitidos)) {
    $rol = 'administradora';
}

// 1. Validaciones basicas de campos

try {
    // 2. Comprobar si el correo ya esta registrado en la base de datos
    $stmtCheck = $pdo->prepare("SELECT id FROM usuarios WHERE email = :email LIMIT 1");
    $stmtCheck->execute([':email' => $email]);
    

    // 3. Encriptacion segura de la contrasena mediante Bcrypt (PASSWORD_DEFAULT)
    $passwordHash = password_hash($password, PASSWORD_DEFAULT);

    // 4. Insercion del nuevo usuario con su jerarquia seleccionada
    try {
        $stmtInsert = $pdo->prepare("
            INSERT INTO usuarios (nombre, empresa, email, password_hash, rol, creado_en)
            VALUES (:nombre, :empresa, :email, :password_hash, :rol, datetime('now'))
        ");
        $stmtInsert->execute([
            ':nombre' => $nombre,
            ':empresa' => $empresa,
            ':email' => $email,
            ':password_hash' => $passwordHash,
            ':rol' => $rol
        ]);
    } catch (Exception $eSql) {
        // Fallback para MySQL
        $stmtInsertMySQL = $pdo->prepare("
            INSERT INTO usuarios (nombre, empresa, email, password_hash, rol)
            VALUES (:nombre, :empresa, :email, :password_hash, :rol)
        ");
        $stmtInsertMySQL->execute([
            ':nombre' => $nombre,
            ':empresa' => $empresa,
            ':email' => $email,
            ':password_hash' => $passwordHash,
            ':rol' => $rol
        ]);
    }

    $nuevoUsuarioId = $pdo->lastInsertId();

    // 5. El usuario recien registrado inicia TODO en cero (sin saldos ficticios)
    // No se crean cuentas con saldo precargado. Todo comienza en $0.00 como solicitó el usuario.

    // 6. Respuesta exitosa estructurada en JSON
    

} 
