# Build stage
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production=false

# Copy source code
COPY . .

# Set default build-time environment variables
ARG VITE_API_BASE_URL=http://localhost:3001
ARG VITE_MAIN_APP_URL=http://localhost:51235
ARG VITE_APP_TITLE="User Management"

# Set environment variables for build
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_MAIN_APP_URL=$VITE_MAIN_APP_URL
ENV VITE_APP_TITLE=$VITE_APP_TITLE

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Install envsubst for environment variable substitution
RUN apk add --no-cache gettext

# Copy built application from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create a script to handle environment variable substitution at runtime
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Set default runtime environment variables
ENV VITE_API_BASE_URL=http://localhost:3001
ENV VITE_MAIN_APP_URL=http://localhost:51235
ENV VITE_APP_TITLE="User Management"

# Expose port
EXPOSE 3002

# Use custom entrypoint script
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]