FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Create the uploads directory for profile pictures
RUN mkdir -p uploads/profiles

EXPOSE 5003

CMD ["npm", "start"]
