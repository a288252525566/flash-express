var express = require('express');
var router = express.Router();

const card_controller = require('../controllers/card.js');

router.post('/list', card_controller.card_list);
router.get('/list', card_controller.card_list);
router.post('/add', card_controller.add_card);
router.post('/remove', card_controller.remove_card);
router.post('/update', card_controller.update_card);

router.get('/*', function(req, res, next) {
  res.send('please use post');
});
router.post('/*', function(req, res, next) {
  res.send('wrong api');
});

module.exports = router;
