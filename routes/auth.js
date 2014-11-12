var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/regist', function(req, res) {
  var json = {
    result: 0,
    message: "success!"
  };
  res.send(json);
});

router.get('/signin', function(req, res) {
  var json = {
    result: 0,
    message: "success!"
  };
  res.send(json);
});

module.exports = router;
