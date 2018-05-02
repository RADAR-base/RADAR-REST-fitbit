# Build stage
FROM node:carbon
WORKDIR /
COPY /app/package*.json ./
RUN npm install -g  
COPY . .

# Run stage
EXPOSE 3000 
CMD [ "npm", "start" ]