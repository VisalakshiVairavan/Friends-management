CREATE TABLE Users(first_name VARCHAR(50) NOT NULL,last_name VARCHAR(50) NOT NULL,id SERIAL UNIQUE,password VARCHAR(50) NOT NULL,email VARCHAR(90) NOT NULL);
CREATE TABLE Friend_List(user_id_1 integer REFERENCES Users(id) ,user_id_2 integer REFERENCES Users(id) , id SERIAL PRIMARY KEY);
CREATE TABLE Subscription_List(user_id_1 integer REFERENCES Users(id),user_id_2 integer REFERENCES Users(id) ,blocked boolean NOT NULL DEFAULT FALSE ,PRIMARY KEY(user_id_2,user_id_1));
Insert into Users(first_name ,last_name,password,email) values ('Visalakshi','Vairavan','test','visalakshi@gmail.com');