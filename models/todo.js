const mongoose = require('mongoose');

//設定Schema
const todoSchema = new mongoose.Schema(
  {
    title: String,
    isDone: {type:Boolean,default:false},
    parent_id:{type:mongoose.Types.ObjectId,default:null},
    content:String
  },
  { collection: 'todo'}
);

//產生modle
const rawModel = mongoose.model('todo', todoSchema);
const todoModel = {};

//自訂model method
//回傳指定id下一層的todo
todoModel.findList = async function(parent_id) {
  const result = await rawModel.find({parent_id:parent_id}, (err, todos) => {
    if (err) {
      return console.error(err);
    }
    return todos;
  });
  return result;
}

//回傳todo的路徑
todoModel.findPath = async function (_id) {
  
  //驗證id
  if(!mongoose.Types.ObjectId.isValid(_id)) return 'wrong id';

  //檢查id是否存在
  const todo = (await rawModel.find({_id:_id}, (err, result) => {
    if (err) console.error(err);
  }))[0];
  if(todo._id && todo._id.length<=0) {
    return 'id not found';
  }

  //找到path
  const cursor = rawModel.aggregate( [
    { $match: { "_id": mongoose.Types.ObjectId(_id) } },
    {
      $graphLookup: {
          from: "todo",
          startWith: "$parent_id",
          connectFromField: "parent_id",
          connectToField: "_id",
          as: "path"
      }
    }
  ] ).cursor({ batchSize: 1000 }).exec();
  let path;
  await cursor.eachAsync(function(doc) {
    path = doc.path;
  });
  //只有一個結果，沒有array
  if(typeof(path.forEach)!=='function') return path;
  //照parent_id排序
  let result = [];
  const sortResult = (todo)=>{
    result.unshift(todo);
    if(!!!todo.parent_id) return;
    const next = path.find(value=>(value._id.toString()===todo.parent_id.toString()));
    if(next) sortResult(next);
  }
  sortResult(todo);
  return result;
}

/**
 * 移除todo及以下的節點
 * @return {boolean}
 */
todoModel.remove = async function(_id) {
  //驗證id
  if(!mongoose.Types.ObjectId.isValid(_id)) return false;

  //檢查id是否存在
  const todo = (await rawModel.find({_id:_id}, (err, result) => {
    if (err) console.error(err);
  }))[0];
  if(todo._id && todo._id.length<=0) {
    return false;
  }

  //找出chldren
  const cursor = rawModel.aggregate( [
    { $match: { "_id": mongoose.Types.ObjectId(_id) } },
    {
      $graphLookup: {
          from: "todo",
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
  
  //刪除todo
  const idArray = [
    _id,
    ...children.map(todo=>{
      return todo._id;
    })];
  let result;
  const callback = (err, todo_instance) => {
    if(err) result = false;
    else result = true;
  };
  await rawModel.deleteMany({_id:{$in:idArray}},null,callback);
  
  return result;
}
/**
 * 回傳指定todo
 * @param {mongoose.Types.ObjectId} _id 
 */
todoModel.get = async function(_id){
  if(!mongoose.Types.ObjectId.isValid(_id)) return null;

  //檢查id是否存在
  const todo = (await rawModel.find({_id:_id}, (err, result) => {
    if (err) console.error(err);
  }))[0];

  if(todo._id && todo._id.length<=0) {
    return null;
  }
  return todo;
}

/**
 * 移除root底下所有完成的car
 * 因為root底下的todo沒有parent，所以沒有父節點可以做為移除卡片的依據，需要逐個找出root底下已經完成的todo
 * @param {mongoose.Types.ObjectId,null} node_id 將從傳入的id開始尋找已經完成的todo，無傳入就從root開始找
 * @return {boolean}
 */
todoModel.removeCompleted = async function(node_id) {
  //如果有傳入id，但是是錯誤的id回傳刪除失敗
  if(!!node_id && rawModel.get(node_id)===null) return false;


  //找出要移除的卡片
  const completedList = await rawModel.find(
    {parent_id:(node_id?node_id:null),isDone:true},
    (err, todos) => {
      if (err) console.error(err);
    }
  );



  //遞迴移除root的每個卡片，並回傳結果
  let haveError = false;
  let i = 0;
  const recursion = async function() {
    if(haveError || i>=completedList.length) return;
    const removeResult = await rawModel.remove(completedList[i]._id);
    if(!removeResult) haveError = true;
    else {
      i++;
      recursion();
    }
  }
  await recursion();
  const result = !haveError;
  return result;
}

todoModel.create = function (data,callback) {
  return rawModel.create(data,callback);
}
todoModel.findByIdAndUpdate = function (id,data,callback) {
  return rawModel.findByIdAndUpdate(id,data,callback);
}
module.exports = todoModel;