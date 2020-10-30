module.exports.getDateFromBody = request => {
  const title = request.body.title;
  const isDone = request.body.isDone;
  const parent_id = request.body.parent_id!==undefined && (request.body.parent_id==='' || request.body.parent_id==='root') ? null:request.body.parent_id;
  const content = request.body.content;
  const data = {
    ...(title!==undefined && {title}),
    ...(isDone!==undefined && {isDone}),
    ...(parent_id!==undefined && {parent_id}),
    ...(content!==undefined && {content}),
  }
  return data;
}

