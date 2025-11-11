<?php
/**
 * API PHP para receber e salvar arquivos de transcrição via POST
 * Endpoint: POST /api/transcripts/upload.php
 * 
 * Body JSON:
 * {
 *   playlistId: string,
 *   videoId: string,
 *   content: string (conteúdo SRT)
 * }
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Método não permitido. Use POST.']);
    exit;
}

try {
    // Ler body JSON
    $body = file_get_contents('php://input');
    $data = json_decode($body, true);
    
    if (!$data) {
        throw new Exception('JSON inválido');
    }
    
    $playlistId = $data['playlistId'] ?? null;
    $videoId = $data['videoId'] ?? null;
    $content = $data['content'] ?? null;
    
    // Validação
    if (!$playlistId || !$videoId || !$content) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'playlistId, videoId e content são obrigatórios'
        ]);
        exit;
    }
    
    // Definir estrutura de pastas: public/transcripts/{playlistId}/{videoId}.srt
    $playlistFolder = $playlistId ?: 'standalone';
    $baseDir = __DIR__ . '/../../transcripts';
    $transcriptDir = $baseDir . '/' . $playlistFolder;
    $transcriptFilePath = $transcriptDir . '/' . $videoId . '.srt';
    
    // Criar diretório se não existir
    if (!is_dir($transcriptDir)) {
        if (!mkdir($transcriptDir, 0755, true)) {
            throw new Exception('Erro ao criar diretório: ' . $transcriptDir);
        }
    }
    
    // Salvar arquivo
    if (file_put_contents($transcriptFilePath, $content) === false) {
        throw new Exception('Erro ao salvar arquivo: ' . $transcriptFilePath);
    }
    
    // Retornar sucesso
    echo json_encode([
        'success' => true,
        'message' => 'Transcrição salva com sucesso',
        'path' => '/transcripts/' . $playlistFolder . '/' . $videoId . '.srt',
        'filePath' => $transcriptFilePath
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Erro ao processar requisição',
        'details' => $e->getMessage()
    ]);
}
?>

