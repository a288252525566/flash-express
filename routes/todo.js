var express = require('express');
var router = express.Router();

const todo_controller = require('../controllers/todo.js');

router.post('/list', todo_controller.findList);
router.post('/path', todo_controller.findPath);
router.post('/add', todo_controller.add);
router.post('/remove', todo_controller.remove);
router.post('/removecompleted', todo_controller.removeCompleted);
router.post('/update', todo_controller.update);

router.get('/*', function(req, res, next) {
  res.send('please use post');
});
router.post('/*', function(req, res, next) {
  res.send('wrong api');
});

module.exports = router;
