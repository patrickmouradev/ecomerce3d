# Guia de Configuração das Pipelines no Jenkins (Loja 3D)

Este guia orienta o passo a passo para configurar as duas pipelines independentes (Back-end e Front-end) criadas para o projeto **Loja 3D**.

---

## Passo 1: Cadastrar as Credenciais no Jenkins

O Back-end requer chaves de API e acessos ao banco de dados configurados de forma segura nas credenciais globais do Jenkins.

1. Acesse o painel principal do seu **Jenkins**.
2. Vá em **Gerenciar Jenkins (Manage Jenkins)** $\rightarrow$ **Credentials** $\rightarrow$ **System** $\rightarrow$ **Global credentials**.
3. Adicione as credenciais do tipo **Secret text** preenchendo os seguintes IDs idênticos aos listados abaixo:
   * `LOJA_DB_URL`: String de conexão JDBC (Ex: `jdbc:postgresql://host.docker.internal:5432/ecommerce_db`)
   * `LOJA_DB_USERNAME`: Usuário do banco de dados.
   * `LOJA_DB_PASSWORD`: Senha do banco de dados.
   * `LOJA_CRYPT_SECRET_KEY`: Chave secreta de criptografia utilizada pelo backend.
   * `LOJA_ADMIN_FIRST_EMAIL`: E-mail padrão do administrador.
   * `LOJA_CORREIOS_API_URL`: URL da API externa dos Correios/frete.
   * `LOJA_MERCADO_PAGO_PUBLIC_KEY`: Chave pública do Mercado Pago.
   * `LOJA_MERCADO_PAGO_ACCESS_TOKEN`: Token de acesso privado do Mercado Pago.

---

## Passo 2: Configurar a Pipeline do Back-end

1. No menu principal do Jenkins, clique em **Novo Job (New Item)**.
2. Defina o nome como `loja3d-backend`, selecione a opção **Pipeline** e clique em **OK**.
3. Na tela de configuração do Job:
   * Vá até a seção **Pipeline**.
   * Em *Definition*, selecione **Pipeline script from SCM**.
   * Em *SCM*, selecione **Git**.
   * Em *Repository URL*, insira o caminho do repositório Git do projeto.
   * Em *Branch Specifier*, defina a branch apropriada (ex: `*/main` ou `*/master`).
   * No campo **Script Path**, configure para: `ecommerce-api/Jenkinsfile` (isso forçará o Jenkins a ler a pipeline localizada dentro da subpasta).
4. Clique em **Salvar (Save)**.

---

## Passo 3: Configurar a Pipeline do Front-end

1. No menu do Jenkins, clique em **Novo Job (New Item)**.
2. Defina o nome como `loja3d-frontend`, selecione a opção **Pipeline** e clique em **OK**.
3. Na tela de configuração do Job:
   * Vá até a seção **Pipeline**.
   * Em *Definition*, selecione **Pipeline script from SCM**.
   * Em *SCM*, selecione **Git**.
   * Preencha com a mesma *Repository URL* e a branch especificada na pipeline anterior.
   * No campo **Script Path**, configure para: `ecommerce-web/Jenkinsfile`.
4. Clique em **Salvar (Save)**.

---

## Passo 4: Executar as Pipelines

Como o front-end consome os serviços expostos pela API, a ordem recomendada de build é:

1. Vá ao Job `loja3d-backend` e clique em **Construir Agora (Build Now)**.
   * O Jenkins efetuará a compilação do Maven, gerará a imagem Docker e fará o deploy do container do backend escutando na porta **`8088`** na rede interna `jenkins_jenkins_net`.
2. Após o término bem-sucedido do back-end, acesse o Job `loja3d-frontend` e clique em **Construir Agora (Build Now)**.
   * Ele empacotará os estáticos do React, montará o servidor Nginx e executará o container mapeado na porta externa **`3002`**.
