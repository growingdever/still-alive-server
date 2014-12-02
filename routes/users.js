var express = require('express');
var router = express.Router();
var db = require('../models');
var sequelize = require('sequelize');
var async = require('async');
var validator = require('validator');
var httprequest = require('request');


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

function getUserByAccessToken(req, res, next) {
  db.User
    .find({ where: { accessToken: req.param('access_token') } })
    .success(function(user){
      req.user = user;
      next();
    });
}

function sendGCM(request, gcm_id) {
  // send gcm to target user
  var headers = {
    'Content-Type': 'application/json',
    'Authorization': 'key=' + GCM_API_KEY
  };

  var registration_ids = [ gcm_id ];

  var body = {
    'registration_ids' : registration_ids,
    'data' : {
      requestID: request.id,
      senderID: request.userID,
      date: request.updatedAt
    }
  };

  var options = {
    url: 'https://android.googleapis.com/gcm/send',
    method: 'POST',
    headers: headers,
    body: JSON.stringify(body)
  };

  httprequest(options, function(error, response, body){});
}


/* GET users listing. */
router.get('/', function(req, res) {
  var json = {
    result: 0,
    message: "success!"
  };
  res.send(json);
});

// just for testing
router.get('/delete', function(req, res) {
  db.User
    .find({ 
      where: {
      userID: req.param('userid')
      }
    })
    .success(function(user) {
      user.destroy().success(function() {
        res.send({ result: 1 });
      });
    });
});

router.get('/search', function(req, res) {
  var subs = validator.escape(req.param('keyword'));

  query = "userID LIKE \'" + subs + '%\''; // userID LIKE 'foo%'
  db.User
    .findAll({
      where: [ query ],
      order: 'userID DESC'
    })
    .success(function(users) {
      var arr = [];
      for (var i = users.length - 1; i >= 0; i--) {
        var json = {};
        json.userID = users[i].userID;
        json.nickname = users[i].nickname;
        arr.push( json );
      };

      res.send({
        result: RESULT_CODE_SUCCESS,
        data: arr
      });
    });
});

router.get('/received_requests', getUserByAccessToken, function(req, res){
  if( !req.user ) {
    res.send({
      result: RESULT_CODE_NOT_VALID_ACCESS_TOKEN,
      message: 'give me a valid access token!'
    });
    return;
  }

  db.Request
    .findAll({
      where: sequelize.and(
        { targetUserID: req.user.userID },
        { enabled: true }
      )
    })
    .success(function(requests){
      if( !requests ) {
        res.send({
          success: RESULT_CODE_FAIL,
          message: 'unknown error'
        });
        return;
      }

      var arr = [];
      for (var i = requests.length - 1; i >= 0; i--) {
        arr.push({
          request_id: requests[i].id,
          sender_userid: requests[i].userID,
          date: requests[i].updatedAt
        });
      };

      res.send({
        result: RESULT_CODE_SUCCESS,
        data: arr
      });
    });
});

router.get('/ask', getUserByAccessToken, function(req, res) {
  function sendRequest(request) {
    db.User
      .find({ where: { userID: request.targetUserID } })
      .success(function(user){
        res.send({
          result: RESULT_CODE_SUCCESS,
          message: 'send request successfully!',
          request_id: request.id
        });
        sendGCM(request, user.gcm_id);
      });
  }

  db.Request
    .findOrCreate( { userID: req.user.userID, targetUserID: req.param('target_userid') } )
    .success(function (request, created){
      // completely new request instance!
      if( created ) {
        sendRequest(request);        
        return;
      }

      request.enabled = true;
      request.save()
        .success(function(){
          sendRequest(request);
        });
    })
    .error(function(err){
      res.send({
        result: RESULT_CODE_FAIL,
        message: 'unknown error',
        error: err
      });
    });
});

router.get('/accept', getUserByAccessToken, function(req, res) {
  var req_id = req.param('req_id');

  db.Request
    .find({
      where: sequelize.and( { id: req_id }, { enabled: true }, { targetUserID: req.user.userID } )
    })
    .success(function(request) {
      if( ! request ) {
        res.send({
          success: RESULT_CODE_NOT_EXIST_REQUEST,
          message: 'request is not exist...'
        });
        return;
      }

      var src_id = request.userID;
      var dest_id = request.targetUserID;

      request.enabled = false;
      request.save().success(function(){
        async.waterfall([
          function(callback) {
            db.Relationship
              .findOrCreate( { userID: src_id, targetUserID: dest_id } )
              .success(function (relationship, created){
                if( !created ) {
                  res.send({
                    success: RESULT_CODE_ALREADY_ACCEPTED_REQUEST,
                    message: 'already accepted request...'
                  });
                  return;
                }
                callback(null);
              })
              .error(function(err){
                callback(err);
              });
          },
          function(callback, err) {
            if(err) {
              callback(err);
              return;
            }

            db.Relationship
              .findOrCreate({ userID: dest_id, targetUserID: src_id })
              .success(function (relationship, created){
                callback(null);
              })
              .error(function(err){
                callback(err);
              });
          }
          ], function(err) {
            if( err ) {
              res.send({
                result: RESULT_CODE_FAIL,
                message: 'unknown error',
                error: err
              });
              return;
            }

            res.send({
              result: RESULT_CODE_SUCCESS,
              message: 'success!'
            });
          });
      });
    });
});

router.get('/reject', getUserByAccessToken, function(req, res){
  db.Request
    .find({ 
      where: sequelize.and(
        { id: req.param('req_id') }, 
        { targetUserID: req.user.userID }, 
        { enabled: true }
      ) 
    })
    .success(function(request){
      if( !request ) {
        res.send({
          success: RESULT_CODE_NOT_EXIST_REQUEST,
          message: 'request is not exist...'
        });
        return;
      }

      request.enabled = false;
      request
        .save()
        .success(function() {
          res.send({
            success: RESULT_CODE_SUCCESS,
            message: 'successfully rejected!'
          });
        })
        .error(function(err) {
          res.send({
            success: RESULT_CODE_FAIL,
            message: 'failed to reject!',
            error: err
          });
        });
    });
});



module.exports = router;