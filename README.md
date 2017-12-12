# Friends-management

This project provides the APIs required for friends management
Every user must be registered to friend,subcribed or get updates from other registered users.
A user can also unsubcribe a previous subscription and view the common friends with other registered users.

*To Run the code

** cd to the project folder

** Create the postgres image

docker create -v  %cd%:db/data --name postgres9.3.6-data busybox

** Run the image

docker run --name local-postgres9.3.6 -p 54320:5432 -e POSTGRES_PASSWORD=asecurepassword -d --volumes-from postgres9.3.6-data postgres:9.3.6

** Update user role and create database

docker run -it --link local-postgres9.3.6:postgres --rm postgres:9.3.6 sh -c 'exec psql -h "$POSTGRES_PORT_5432_TCP_ADDR" -p "$POSTGRES_PORT_5432_TCP_PORT" -U postgres'
postgres=# CREATE ROLE myapp WITH CREATEDB LOGIN PASSWORD 'secret';
CREATE ROLE
postgres=# CREATE DATABASE myapp_development;
CREATE DATABASE
postgres=# \q


** Build and Run the project 

docker build -t proj/friendManagement .

docker run --link local-postgres9.3.6:postgres -p 49160:8080 -d proj/friendManagement

The project should be up and running at http://localhost:49160

