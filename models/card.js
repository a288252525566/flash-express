const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema(
  {
    title: String,
    isDone: {type:Boolean,default:false},
  },
  { collection: 'card'}
);

module.exports = mongoose.model('card', cardSchema);

// var newcard = card.create({title:'new card!!'},function (err) {
//   if (err) return handleError(err);
//   console.log('saved!');
//   // saved!
// });
