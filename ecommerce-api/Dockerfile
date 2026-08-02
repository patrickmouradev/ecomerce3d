# Estágio 1: Build da aplicação usando JDK 25 e Maven
FROM maven:3.9.9-eclipse-temurin-25-alpine AS build
WORKDIR /app

# Copia arquivos do Maven e código fonte
COPY pom.xml .
COPY src ./src

# Compila o projeto omitindo testes para o build inicial de imagem
RUN mvn clean package -DskipTests

# Estágio 2: Ambiente de Execução leve (JRE)
FROM eclipse-temurin:25-jre-alpine
WORKDIR /app

# Copia o artefato .jar gerado no primeiro estágio
COPY --from=build /app/target/ecommerce-api-1.0.0.jar app.jar

# Define porta padrão
EXPOSE 8080

# Comando de inicialização
ENTRYPOINT ["java", "-jar", "app.jar"]
