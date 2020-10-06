const cardModel = require('../models/card');
const validator = require('express-validator');
const handleError = error=>{
  console.log(error);
}

// Display list of all Cards.
exports.card_list = function(req, res) {

  // find card
  cardModel.find({}, (err, cards) => {
    if (err) {
      return console.error(err);
    }
    res.send(cards);
  });
}



// Display list of all Cards.
exports.add_card = [
  validator.body('title', 'Empty title').isLength({ min: 1 }),
  function(req, res) {

    const errors = validator.validationResult(req);
    if(!errors.isEmpty()) {
      res.send(errors);
      return;
    }
    cardModel.create({ title:req.body.title }, function (err, card_instance) {
      if(err) handleError(err);
      // saved!
      res.send(card_instance);

      
      /*
      // Data from form is valid.
      // Check if Genre with same name already exists.
      Genre.findOne({ 'name': req.body.name })
        .exec( function(err, found_genre) {
           if (err) { return next(err); }

           if (found_genre) {
             // Genre exists, redirect to its detail page.
             res.redirect(found_genre.url);
           }
           else {

             genre.save(function (err) {
               if (err) { return next(err); }
               // Genre saved. Redirect to genre detail page.
               res.redirect(genre.url);
             });

          }

        });
      */
    });
  }
];


exports.remove_card = [
  validator.body('_id', 'Empty id').isLength({ min: 1 }),
  function(req, res) {
    const errors = validator.validationResult(req);
    if(!errors.isEmpty()) {
      res.send(errors);
      return;
    }

    cardModel.findByIdAndRemove(req.body._id,null, function (err, card_instance) {
      if(err) handleError(err);
      // saved!
      if(card_instance) res.send(card_instance);
      else res.send('id not found');
    });
  }
];


exports.update_card = [
  validator.body('_id', 'Empty id').isLength({ min: 1 }),
  function(req, res) {
    
    const errors = validator.validationResult(req);
    if(!errors.isEmpty()) {
      res.send(errors);
      return;
    }

    cardModel.findByIdAndUpdate(req.body._id,req.body, function (err, card_instance) {
      if(err) handleError(err);
      // saved!
      if(card_instance) res.send(card_instance);
      else res.send('id not found');
    });
  }
]