FROM node:22-slim AS builder

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./

RUN npm ci

COPY . .

# La URL debe ser la que el NAVEGADOR use para llegar al API (no el hostname interno de Docker)
ARG VITE_API_BASE_URL=http://localhost:4000/api
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

RUN npm run build

FROM nginx:stable-alpine AS runner

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

