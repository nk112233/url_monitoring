# Use Node.js base image
FROM node:18

# Set working directory to /app
WORKDIR /app

# Copy package.json and package-lock.json (if exists)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your frontend code
COPY . .

# Expose the port your frontend runs on
EXPOSE 5173

# Command to run your client side
CMD ["npm", "run", "dev", "--", "--host"]

