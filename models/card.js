const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema(
  {
    title: String,
    isDone: {type:Boolean,default:false},
    parent_id:{type:mongoose.Types.ObjectId,default:null}
  },
  { collection: 'card'}
);

module.exports = mongoose.model('card', cardSchema);

// var newcard = card.create({title:'new card!!'},function (err) {
//   if (err) return handleError(err);
//   console.log('saved!');
//   // saved!
// });
