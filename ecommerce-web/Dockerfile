# Estágio 1: Build estático com Node.js
FROM node:22-alpine AS build
WORKDIR /app

# Instala as dependências primeiro
COPY package*.json ./
RUN npm install

# Copia código fonte e gera o build de produção via Vite
COPY . .
RUN npm run build

# Estágio 2: Servidor Nginx para entrega estática
FROM nginx:alpine

# Copia arquivos estáticos para o diretório padrão do Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Copia configuração customizada do Nginx contendo fallbacks de rotas SPA e proxy reverso
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Porta padrão exposta
EXPOSE 80

# Inicializa o Nginx
CMD ["nginx", "-g", "daemon off;"]
