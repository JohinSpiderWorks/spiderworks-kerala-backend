# Use a specific Node.js version for stability
FROM node:20-slim

# Install OpenSSL and dependencies required by Prisma
RUN apt-get update && apt-get install -y \
  openssl \
  libssl-dev \
  && rm -rf /var/lib/apt/lists/*

# Set the working directory in the container
WORKDIR /app

# Copy only package.json and package-lock.json first to leverage Docker cache
COPY package*.json ./

# Install dependencies (this will be cached unless package.json changes)
RUN npm install --production

## Copy prisma folder and generate Prisma client
#COPY prisma ./prisma
#RUN npx prisma generate

# Copy all the application files except unnecessary ones (e.g., node_modules, .git)
COPY . .

# Expose port (for communication with the container)
EXPOSE 4000

# Start the app
CMD ["node", "index.js"]