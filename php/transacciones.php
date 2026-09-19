<?php
/**
 * Five Cash - Platform Suite
 * API CRUD para Movimientos, Cuentas, Pagos y Nómina
 * Lenguaje: PHP
 */

require_once __DIR__ . '/db.php';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$action = $_GET['action'] ?? '';
$usuarioId = isset($_GET['usuario_id']) ? (int)$_GET['usuario_id'] : 1;

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true) ?: $_POST;

try {
    switch ($action) {
        // -------------------------------------------------------------
        // TRANSACCIONES
        // -------------------------------------------------------------
        case 'get_transacciones':
            $stmt = $pdo->prepare("SELECT * FROM transacciones WHERE usuario_id = :uid ORDER BY fecha DESC, id DESC");
            $stmt->execute([':uid' => $usuarioId]);
            $rows = $stmt->fetchAll();
        
        case 'create_transaccion':
            $tipo = $data['tipo'] ?? 'egreso';
            $concepto = trim($data['concepto'] ?? '');
            $categoria = trim($data['categoria'] ?? 'General');
            $monto = (float)($data['monto'] ?? 0);
            $fecha = $data['fecha'] ?? date('Y-m-d');
            $cuentaId = !empty($data['cuenta_id']) ? (int)$data['cuenta_id'] : null;

           

            // Iniciar transacción SQL para garantizar integridad de saldo en cuenta
            $pdo->beginTransaction();

            $stmt = $pdo->prepare("
                INSERT INTO transacciones (usuario_id, cuenta_id, tipo, concepto, categoria, monto, fecha)
                VALUES (:uid, :cuenta_id, :tipo, :concepto, :categoria, :monto, :fecha)
            ");
            $stmt->execute([
                ':uid' => $usuarioId,
                ':cuenta_id' => $cuentaId,
                ':tipo' => $tipo,
                ':concepto' => $concepto,
                ':categoria' => $categoria,
                ':monto' => $monto,
                ':fecha' => $fecha
            ]);
            $txId = $pdo->lastInsertId();

            // Actualizar saldo de la cuenta si se especificó
            if ($cuentaId) {
                if ($tipo === 'ingreso') {
                    $stmtUpd = $pdo->prepare("UPDATE cuentas_bancarias SET saldo = saldo + :monto WHERE id = :cid");
                } else {
                    $stmtUpd = $pdo->prepare("UPDATE cuentas_bancarias SET saldo = saldo - :monto WHERE id = :cid");
                }
                $stmtUpd->execute([':monto' => $monto, ':cid' => $cuentaId]);
            }

            $pdo->commit();

            break;

        // -------------------------------------------------------------
        // CUENTAS BANCARIAS
        // -------------------------------------------------------------
        case 'get_cuentas':
            $stmt = $pdo->prepare("SELECT * FROM cuentas_bancarias WHERE usuario_id = :uid ORDER BY id ASC");
            $stmt->execute([':uid' => $usuarioId]);

        case 'create_cuenta':
            $banco = trim($data['banco'] ?? '');
            $tipo = trim($data['tipo'] ?? 'Débito');
            $numero = trim($data['numero'] ?? '****');
            $saldo = (float)($data['saldo'] ?? 0);

            $stmt = $pdo->prepare("
                INSERT INTO cuentas_bancarias (usuario_id, banco, tipo, numero_cuenta, saldo, divisa, estado)
                VALUES (:uid, :banco, :tipo, :num, :saldo, 'MXN', 'activo')
            ");
            $stmt->execute([
                ':uid' => $usuarioId,
                ':banco' => $banco,
                ':tipo' => $tipo,
                ':num' => $numero,
                ':saldo' => $saldo
            ]);

           

        // -------------------------------------------------------------
        // PAGOS Y COBROS
        // -------------------------------------------------------------
        case 'get_pagos':
            $stmt = $pdo->prepare("SELECT * FROM pagos_programados WHERE usuario_id = :uid ORDER BY fecha_vencimiento ASC");
            $stmt->execute([':uid' => $usuarioId]);
            

        // -------------------------------------------------------------
        // NÓMINA
        // -------------------------------------------------------------
        case 'get_nomina':
            $stmt = $pdo->prepare("SELECT * FROM empleados_nomina WHERE usuario_id = :uid ORDER BY id ASC");
            $stmt->execute([':uid' => $usuarioId]);
           
    }
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
  
}