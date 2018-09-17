var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var MongoClient = require('mongodb').MongoClient;
const test = require('assert');
// Connection MongoDB
var url = 'mongodb://localhost:27017';
const dbName = 'FBCB';

const ConnectDB = function (url, callback)
{
    MongoClient.connect(url,{useNewUrlParser: true} ,function(err, client) {
        // Use the admin database for the operation
      const adminDb = client.db(dbName).admin();

      // List all the available databases
      adminDb.listDatabases(function(err, dbs) {
        test.equal(null, err);
        test.ok(dbs.databases.length > 0);
        callback(client);
      });
    });
}


const TryLogin = function(msg, callback)
{
  ConnectDB(url, function (client)
  {
    // Get the documents collection
    var collection = client.db(dbName).collection('user');
    var userid = msg.id;
    // Find some documents
    collection.find({'userid': userid}, {$exists: true}).toArray(function(err, docs) {
      // Find some documents
        if (docs)
        {
          console.log(docs);
          callback(docs[0]);
          client.close();
        }
        else if (!docs)
        {
          console.log("login error, ", userid);
          callback(null);
          client.close();
        }
    });  
    
  });
}


const CreateAccount = function (msg, callback)
{
  ConnectDB(url, function (client)
  {
    // Get the documents collection
    var collection = client.db(dbName).collection('user');
    var userid = msg.id;
    // Find some documents
    collection.find({'userid': userid}, {$exists: true}).toArray(function(err, docs) {
      // Find some documents
        if (!docs)
        {
          callback(false);
        }
        else
        {
          collection.insert([
            {userid : msg.id, 
            userName : msg.inputval[0], 
            userPass : msg.inputval[2],
            userScore: "0",
            userBestScore: "0",
            userStatus: "0",
            userRank: "0"}
            ], function(err, result) {
            test.equal(null, err);
            console.log("Inserted Success documents into the collection");
            client.close();
            callback(true);
          });
        }
    });    
  });
}

const SubmitScore = function(msg, callback)
{
  ConnectDB(url, function(client)
  {
    // Get the documents collection
    var collection = client.db(dbName).collection('user');
    var query ={userid: msg.id};
    var newvalues = {$set: {userScore: msg.inputval[1], userBestScore: parseInt(msg.inputval[2])}  };
    collection.updateOne(query, newvalues, function(err, res){
      if (err) {
        callback(false);
        throw err;
      }
      console.log("1 document updated");
      client.close();
      callback(true);
    });

  });
}

const Rank = function(msg, callback)
{
  ConnectDB(url, function (client)
  {
    // Get the documents collection
    var collection = client.db(dbName).collection('user');
    var userid = msg.id;
    // Find some documents
    collection.find().sort({ userBestScore: -1 }).toArray(function(err, docs){
        if (!docs)
        {
          callback(false);
          client.close();
        }
        else
        {
          callback(docs);
          client.close();
        }
    });  
  });
}


function process_login(socket, serseq, jsonObj)
{
  TryLogin(jsonObj, function(ret){
  if (ret != null)
  {
    var BestScore = ret.userBestScore.toString();
            socket.emit('fbcb_login', {
              seq: serseq,
              id: jsonObj.id,
              servn: 'fbcb_login',
              errMsg: 'Login Success !!!',
              errCode: "1",
              inputval: [BestScore]
            });
  }
  else
  {
            socket.emit('fbcb_login', {
              seq: serseq,
              id: jsonObj.id,
              servn: 'fbcb_login',
              errMsg: 'Login Fails !!!',
              errCode: "0",
              inputval: []
            });
  }
  });

}


function process_register(socket, serseq, jsonObj)
{

  CreateAccount(jsonObj, function(ret){
  if (ret)
          {
                socket.emit('fbcb_reg', {
                  seq: serseq,
                  id: jsonObj.id,
                  servn: 'fbcb_reg',
                  errMsg: 'Register Success !!!',
                  errCode: "1",
                  inputval: ["0"]
                });
          }
  else
          {
              socket.emit('fbcb_reg', {
                seq: serseq,
                id: jsonObj.id,
                servn: 'fbcb_reg',
                errMsg: 'Register Fail !!!',
                errCode: "0",
                inputval: ["0"]
              });
          }

  ConnectDB(url, function (db) {
    db.close();
  });
});
}

function process_submitScore(socket, serseq, jsonObj)
{
  SubmitScore(jsonObj, function(ret){

    if (ret)
    {
      socket.emit('fbcb_submitScore', {
        seq: serseq,
        id: jsonObj.id,
        servn: 'fbcb_submitScore',
        errMsg: 'Submit Score success!!!',
        errCode: "1",
        inputval: []
      });
    }
    else
    {
      socket.emit('fbcb_submitScore', {
        seq: serseq,
        id: jsonObj.id,
        servn: 'fbcb_submitScore',
        errMsg: 'Submit Score error!!!',
        errCode: "0",
        inputval: []
      });
    }
    
  });
}


function process_rank(socket, serseq, jsonObj)
{
  Rank(jsonObj, function(ret) {
      if (ret)
      {

        var json = {
          seq: serseq,
          id: jsonObj.id,
          servn: 'fbcb_rank',
          errMsg: 'Get Rank success !!!',
          errCode: '1',
          inputval: []
        }

        ret.forEach(function(ele) {
          var str = JSON.stringify({userName: ele.userName, userId: ele.userid, userBestScore: ele.userBestScore.toString()});
          json['inputval'].push(str);
        });

        console.log(json);
  
        socket.emit('fbcb_rank', json);
      
      }
      else
      {

        socket.emit('fbcb_rank', {
          seq: serseq,
          id: jsonObj.id,
          servn: 'fbcb_rank',
          errMsg: 'Get Rank error !!!',
          errCode: '0',
          inputval: []
        });

      }
  });
}


var socketId = 0;
var serseq = 0;
var ListSocket = [];

io.on('connection', function(socket){
  socket.userId = socketId ++;
  console.log('A user connected, socket id: ' + socket.userId);
  // append socket to List
  ListSocket.push(socket);

  socket.on('fbcb_login', function(msg){
    serseq++;
    var jsonObj =  JSON.parse(msg);
    console.log('Msg from user#' + jsonObj.id + " Msg: " + msg);
    process_login(socket, serseq, jsonObj);
  });

  socket.on('fbcb_reg', function(msg){
    serseq++;
    var jsonObj =  JSON.parse(msg);
    console.log('Msg from user#' + jsonObj.id + " Msg: " + msg);
    process_register(socket, serseq, jsonObj);
  });

  socket.on('fbcb_submitScore', function(msg)
  {
    serseq++;
    var jsonObj =  JSON.parse(msg);
    console.log('Msg from user#' + jsonObj.id + " Msg: " + msg);
    process_submitScore(socket, serseq, jsonObj);
  });


  socket.on('fbcb_rank', function(msg)
  {
    serseq++;
    var jsonObj =  JSON.parse(msg);
    console.log('Msg from user#' + jsonObj.id + " Msg: " + msg);
    process_rank(socket, serseq, jsonObj);
  });


  //Whenever someone disconnects this piece of code executed
  socket.on('disconnect', function () {
    console.log('A user disconnected');

    for (var i = 0; i < ListSocket.length; i++)
      if (ListSocket[i].userId === socket.userId) {
          console.log('Remove socket userId ' + socket.userId);
          ListSocket.splice(i, 1);
          break;
      }
    
    
  });
  
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});