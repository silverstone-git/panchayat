# Stage 1: Build the React application
FROM oven/bun:1 as builder
WORKDIR /app
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

# Stage 2: Serve the application with Nginx
FROM nginx:alpine
# Copy the built assets from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html
# Expose the port nginx is reachable on
EXPOSE 80
# Let Nginx start automatically
CMD ["nginx", "-g", "daemon off;"]
