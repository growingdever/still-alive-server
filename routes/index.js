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

function getUserByAccessToken(req, res, next) {
  if( !req.param('access_token') ) {
    res.send({
      result: RESULT_CODE_NOT_VALID_ACCESS_TOKEN,
      message: 'give me a valid access token!'
    });
    return;
  }

  db.User
    .find({ where: { accessToken: req.param('access_token') } })
    .success(function(user){
      if( !user ) {
        res.send({
          result: RESULT_CODE_NOT_VALID_ACCESS_TOKEN,
          message: 'give me a valid access token!'
        });
        return;
      }

      req.user = user;
      next();
    })
}

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'Express' });
});

router.get('/test2', function(req, res){
  db.User
    .findAll({
      attributes: ['userID', 'accessToken', 'updatedAt'],
      order: 'userID ASC'
    })
    .success(function(users){
      res.send(users);
    });
});

router.get('/list', getUserByAccessToken, function(req, res) {
  db.Relationship
    .findAll({ where: { userID: req.user.userID } })
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
          attributes: [ 'userID', 'nickname', 'phoneNumber', 'stateMessage', 'updatedAt' ],
          order: 'userID ASC'
        })
        .success(function(users) {
          res.send({
            result: RESULT_CODE_SUCCESS,
            data: users
          });
        });      
    });
});

router.get('/update', getUserByAccessToken, function(req, res) {
  req.user.save().success(function() {
    res.send({
      result: RESULT_CODE_SUCCESS,
      message: 'ok. you are still alive!'
    });
  });
});

module.exports = router;
