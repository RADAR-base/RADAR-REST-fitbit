# Build stage
FROM node:carbon
WORKDIR /app
COPY /app/package*.json ./
RUN npm install -g  
COPY . .

# Run stage
EXPOSE 3000 
CMD [ "npm", "start" ]