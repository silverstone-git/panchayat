docker run -p 5432:5432 -e POSTGRES_PASSWORD=*** -e POSTGRES_USER=chintit -e POSTGRES_DB=gateway_db postgres:15

docker run -p 6379:6379 redis:latest


mvn spring-boot:run -Dspring-boot.run.profiles=local


curl -X POST http://localhost:8080/auth/signup \
     -H "Content-Type: application/json" \
     -d '{
           "username": "aapkasubhnaam",
           "password": "aapkishubhpehchan",
           "role": "USER"
         }'
