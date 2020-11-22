const todoModel = require('../models/todo');
const validator = require('express-validator');
const {getDateFromBody} = require('../selector/todo');
const handleError = error=>{
  console.log(error);
}

// Display list of all todos.
exports.findList = async function(req, res) {
  const parent_id = (!req.body.parent_id || req.body.parent_id==='root') ?null:req.body.parent_id;
  const list = await todoModel.findList(parent_id);
  res.send(list);
}

exports.findPath = [
  validator.body('_id', 'Empty id').isLength({ min: 1 }),
  function(req, res) {
    //處理錯誤
    const errors = validator.validationResult(req);
    if(!errors.isEmpty()) {
      res.send(errors);
      return;
    }
    const pathPromise = todoModel.findPath(req.body._id);
    pathPromise.then(path=>{
      res.send(path);
    })
  }
];



// add todo.
exports.add = [
  validator.body('title', 'Empty title').isLength({ min: 1 }),
  function(req, res) {
    //處理錯誤
    const errors = validator.validationResult(req);
    if(!errors.isEmpty()) {
      res.send(errors);
      return;
    }
    
    const data = getDateFromBody(req);

    //呼叫model
    todoModel.add(data).then(promise=>{
      res.send(promise);
    });
  }
];


exports.remove = function(req, res) {
  todoModel.remove(req.body._id).then(result=>{
    if(result) res.send({message:'success'});
    else res.send({message:'faild'});
  });
}


//移除已經完成的todo
exports.removeCompleted = function(req, res) {
  const parent_id = (!req.body.parent_id || req.body.parent_id==='root') ?null:req.body.parent_id;
  todoModel.removeCompleted(parent_id).then(v=>{
    if(v) res.send({message:'success'});
    else res.send({message:'faild'});
  });
};

exports.update = [
  validator.body('_id', 'Empty id').isLength({ min: 1 }),
  function(req, res) {
    //處理錯誤
    const errors = validator.validationResult(req);
    if(!errors.isEmpty()) {
      res.send(errors);
      return;
    }

    const callback = (err, todo_instance) => {
      if(err) handleError(err);
      // saved!
      if(todo_instance) res.send(todo_instance);
      else res.send('id not found');
    };
    const data = getDateFromBody(req);

    todoModel.update(req.body._id,data).then(promise=>{
      res.send(promise);
    });
  }
]