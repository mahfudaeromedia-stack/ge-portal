$ErrorActionPreference = 'Stop'
$root = [System.IO.Path]::GetFullPath($PSScriptRoot)
$port = 8765
$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()
Start-Process "http://localhost:$port/index.html"
Write-Host "Ground Experience Portal berjalan di http://localhost:$port/"
Write-Host "Biarkan jendela ini terbuka. Tekan Ctrl+C untuk menutup portal."
$mime = @{'.html'='text/html; charset=utf-8';'.js'='text/javascript; charset=utf-8';'.css'='text/css; charset=utf-8';'.json'='application/json';'.png'='image/png';'.jpg'='image/jpeg';'.jpeg'='image/jpeg';'.webp'='image/webp';'.svg'='image/svg+xml';'.wasm'='application/wasm';'.gz'='application/gzip';'.woff2'='font/woff2';'.pdf'='application/pdf'}
try {
  while ($listener.IsListening) {
    $context = $listener.GetContext()
    $relative = [Uri]::UnescapeDataString($context.Request.Url.AbsolutePath.TrimStart('/'))
    if ([string]::IsNullOrWhiteSpace($relative)) { $relative = 'index.html' }
    $path = [System.IO.Path]::GetFullPath((Join-Path $root $relative.Replace('/', [System.IO.Path]::DirectorySeparatorChar)))
    if (!$path.StartsWith($root, [System.StringComparison]::OrdinalIgnoreCase) -or !(Test-Path -LiteralPath $path -PathType Leaf)) {
      $context.Response.StatusCode = 404
      $bytes = [Text.Encoding]::UTF8.GetBytes('404 - File tidak ditemukan')
    } else {
      $context.Response.StatusCode = 200
      $ext = [System.IO.Path]::GetExtension($path).ToLowerInvariant()
      $context.Response.ContentType = $(if ($mime.ContainsKey($ext)) { $mime[$ext] } else { 'application/octet-stream' })
      $context.Response.Headers['Cache-Control'] = 'no-cache'
      $bytes = [System.IO.File]::ReadAllBytes($path)
    }
    $context.Response.ContentLength64 = $bytes.Length
    $context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    $context.Response.OutputStream.Close()
  }
} finally {
  $listener.Stop()
  $listener.Close()
}
