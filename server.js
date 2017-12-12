'use strict';

const express = require('express');
var pg = require('pg');
var bodyParser = require('body-parser')
var conString = "postgres://myapp:asecurepassword@postgresql:5432/myapp_development";

// Constants
const PORT = 8080;
const HOST = '0.0.0.0';

// App
const app = express();

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

/* 
This api accepts json object with friends array attribute
*/


app.post('/friend', (req, res) => {
    var client = new pg.Client(conString);
    client.connect();

    var friendList = req.body.friends;
    var ids = [];
    var count = 0;
    console.log(friendList[0]);
    if (friendList.length != 2) {
        client.end();
        res.json({ "error": "Please check the parameters passed" });
    }
    var query = client.query("SELECT * FROM Users where email in ($1,$2);", friendList);
    query.on('row', function (row) {
        ids.push(row.id);
        console.log(row);
    });
    query.on('end', function () {
        if (ids.length == 2) {
            var query1 = client.query("SELECT COUNT(*)  FROM Friend_List where user_id_1 = $1 and user_id_2 = $2;", ids);
            query1.on('row', function (row) {
                if (row.count == 1) {
                    count = 1;
                }
            });
            query1.on('end', function () {
                if (count == 0) {
                    // Insert both a,b and b,a pairs in DB
                    client.query("INSERT INTO Friend_List (user_id_1,user_id_2) values ($1,$2);", ids);
                    var query2 = client.query("INSERT INTO Friend_List (user_id_1,user_id_2) values ($1,$2);", [ids[1],ids[0]]);
                    query2.on('row', function (row) {
                        console.log(row);
                    });
                    query2.on('end', function () {
                        client.end();
                        res.json({ "success": true });

                    });
                    query2.on('error', function () {
                        client.end();
                        res.json({ "error": "Could not add friend" });
                    });
                }
                else {
                    client.end();
                    res.json({ "error": "Already a friend" });
                }

            });
            query1.on('error', function () {
                client.end();
            });
        }
        else {
            client.end();
            res.json({ "error": "Could not find the user" });
        }
    });
    query.on('error', function () {
        client.end();
        res.json({ "error": "Could not find the user" });
    });


});

/*
* This api sends the list of friends back for a given email address
*/
app.post('/friend/list', (req, res) => {
    var client = new pg.Client(conString);
    client.connect();
    var emailList = [];
    var email = req.body.email;
    console.log(email);
    if (!email) {
        client.end();
        res.json({ "error": "Please check the parameters passed" });
    }
    var query1 = client.query("SELECT u2.email FROM Users as u2 join Friend_List as fl on u2.id = fl.user_id_2  join Users as u on u.id = fl.user_id_1 where u.email = $1;", [email]);
    query1.on('row', function (row) {
        emailList.push(row.email);
    });
    query1.on('end', function () {
        client.end();
        res.json({
            "success": true,
            "friends": emailList,
            "count": emailList.length
        });
    });
    query1.on('error', function () {
        client.end();
        res.json({ "error": "Could not retrieve the list!" });
    });
});
/*
* This api sends the list of common friends between two email ids
*/

app.post('/friend/common', (req, res) => {
    var client = new pg.Client(conString);
    client.connect();

    var friendList = req.body.friends;
    friendList = friendList.sort();
    var ids = [];
    var commons = [];
    console.log(friendList[0]);
    if (friendList.length != 2) {
        client.end();
        res.json({ "error": "Please check the parameters passed" });
    }
    var query = client.query("SELECT * FROM Users where email in ($1,$2);", friendList);
    query.on('row', function (row) {
        ids.push(row.id);
        console.log(row);
    });
    query.on('end', function () {
        if (ids.length == 2) {
            ids = ids.sort();
            var query1 = client.query("SELECT u.email as friend FROM Friend_List as f1 join Friend_List as f2 using (user_id_2) join Users as u on f1.user_id_2 = u.id where f1.user_id_1 = $1 and f2.user_id_1 = $2;", ids);
            query1.on('row', function (row) {
                commons.push(row.friend);
            });
            query1.on('end', function () {
                client.end();
                res.json({
                    "success": true,
                    "friends": commons,
                    "count": commons.length
                });
            });
            query1.on('error', function () {
                client.end();
                res.json({ "error": "could not get common friends list" });
            });
        }
        else {
            client.end();
            res.json({ "error": "Could not find  user" });
        }
    });
    query.on('error', function () {
        client.end();
        res.json({ "error": "Could not find the user" });
    });


});
/*
* This api registers a new user.
*/
app.post('/user', (req, res) => {
    var client = new pg.Client(conString);
    client.connect();
    var user = req.body;
    console.log(user);
    var ids=[];
    var query = client.query("SELECT * FROM Users where email in ($1);", [user.email]);
    query.on('row', function (row) {
        ids.push(row.id);
        console.log(row);
    });
    query.on('end', function () {
        if (ids && ids.length == 1) {
            client.end();
            res.json({ "error": "User email exists!" });
        }
        else {
            var query2 = client.query("INSERT INTO Users (first_name,last_name,email,password) values ($1,$2,$3,$4);", [user.firstName, user.lastName, user.email, user.password]);
            query2.on('row', function (row) {
                console.log(row);
            });
            query2.on('end', function () {
                client.end();
                res.json({ "success": true });

            });
            query2.on('error', function () {
                client.end();
                res.json({ "error": "Could not add user" });
            });
        }
    });
    query.on('error', function () {
        client.end();
        res.json({ "error": "Could not add the user" });
    });


});
/*
* This api subcribes the target email id for the given requestor email address
*/
app.post('/subcribe', (req, res) => {
    var client = new pg.Client(conString);
    client.connect();

    var subcribeList = req.body;
    var ids = [];
    var count = 0;
    if (!(subcribeList.requestor && subcribeList.target)) {
        res.json({ "error": "Please check the parameters passed" });
    }
    var query = client.query("SELECT * FROM Users where email in ($1,$2);", [subcribeList.requestor, subcribeList.target]);
    query.on('row', function (row) {
        ids.push(row.id);
        console.log(row);
    });
    query.on('end', function () {
        if (ids.length == 2) {
            var query1 = client.query("SELECT COUNT(*)  FROM Subscription_List where user_id_1 = $1 and user_id_2 = $2;", ids);
            query1.on('row', function (row) {
                if (row.count == 1) {
                    count = 1;
                }
            });
            query1.on('end', function () {
                if (count == 0) {
                    ids.push(false);
                    //Subcription is one way
                    var query2 = client.query("INSERT INTO Subscription_List (user_id_1,user_id_2,blocked) values ($1,$2,$3);", ids);
                    query2.on('row', function (row) {
                        console.log(row);
                    });
                    query2.on('end', function () {
                        client.end();
                        res.json({ "success": true });

                    });
                    query2.on('error', function () {
                        client.end();
                        res.json({ "error": "Could not subcribe" });
                    });
                }
                else {
                    client.end();
                    res.json({ "error": "Already subcribed" });
                }
            });
            query1.on('error', function () {
                client.end();
                res.json({ "error": "Could not subcribe to user" });
            });
        }
        else {
            res.json({ "error": "Could not find user" });
        }
    });
    query.on('error', function () {
        client.end();
        res.json({ "error": "Could not find the user" });
    });

});
/*
* This api unsubcribes the target email id for the given requestor email address if already subcribed
*/
app.post('/unsubcribe', (req, res) => {
    var client = new pg.Client(conString);
    client.connect();

    var subcribeList = req.body;
    var ids = [];
    var count = 0;
    if (!(subcribeList.requestor && subcribeList.target)) {
        client.end();
        res.json({ "error": "Please check the parameters passed" });
    }
    var query = client.query("SELECT * FROM Users where email in ($1,$2);",[ subcribeList.requestor, subcribeList.target]);
    query.on('row', function (row) {
        ids.push(row.id);
        console.log(row);
    });
    query.on('end', function () {
        if (ids.length == 2) {
            var query1 = client.query("SELECT COUNT(*)  FROM Subscription_List where user_id_1 = $1 and user_id_2 = $2;", ids);
            query1.on('row', function (row) {
                if (row.count == 1) {
                    // Set blocked to true to block
                    var query2 = client.query("UPDATE Subscription_List set blocked = true where user_id_1 = $1 && user_id_2 = $2", [row.user_id_1, row.user_id_2]);
                    query2.on('row', function (row) {
                        console.log(row);
                    });
                    query2.on('end', function () {
                        client.end();
                        res.json({ "success": true });
                    });
                    query2.on('error', function () {
                        client.end();
                        res.json({ "error": "Could not unsubcribe" });
                    });
                }
            });
            query1.on('error', function () {
                client.end();
                res.json({ "error": "Could not subcribe to user" });
            });
        }
        else {
            res.json({ "error": "Could not find user" });
        }
    });
    query.on('error', function () {
        client.end();
        res.json({ "error": "Could not find the user" });
    });

});
/*
* This api gives the list of email id for which an update should be sent for a particular sender.
*/
app.post('/updates', (req, res) => {
    var client = new pg.Client(conString);
    client.connect();
    var emailList = [];
    var input = req.body;
    console.log(input);
    if (!(input && input.sender && input.text)) {
        client.end();
        res.json({ "error": "Please check the parameters passed" });
    }
    var refMatch = input.text.match(/[A-Z0-9\.\-_]+@[A-Z0-9\.\-_]+/i);
    if (refMatch) {
        console.log("Match found!", refMatch[0]);
        var query3 = client.query("SELECT * FROM Users where email in ($1);", [refMatch[0]]);
        query3.on('row', function (row) {
            emailList.push(refMatch[0]);
        });
        query3.on('end',function(){
            var query1 = client.query("SELECT u2.email FROM Users as u2 join Friend_List as fl on u2.id = fl.user_id_2  join Users as u on u.id = fl.user_id_1 where u.email = $1;", [input.sender]);
            query1.on('row', function (row) {
                emailList.push(row.email);
            });
            query1.on('end', function () {
                var query2 = client.query("SELECT u2.email FROM Users as u2 join Subscription_List as fl on u2.id = fl.user_id_2  join Users as u on u.id = fl.user_id_1 where u.email = $1 and fl.blocked = false;", [input.sender]);
                query2.on('row', function (row) {
                    emailList.push(row.email);
                });
                query2.on('end', function () {
                    client.end();
                    emailList = uniq(emailList);
                    res.json({
                        "success": true,
                        "friends": emailList,
                        "count": emailList.length
                    });
                });
              
            });
            query1.on('error', function (error) {
                client.end();
                console.log(error);
                res.json({ "error": "Could not get updates list" });
            });
        });
    }
    
});

function uniq(a) {
    return a.sort().filter(function (item, pos, ary) {
        return !pos || item != ary[pos - 1];
    })
}

app.get('/', (req, res) => {
    res.send('{"AppName":"Friend\'s Management","Supported API":["/user","/friend","/friend/list","/friend/common","/subcribe","/unsubcribe","/updates"]');
});

app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);