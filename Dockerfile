FROM ghcr.io/sceptorrh/4loki_api_v2:latest

WORKDIR /app

# Skip copying package.json since it's already in the base image
# RUN npm install
# You may still need to run npm install if there's any additional setup or dependencies to install

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
