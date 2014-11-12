var express = require('express');
var router = express.Router();
var db = require('../models');
var bcrypt = require('bcrypt');


router.get('/', function(req, res) {
  var json = {
    result: 1,
    message: "here is root of auth.js"
  };
  res.send(json);
});

router.get('/regist', function(req, res) {
  bcrypt.hash(req.param('password'), 
    8, 
    function(err, hash) {
      var data = { 
        'userID': req.param('userid'),
        'password': hash
      };

      db.User
        .create(data)
        .complete(function(err, user){
          if( err ) {
            res.send({
              'success': 0,
              'message': err
            });
          } else {
            res.send({
              'success': 1,
              'user': user
            })
          }
        });
  });
});

router.get('/signin', function(req, res) {
  var json = {
    result: 0,
    message: "/signin"
  };
  res.send(json);
});


module.exports = router;
