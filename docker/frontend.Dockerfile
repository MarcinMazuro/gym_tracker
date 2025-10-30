FROM node:22-alpine

WORKDIR /app

# Copy package files from the frontend directory within the build context
COPY frontend/package*.json ./

RUN npm install

# Copy the rest of the frontend source code
COPY frontend/ .

EXPOSE 3000
CMD ["npm", "start"]