FROM eclipse-temurin:25-jre-alpine
WORKDIR /app

# Volume temporário
VOLUME /tmp

# Argumento para receber o caminho do JAR compilado
ARG JAR_FILE=target/*.jar
COPY ${JAR_FILE} app.jar

# Define fuso horário e fonece flags para Docker
ENV TZ=America/Sao_Paulo
ENV DOCKER=true

# Porta do Back-end ajustada
EXPOSE 8088

# Comando de inicialização
ENTRYPOINT ["java", "-jar", "app.jar"]
