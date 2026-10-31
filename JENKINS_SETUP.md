# Guia de Configuração das Pipelines no Jenkins (Loja 3D)

Este guia orienta o passo a passo para configurar as duas pipelines independentes (Back-end e Front-end) criadas para o projeto **Loja 3D**, incluindo o suporte à **escolha de branch** para deploy de homologação e produção.

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
   * `LOJA_MELHOR_ENVIO_API_URL`: URL da API do Melhor Envio (`https://sandbox.melhorenvio.com.br` ou produção).
   * `LOJA_MELHOR_ENVIO_TOKEN`: Token JWT da API do Melhor Envio.
   * `LOJA_MERCADO_PAGO_PUBLIC_KEY`: Chave pública do Mercado Pago.
   * `LOJA_MERCADO_PAGO_ACCESS_TOKEN`: Token de acesso privado do Mercado Pago.

---

## Passo 2: Configurar a Pipeline do Back-end (`loja3d-backend`)

1. No menu principal do Jenkins, clique em **Novo Job (New Item)**.
2. Defina o nome como `loja3d-backend`, selecione a opção **Pipeline** e clique em **OK**.
3. Na tela de configuração do Job:
   * (Recomendado) Marque a opção **"Este build é parametrizado" (This project is parameterized)**:
     - Clique em **Adicionar Parâmetro** $\rightarrow$ **Parâmetro de Sequência de Caracteres (String Parameter)**.
     - **Nome**: `BRANCH_NAME`
     - **Valor Padrão**: `main`
     - **Descrição**: `Nome da branch para checkout e build (ex: main, feature/integracao_mercadoPago)`
   * Role até a seção **Pipeline**:
     - Em *Definition*, selecione **Pipeline script from SCM**.
     - Em *SCM*, selecione **Git**.
     - Em *Repository URL*, insira a URL do repositório Git do projeto.
     - Em *Credentials*, selecione a credencial Git de acesso ao repositório.
     - Em *Branch Specifier*, preencha: `*/${BRANCH_NAME}` (ou `*/main`).
       > *Dica: Com `*/${BRANCH_NAME}`, o Jenkins buscará inclusive o próprio Jenkinsfile diretamente da branch que você informar no disparo do build!*
     - No campo **Script Path**, configure para: `ecommerce-api/Jenkinsfile`.
   * Desmarque a opção *Lightweight checkout* se estiver visível, garantindo resolução limpa de tags e branches.
4. Clique em **Salvar (Save)**.

---

## Passo 3: Configurar a Pipeline do Front-end (`loja3d-frontend`)

1. No menu do Jenkins, clique em **Novo Job (New Item)**.
2. Defina o nome como `loja3d-frontend`, selecione a opção **Pipeline** e clique em **OK**.
3. Na tela de configuração do Job:
   * (Recomendado) Marque a opção **"Este build é parametrizado"**:
     - Clique em **Adicionar Parâmetro** $\rightarrow$ **Parâmetro de Sequência de Caracteres (String Parameter)**.
     - **Nome**: `BRANCH_NAME`
     - **Valor Padrão**: `main`
     - **Descrição**: `Nome da branch para checkout e build (ex: main, feature/integracao_mercadoPago)`
   * Role até a seção **Pipeline**:
     - Em *Definition*, selecione **Pipeline script from SCM**.
     - Em *SCM*, selecione **Git**.
     - Preencha com a mesma *Repository URL* e credenciais.
     - Em *Branch Specifier*, preencha: `*/${BRANCH_NAME}` (ou `*/main`).
     - No campo **Script Path**, configure para: `ecommerce-web/Jenkinsfile`.
4. Clique em **Salvar (Save)**.

---

## Passo 4: Executar as Pipelines Escolhendo a Branch

1. No Jenkins, acesse o Job desejado (`loja3d-backend` ou `loja3d-frontend`).
2. No menu lateral, clique em **Construir com Parâmetros (Build with Parameters)**:
   * No campo `BRANCH_NAME`, digite o nome da branch que deseja testar ou subir (ex: `feature/integracao_mercadoPago` ou `main`).
   * Clique em **Construir (Build)**.
3. O pipeline fará o checkout automático da branch selecionada, compilará os binários específicos dessa branch, construirá as imagens Docker correspondentes e reiniciará o container com o código da branch escolhida!
