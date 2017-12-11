var pg = require('pg');
var conString = "postgres://myapp:secret@localhost:54320/myapp_development";

var client = new pg.Client(conString);
client.connect();
var insert;
var  user = client.query("CREATE TABLE Users(first_name VARCHAR(50) NOT NULL,last_name VARCHAR(50) NOT NULL,id SERIAL UNIQUE,password VARCHAR(50) NOT NULL,email VARCHAR(90) NOT NULL)");
client.query("CREATE TABLE Friend_List(user_id_1 integer REFERENCES Users(id) ,user_id_2 integer REFERENCES Users(id) , id SERIAL PRIMARY KEY)");
var  query = client.query("CREATE TABLE Subscription_List(user_id_1 integer REFERENCES Users(id),user_id_2 integer REFERENCES Users(id) ,blocked boolean NOT NULL DEFAULT FALSE ,PRIMARY KEY(user_id_2,user_id_1))");
user.on('end', function () {
    client.query("Insert into Users(first_name ,last_name,password,email) values ('Visalakshi','Vairavan','test','visalakshi@gmail.com')"); 
    insert = client.query("Insert into Users(first_name,last_name,password,email) values ('Chidham','Saba','admin','chidham@gmail.com')"); 
});
insert.on('end', function () {
    client.end();
});





