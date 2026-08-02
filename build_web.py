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
    web_dir = os.path.join(workspace_dir, "ecommerce-web")
    
    print("=== INICIANDO BUILD DO FRONT-END (ecommerce-web) ===")
    
    # Geração da imagem Docker contendo o multi-stage build (Node -> Nginx)
    print("\n[Etapa Única] Construindo Imagem Docker com Compilação Integrada...")
    docker_cmd = "docker build -t ecommerce-web:latest ."
    
    rc_docker = run_command(docker_cmd, cwd=web_dir)
    if rc_docker != 0:
        print("\n[ERRO] Falha ao gerar imagem Docker do front-end.")
        sys.exit(rc_docker)

    print("\n=== [SUCESSO] Imagem 'ecommerce-web:latest' gerada com êxito! ===")

if __name__ == "__main__":
    main()
