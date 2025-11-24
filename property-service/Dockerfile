FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Create the uploads directory for property images
RUN mkdir -p uploads/properties

EXPOSE 5002

CMD ["npm", "start"]
