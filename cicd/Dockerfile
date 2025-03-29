FROM node:22-alpine3.20

WORKDIR /usr/local/app

# Set NODE_ENV to production
ENV NODE_ENV=production

COPY ./package.json ./

# Install dependencies in production mode
RUN npm install

COPY ./dist/apps/management ./management
COPY ./dist/apps/thuso-whatsapp ./thuso-whatsapp
COPY ./dist/apps/thuso-ai ./thuso-ai

COPY ./ssl ./ssl

EXPOSE 3000