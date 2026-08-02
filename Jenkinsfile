pipeline {
    agent any

    environment {
        // ID da credencial do Jenkins que contém o Kubeconfig (tipo Secret File)
        KUBE_CREDENTIAL_ID = 'kubeconfig-servidor'
        // Nomes das Imagens Docker
        API_IMAGE = 'ecommerce-api:latest'
        WEB_IMAGE = 'ecommerce-web:latest'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build API') {
            steps {
                script {
                    echo "--- INICIANDO BUILD DA IMAGEM BACK-END (ecommerce-api) ---"
                    // Roda a build multi-stage utilizando o Docker host
                    sh "docker build -t ${API_IMAGE} ./ecommerce-api"
                }
            }
        }

        stage('Build Web') {
            steps {
                script {
                    echo "--- INICIANDO BUILD DA IMAGEM FRONT-END (ecommerce-web) ---"
                    // Roda a build do front-end utilizando o Docker host
                    sh "docker build -t ${WEB_IMAGE} ./ecommerce-web"
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                // Utiliza o plugin Kubernetes CLI para injetar a credencial do cluster com segurança
                withKubeConfig([credentialsId: KUBE_CREDENTIAL_ID]) {
                    echo "--- APLICANDO MANIFESTOS KUBERNETES ---"
                    sh "kubectl apply -f k8s/secret.yaml"
                    sh "kubectl apply -f k8s/postgres.yaml"
                    sh "kubectl apply -f k8s/api.yaml"
                    sh "kubectl apply -f k8s/web.yaml"
                    
                    echo "--- FORÇANDO ATUALIZAÇÃO DOS PODS NO CLUSTER ---"
                    sh "kubectl rollout restart deployment/ecommerce-api"
                    sh "kubectl rollout restart deployment/ecommerce-web"
                }
            }
        }
    }
}
