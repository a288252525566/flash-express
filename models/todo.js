const mongoose = require('mongoose');

//設定Schema
const todoSchema = new mongoose.Schema(
  {
    title: String,
    isDone: {type:Boolean,default:false},
    parent_id:{type:mongoose.Types.ObjectId,default:null},
    order:{type:Number},
    content:String
  },
  { collection: 'todo'}
);

//產生modle
const rawModel = mongoose.model('todo', todoSchema);
const todoModel = {};

/**
 *1.去除重複的order
 *2.消除order的間隔
 */
const reOrderList = async (node_id, anchor_id) => {
  //如果無輸入anchor_id，list===originalList
  //否則返回一個theItem在正確位置上的新list
  const list = await (async ()=>{
    const originalList = await todoModel.findList(node_id);
    if(!!!anchor_id) return originalList;

    const result = [...originalList];
    const theItemIndex = result.findIndex(item=>(item._id.toString()===anchor_id.toString()));
    const theItem = result[theItemIndex];

    result.splice(theItemIndex,1);
    result.splice((theItem.order-1),0,theItem);
    return result;
  })();
  
  
  
  //找出需要reOrder的 items
  const newOrderArray = [];
  list.forEach((item,index)=>{
    const expectOrder = index+1;
    if(item.order != expectOrder) newOrderArray[index] = expectOrder;
  });
  //update new order
  newOrderArray.forEach((newOrder,index)=>{
    rawModel.findByIdAndUpdate(list[index]._id,{order:newOrder}).then();
  });
  return true;
}

//新增
todoModel.add = async function(data) {
  const list = await todoModel.findList(data.parent_id);
  const newData = !!data.order ? data : {...data , order:(list.length+1)};
  const result = await rawModel.create(newData);
  if(!!data.order) reOrderList(data.parent_id, result._id);
  return result;
}

/**
 * 更新
 * 如果沒有設定order或order沒有變化，直接回傳結果
 * 否則需要更新整個list的order
 */
todoModel.update = async function(_id,data) {
  const theItem = await todoModel.get(_id);
  const result = await rawModel.findByIdAndUpdate(_id,data,{new:true});
  if(!!!data.order) return result;
  if(theItem.order.toString() !== data.order.toString()) reOrderList(theItem.parent_id, _id);
  if(theItem.parent_id!==result.parent_id && theItem.parent_id.toString() !== result.parent_id.toString()) reOrderList(theItem.parent_id, _id);
  return result;
}



//自訂model method
//回傳指定id下一層的todo
todoModel.findList = async function(parent_id) {
  const result = await rawModel.find({parent_id:parent_id}, (err, todos) => {
    if (err) {
      return console.error(err);
    }
    return todos;
  });
  return result.sort((a,b)=>(a.order-b.order));
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

module.exports = todoModel;