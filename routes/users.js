var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res) {
  var json = {
    result: 0,
    message: "success!"
  };
  res.send(json);
});

router.get('/hello', function(req, res) {
  var json = {
    result: 1,
    message: "hello world!"
  };
  res.send(json);
});



module.exports = router;