# install node
RUN curl -sL https://deb.nodesource.com/setup_8.x | bash - && \
    apt-get install -yq nodejs build-essential && \
    npm install -g npm yarn

# installing the node packages before adding the src directory will allow us to re-use these image layers when only the souce code changes
WORKDIR /app

# Run stage
RUN npm start

EXPOSE 3000 9092 