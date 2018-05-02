# Build stage
FROM node:carbon

WORKDIR /app	
COPY /app /app
RUN npm install -g  

# Run stage
EXPOSE 3000 

CMD ["npm", "start"]
