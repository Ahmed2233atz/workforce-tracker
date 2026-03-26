FROM node:22-alpine

WORKDIR /app/backend

# Install backend dependencies
COPY backend/package*.json ./
RUN npm install

# Copy all project files
COPY . /app/

# Expose port
EXPOSE 3001

# Start the server
CMD ["node", "--experimental-sqlite", "server.js"]
