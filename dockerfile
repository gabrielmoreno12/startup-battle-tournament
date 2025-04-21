# 1. Base image oficial do Node (versão LTS, pequena em size)
FROM node:22-alpine

# 2. Define o diretório de trabalho dentro do container
WORKDIR /usr/src/app

# 3. Copia package.json e package-lock.json primeiro (para aproveitar cache do Docker)
COPY package*.json ./

# 4. Instala só as dependências (em produção): mais rápido e image menor
RUN npm ci --only=production

# 5. Copia todo o resto da aplicação para dentro do container
COPY . .

# 6. Expõe a porta em que sua aplicação roda (3000 por padrão)
EXPOSE 3000

# 7. Comando que será executado quando o container iniciar
CMD ["npm", "start"]
