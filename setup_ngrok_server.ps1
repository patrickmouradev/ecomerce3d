<#
.SYNOPSIS
    Script de Instalação e Configuração do Ngrok como Serviço do Windows.
.DESCRIPTION
    Este script automatiza o download do Ngrok, configuração do token de acesso
    e instalação do serviço em background para manter a Loja 3D online na porta 80.
.NOTES
    Execute este script como Administrador na máquina servidora.
#>

# Forçar execução com privilégios de Administrador
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Warning "Este script precisa ser executado como ADMINISTRADOR."
    Write-Host "Por favor, abra o PowerShell como Administrador e execute novamente." -ForegroundColor Red
    Exit
}

Write-Host "=== CONFIGURAÇÃO DO NGROK NO SERVIDOR ===" -ForegroundColor Cyan

# 1. Obter os parâmetros de configuração
$authtoken = Read-Host "Digite ou cole o seu Authtoken do Ngrok"
if ([string]::IsNullOrWhiteSpace($authtoken)) {
    Write-Error "O Authtoken é obrigatório."
    Exit
}

$domain = Read-Host "Se você reservou um domínio estático gratuito no Ngrok (ex: loja.ngrok-free.app), digite-o aqui (ou deixe em branco para domínio dinâmico)"

# Definir caminhos
$installDir = "C:\ngrok"
$zipPath = "$env:TEMP\ngrok.zip"
$ngrokExe = "$installDir\ngrok.exe"

# 2. Baixar e instalar o Ngrok (caso não esteja no sistema)
if (-not (Get-Command "ngrok" -ErrorAction SilentlyContinue) -and -not (Test-Path $ngrokExe)) {
    Write-Host "Ngrok não detectado. Baixando a versão estável mais recente para Windows..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Force -Path $installDir | Out-Null
    
    # URL oficial do zip do ngrok para Windows de 64 bits
    $downloadUrl = "https://bin.equinox.io/c/b3qgseWD67d/ngrok-v3-stable-windows-amd64.zip"
    
    # Garantir TLS 1.2
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    Invoke-WebRequest -Uri $downloadUrl -OutFile $zipPath -UseBasicParsing
    
    Write-Host "Extraindo arquivos do instalador..." -ForegroundColor Yellow
    Expand-Archive -Path $zipPath -DestinationPath $installDir -Force
    Remove-Item $zipPath -Force
    
    # Adicionar o Ngrok ao PATH do Sistema se necessário
    $sysPath = [Environment]::GetEnvironmentVariable("Path", "Machine")
    if ($sysPath -notlike "*$installDir*") {
        [Environment]::SetEnvironmentVariable("Path", "$sysPath;$installDir", "Machine")
        $env:Path += ";$installDir"
        Write-Host "Ngrok adicionado ao PATH do Windows." -ForegroundColor Green
    }
} else {
    Write-Host "Ngrok já está instalado no sistema." -ForegroundColor Green
    if (Get-Command "ngrok" -ErrorAction SilentlyContinue) {
        $ngrokExe = (Get-Command "ngrok").Source
    }
}

# 3. Criar a pasta e arquivo de configuração do Ngrok
$configDir = "$env:LOCALAPPDATA\ngrok"
$configFile = "$configDir\ngrok.yml"
New-Item -ItemType Directory -Force -Path $configDir | Out-Null

Write-Host "Gerando o arquivo de configuração do Ngrok em: $configFile" -ForegroundColor Yellow

$ymlContent = @"
version: "3"
authtoken: $authtoken
tunnels:
  loja3d:
    proto: http
    addr: 80
"@

if (-not [string]::IsNullOrWhiteSpace($domain)) {
    # Remover protocolo se o usuário digitou ex: http://loja.ngrok-free.app
    $cleanDomain = $domain -replace "https?://", ""
    $ymlContent += "`n    domain: $cleanDomain"
    Write-Host "Usando o domínio estático configurado: $cleanDomain" -ForegroundColor Green
} else {
    Write-Host "Usando subdomínio dinâmico gerado aleatoriamente pelo Ngrok." -ForegroundColor Cyan
}

Set-Content -Path $configFile -Value $ymlContent -Encoding utf8

# 4. Parar e desinstalar serviços antigos caso existam para evitar conflitos
Write-Host "Verificando se já existe um serviço antigo do Ngrok ativo..." -ForegroundColor Yellow
& $ngrokExe service stop --config $configFile 2>$null | Out-Null
& $ngrokExe service uninstall --config $configFile 2>$null | Out-Null

# 5. Instalar o Ngrok como um Serviço do Windows
Write-Host "Instalando o Ngrok como um Serviço do Windows..." -ForegroundColor Yellow
& $ngrokExe service install --config $configFile
if ($LASTEXITCODE -eq 0) {
    Write-Host "Serviço do Ngrok instalado com sucesso!" -ForegroundColor Green
} else {
    Write-Error "Falha ao instalar o serviço do Ngrok."
    Exit
}

# 6. Iniciar o Serviço do Ngrok
Write-Host "Iniciando o Serviço do Ngrok..." -ForegroundColor Yellow
& $ngrokExe service start --config $configFile
if ($LASTEXITCODE -eq 0) {
    Write-Host "Serviço do Ngrok iniciado com sucesso e rodando em background!" -ForegroundColor Green
} else {
    Write-Error "Falha ao iniciar o serviço do Ngrok."
    Exit
}

# 7. Instruções Finais
Write-Host "`n=== SETUP CONCLUÍDO ===" -ForegroundColor Green
Write-Host "O Ngrok está rodando como um serviço do Windows."
Write-Host "Ele iniciará automaticamente sempre que o computador for ligado."
Write-Host "Para verificar o link público gerado, acesse o painel:"
Write-Host "https://dashboard.ngrok.com/tunnels/agents" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Green
