const mongoose = require('mongoose');

//設定Schema
const cardSchema = new mongoose.Schema(
  {
    title: String,
    isDone: {type:Boolean,default:false},
    parent_id:{type:mongoose.Types.ObjectId,default:null}
  },
  { collection: 'card'}
);

//產生modle
const cardModel = mongoose.model('card', cardSchema);

//自訂model method
cardModel.findList = async function(parent_id) {
  const result = await cardModel.find({parent_id:parent_id}, (err, cards) => {
    if (err) {
      return console.error(err);
    }
    return cards;
  });
  return result;
}

module.exports = cardModel;