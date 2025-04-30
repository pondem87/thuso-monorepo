FROM node:22-alpine3.20

WORKDIR /usr/local/app

# Set NODE_ENV to production
ENV NODE_ENV=production

COPY ./package.json ./

# Install dependencies in production mode
RUN npm install

COPY ./dist/apps ./apps

COPY ./ssl ./ssl

EXPOSE 3000