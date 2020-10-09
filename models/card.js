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
//回傳指定id下一層的card
cardModel.findList = async function(parent_id) {
  const result = await cardModel.find({parent_id:parent_id}, (err, cards) => {
    if (err) {
      return console.error(err);
    }
    return cards;
  });
  return result;
}

//回傳card的路徑
cardModel.findPath = async function (_id) {
  
  //驗證id
  if(!mongoose.Types.ObjectId.isValid(_id)) return 'wrong id';

  //檢查id是否存在
  const card = (await cardModel.find({_id:_id}, (err, result) => {
    if (err) console.error(err);
  }))[0];
  if(card._id && card._id.length<=0) {
    return 'id not found';
  }

  //找到path
  const cursor = cardModel.aggregate( [
    { $match: { "_id": mongoose.Types.ObjectId(_id) } },
    {
      $graphLookup: {
          from: "card",
          startWith: "$parent_id",
          connectFromField: "parent_id",
          connectToField: "_id",
          as: "path"
      }
    }
  ] ).cursor({ batchSize: 1000 }).exec();
  let searchResult;
  await cursor.eachAsync(function(doc, i) {
    searchResult = doc.path;
  });

  if(typeof(searchResult.forEach)==='function') return [card,...searchResult].reverse();
  else return searchResult;
}

/**
 * 移除card及以下的節點
 * @return {boolean}
 */
cardModel.remove = async function(_id) {
  //驗證id
  if(!mongoose.Types.ObjectId.isValid(_id)) return false;

  //檢查id是否存在
  const card = (await cardModel.find({_id:_id}, (err, result) => {
    if (err) console.error(err);
  }))[0];
  if(card._id && card._id.length<=0) {
    return false;
  }

  //找出chldren
  const cursor = cardModel.aggregate( [
    { $match: { "_id": mongoose.Types.ObjectId(_id) } },
    {
      $graphLookup: {
          from: "card",
          startWith: "$_id",
          connectFromField: "_id",
          connectToField: "parent_id",
          as: "children"
      }
    }
  ] ).cursor({ batchSize: 1000 }).exec();
  let children;
  await cursor.eachAsync(function(doc, i) {
    children = doc.children;
  });
  
  //刪除card
  const idArray = [
    _id,
    ...children.map(card=>{
      return card._id;
    })];
  let result;
  const callback = (err, card_instance) => {
    if(err) result = false;
    else result = true;
  };
  await cardModel.deleteMany({_id:{$in:idArray}},null,callback);
  
  return result;
}
module.exports = cardModel;