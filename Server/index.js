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
        else if (docs)
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
    var newvalues = {$set: {userScore: msg.inputval[1], userBestScore: msg.inputval[2]}  };
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
var socketId = 0;
var serseq = 0;

function process_login(socket, serseq, jsonObj)
{
  TryLogin(jsonObj, function(ret){
  if (ret != null)
  {
    var BestScore = ret.userBestScore;
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
                  inputval: []
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
                inputval: []
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

io.on('connection', function(socket){
  socket.userId = socketId ++;
  console.log('A user connected, socket id: ' + socket.userId);

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
  
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});