# Use a multi-stage build to reduce the final image size

# Stage 1: Build the React app
FROM node:23-alpine AS build

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++ libc6-compat

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with workaround for rollup Alpine issue
RUN rm -rf node_modules package-lock.json && \
    npm install && \
    npm rebuild

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Serve the app with Nginx
FROM nginx:stable-alpine

# Define build arguments for your Firebase config
ARG FIREBASE_API_KEY
ARG FIREBASE_AUTH_DOMAIN
ARG FIREBASE_DATABASE_URL
ARG FIREBASE_PROJECT_ID
ARG FIREBASE_STORAGE_BUCKET
ARG FIREBASE_MESSAGING_SENDER_ID
ARG FIREBASE_APP_ID
ARG FIREBASE_MEASUREMENT_ID
ARG VITE_API_BASE_URL

# Set environment variables within the build context using the build arguments
ENV FIREBASE_API_KEY=$FIREBASE_API_KEY
ENV FIREBASE_AUTH_DOMAIN=$FIREBASE_AUTH_DOMAIN
ENV FIREBASE_DATABASE_URL=$FIREBASE_DATABASE_URL
ENV FIREBASE_PROJECT_ID=$FIREBASE_PROJECT_ID
ENV FIREBASE_STORAGE_BUCKET=$FIREBASE_STORAGE_BUCKET
ENV FIREBASE_MESSAGING_SENDER_ID=$FIREBASE_MESSAGING_SENDER_ID
ENV FIREBASE_APP_ID=$FIREBASE_APP_ID
ENV FIREBASE_MEASUREMENT_ID=$FIREBASE_MEASUREMENT_ID
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY --from=build /app/dist /usr/share/nginx/html

# Substitute environment variables in index.html
RUN envsubst < /usr/share/nginx/html/index.html > /usr/share/nginx/html/index.html.tmp && \
    mv /usr/share/nginx/html/index.html.tmp /usr/share/nginx/html/index.html

# Copy the Nginx config file.
COPY default.conf /etc/nginx/conf.d/default.conf

# Expose the port that Nginx is listening on
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]