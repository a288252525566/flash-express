const cardModel = require('../models/card');
const validator = require('express-validator');
const handleError = error=>{
  console.log(error);
}

// Display list of all Cards.
exports.findList = async function(req, res) {
  const parent_id = (!req.body.parent_id || req.body.parent_id==='root') ?null:req.body.parent_id;
  const list = await cardModel.findList(parent_id);
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
    const pathPromise = cardModel.findPath(req.body._id);
    pathPromise.then(path=>{
      res.send(path);
    })
  }
];



// add card.
exports.add = [
  validator.body('title', 'Empty title').isLength({ min: 1 }),
  function(req, res) {
    //處理錯誤
    const errors = validator.validationResult(req);
    if(!errors.isEmpty()) {
      res.send(errors);
      return;
    }
    
    //處理資料
    const title = req.body.title;
    const parent_id = (!req.body.parent_id || req.body.parent_id==='root') ?null:req.body.parent_id;
    const content = req.body.content;
    const data = {title,parent_id,content};
    const callback = (err,card_instance) => {
      if(err) handleError(err);
      // saved!
      res.send(card_instance);

    }

    //呼叫model
    cardModel.create(data,callback);
  }
];


exports.remove = function(req, res) {
  cardModel.remove(req.body._id).then(result=>{
    if(result) res.send({message:'success'});
    else res.send({message:'faild'});
  });
}


//移除已經完成的card
exports.removeCompleted = function(req, res) {
  const parent_id = (!req.body.parent_id || req.body.parent_id==='root') ?null:req.body.parent_id;
  cardModel.removeCompleted(parent_id).then(v=>{
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

    const callback = (err, card_instance) => {
      if(err) handleError(err);
      // saved!
      if(card_instance) res.send(card_instance);
      else res.send('id not found');
    };
    const title = req.body.title;
    const parent_id = (!req.body.parent_id || req.body.parent_id==='root') ?null:req.body.parent_id;
    const content = req.body.content;
    const data = {title,parent_id,content};

    cardModel.findByIdAndUpdate(req.body._id,data, callback);
  }
]