after open docker desktop, docker ps 

docker start redis rabbitmq mongo-auth mongo-student mongo-notification

then run npm run dev


git clone 
cd student-management
docker-compose up --build

docker exec -it redis redis-cli

to run separate databse for service :docker exec -it mongo-student