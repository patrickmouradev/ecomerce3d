import os
import subprocess
import sys

def run_command(command, cwd=None):
    print(f"Executando: {command} em {cwd if cwd else os.getcwd()}")
    process = subprocess.Popen(command, shell=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, cwd=cwd)
    
    while True:
        output = process.stdout.readline()
        if output == '' and process.poll() is not None:
            break
        if output:
            print(output.strip())
            
    rc = process.poll()
    return rc

def main():
    workspace_dir = os.path.dirname(os.path.abspath(__file__))
    api_dir = os.path.join(workspace_dir, "ecommerce-api")
    
    print("=== INICIANDO BUILD DO BACK-END (ecommerce-api) ===")
    
    # 1. Compilação Maven do projeto
    print("\n[Etapa 1] Executando Maven Clean Package...")
    # Executa com wrapper ou maven global instalado na máquina
    maven_cmd = "mvn clean package -DskipTests"
    
    rc_maven = run_command(maven_cmd, cwd=api_dir)
    if rc_maven != 0:
        print("\n[ERRO] Falha na compilação do Maven. Abortando.")
        sys.exit(rc_maven)
        
    print("\n[SUCESSO] Compilação concluída. Arquivo .jar gerado.")

    # 2. Geração da imagem Docker
    print("\n[Etapa 2] Criando Imagem Docker...")
    docker_cmd = "docker build -t ecommerce-api:latest ."
    
    rc_docker = run_command(docker_cmd, cwd=api_dir)
    if rc_docker != 0:
        print("\n[ERRO] Falha ao gerar imagem Docker do back-end.")
        sys.exit(rc_docker)

    print("\n=== [SUCESSO] Imagem 'ecommerce-api:latest' gerada com êxito! ===")

if __name__ == "__main__":
    main()
