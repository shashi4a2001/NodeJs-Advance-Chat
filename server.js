var express = require('express');
var app = express();
var http = require('http').Server(app);
var socket = require('socket.io')(http);
var HashMap = require('hashmap');
var fs = require('fs');

var map = new HashMap();
var dbfile = __dirname + '/DB/data.txt';

app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

app.get('/chatlogin', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

app.get('/newuser', function (req, res) {
    res.sendFile(__dirname + '/newuser.html');
});

console.log('-------------------Loading Users Started-------------------');
var usersJsonObj = JSON.parse('[' + fs.readFileSync(dbfile, 'utf8') + ']');

console.log('-------------------Loading Users Completed-------------------');

function checkifuserwithpassexist(userid, password) {
     
    var hasMatch = false;

    for (var index = 0; index < usersJsonObj.length; ++index) {

        if (usersJsonObj[index].uid == userid && usersJsonObj[index].pwd == password) {
            hasMatch = true;
            break;
        }
    }
    return hasMatch;
}

function checkifuserexist(userid) {

    var hasMatch = false;

    for (var index = 0; index < usersJsonObj.length; ++index) {

        if (usersJsonObj[index].uid == userid) {
            hasMatch = true;
            break;
        }
    }
    return hasMatch;
}


socket.on('connection', function (client) {

    console.log('a user connected ' + client.id);
    client.on('newuserregistration', function (userid, password, username) {

        if (checkifuserexist(userid)) {
            console.log('Duplicate User Registration userid is:' + userid);
            client.emit('newuserregistrationresponse', 'duplicate');
        }
        else {
            var objuser = { uid: userid, pwd: password, uname: username };
            usersJsonObj.push(objuser);
            var strobjuser = JSON.stringify(objuser);
            strobjuser = ',' + strobjuser;
            console.log('strobjuser : ' + strobjuser);
            fs.writeFileSync(dbfile, strobjuser, { flag: 'a' });
            client.emit('newuserregistrationresponse', 'success');
        }

    });

    client.on('loginrequest', function (loggedInUserId, loggedInPassword) {

        console.log('login request received from : ' + loggedInUserId);

        if (!checkifuserwithpassexist(loggedInUserId, loggedInPassword)) {
            console.log('Unknown user');
            client.emit('loginresponse', 'unknownuser');
        }
        else if (map.has(loggedInUserId)) {
            console.log('user already logged in');
            client.emit('loginresponse', 'preloggedin');
        }
        else {

            map.set(loggedInUserId, client);
            client.emit('loginresponse', 'loginsuccess');

            var jsonArr = [];
            map.forEach(function (value, key) {
                jsonArr.push({
                    userid: key
                });

            });

            //send user list to current user which are going to be logged in
            client.emit('loggedinuserlist', jsonArr);

            var jsonusr = [];
            jsonusr.push({
                userid: loggedInUserId
            });

            //send user to currently all logged in users
            socket.emit('loggedinuserlist', jsonusr);
        }

        console.log('logged in successfully. user :' + loggedInUserId + ' and clientid:' + client.id);
    });

    client.on('chatmessage', function (fromuserid, touserid, msg) {
        console.log('message received from user' + fromuserid + ' for :' + touserid + ' message is :' + msg);

        var objClient = map.get(touserid);
        if (objClient == null) {
            console.log('client :' + touserid + ' is currently unavailable to receive chat');
            client.emit('chatdeliveryunavailable', touserid);
        }
        else {
            objClient.emit('chatmessage', fromuserid, msg);
        }
    });


    client.on('disconnect', function () {
        var userid = map.search(client)
        if (userid != null) {
            map.remove(userid);
            socket.emit('loggedoffuser', userid);
        }
        console.log('logged off successfully. user :' + userid + ' and Client id :' + client.id);
    });

});

http.listen(3000, function () {
    console.log('Node server is listening on port : 3000');
});

//console.log('\x1b[37m', 'Node server is listening on port : 3000');
//Reset = "\x1b[0m"
//Bright = "\x1b[1m"
//Dim = "\x1b[2m"
//Underscore = "\x1b[4m"
//Blink = "\x1b[5m"
//Reverse = "\x1b[7m"
//Hidden = "\x1b[8m"

//FgBlack = "\x1b[30m"
//FgRed = "\x1b[31m"
//FgGreen = "\x1b[32m"
//FgYellow = "\x1b[33m"
//FgBlue = "\x1b[34m"
//FgMagenta = "\x1b[35m"
//FgCyan = "\x1b[36m"
//FgWhite = "\x1b[37m"

//BgBlack = "\x1b[40m"
//BgRed = "\x1b[41m"
//BgGreen = "\x1b[42m"
//BgYellow = "\x1b[43m"
//BgBlue = "\x1b[44m"
//BgMagenta = "\x1b[45m"
//BgCyan = "\x1b[46m"
//BgWhite = "\x1b[47m"




//    try {
//        var ii = jsonfile.readFileSync('DB\\data.json', 'utf8');
//        console.log(ii);
//    }
//    catch (err) {
//        console.log("ERROR: Reading file - " + err.message);
//    }

//    var obj = { name: 'JP7' };
//    jsonfile.writeFileSync(dbfile, obj, { flag: 'a' });