# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files from backend directory
COPY backend/package*.json ./backend/

WORKDIR /app/backend
# Install dependencies
RUN npm ci

# Copy source code
COPY backend/ ./

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app/backend

COPY backend/package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy built assets
COPY --from=builder /app/backend/dist ./dist

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "run", "start:prod"]