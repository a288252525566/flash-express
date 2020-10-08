var express = require('express');
var router = express.Router();

const card_controller = require('../controllers/card.js');

router.post('/list', card_controller.findList);
router.post('/path', card_controller.findPath);
router.post('/add', card_controller.add);
router.post('/remove', card_controller.remove);
router.post('/update', card_controller.update);

router.get('/*', function(req, res, next) {
  res.send('please use post');
});
router.post('/*', function(req, res, next) {
  res.send('wrong api');
});

module.exports = router;
