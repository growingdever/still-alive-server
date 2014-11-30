var express = require('express');
var router = express.Router();
var db = require('../models');
var request = require('request');
var sequelize = require('sequelize');


function accessTokenCheck(req, res, next) {
  if( ! req.param('access_token') ) {
    res.send({
      result: RESULT_CODE_NOT_VALID_ACCESS_TOKEN,
      message: 'give me a valid access token!'
    });
    return;
  }

  next();
}

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'Express' });
});

router.get('/test', function(req, res) {
  var headers = {
    'Content-Type': 'application/json',
    'Authorization': 'key=' + GCM_API_KEY
  };

  var registration_ids = [];

  var body = {
    'registration_ids' : registration_ids,
    'data' : {
      message: 'hello'
    }
  };

  var options = {
    url: 'https://android.googleapis.com/gcm/send',
    method: 'POST',
    headers: headers,
    body: JSON.stringify(body)
  };

  request(options, function(error, response, body){
    if( error ) {
      res.send({success: 0});
    }
    else {
      res.send({success: 1});
    }
  });
});

router.get('/test2', function(req, res){
  db.User
    .findAll({
      attributes: ['userID', 'accessToken', 'updatedAt']
    })
    .success(function(users){
      res.send(users);
    });
});

router.get('/list', accessTokenCheck, function(req, res) {
  db.User
    .find({ where: { accessToken: req.param('access_token') } })
    .success(function(user) {
      if( ! user ) {
        res.send({
          result: RESULT_CODE_NOT_VALID_ACCESS_TOKEN,
          message: 'give me a valid access token!'
        });
        return;
      }

      db.Relationship
        .findAll({
          where: { userID: user.userID }
        })
        .success( function(users) {
          if ( ! users ) {
            res.send({
              success: RESULT_CODE_FAIL,
              message: 'failed to load data from db'
            });
            return;
          }

          var targets = [];
          for (var i = users.length - 1; i >= 0; i--) {
            targets.push( users[i].targetUserID );
          };

          db.User
            .findAll({ 
              where: { userID: targets },
              attributes: [ 'id', 'userID', 'updatedAt' ]
            })
            .success(function(users) {
              res.send({
                result: RESULT_CODE_SUCCESS,
                data: users
              });
            });      
        });
    });
});

router.get('/update', accessTokenCheck, function(req, res) {
  db.User
    .find({ where: { accessToken: req.param('access_token') } })
    .success(function(user) {
      if( ! user ) {
        res.send({
          result: RESULT_CODE_NOT_VALID_ACCESS_TOKEN,
          message: 'not valid access token'
        });
        return;
      }

      var date = new Date();
      user.updatedAt = date;
      user.save().success(function() {
        res.send({
          result: RESULT_CODE_SUCCESS,
          message: 'ok. you are still alive!'
        });
      });
    });
});

module.exports = router;
