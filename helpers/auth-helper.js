
function getUser(req) {
  return req.user || null
}

function getUserId(req) {
  return getUser(req)?.id
}

exports = module.exports = {
  getUser,
  getUserId
}
