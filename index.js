var request = require('request')
var datStorage = require('dat-storage')

module.exports = function (host) {
  return datStorage(function (name) {
    return HTTPFile(host + '/' + name)
  })
}

function HTTPFile (uri, opts) {
  if (!(this instanceof HTTPFile)) return new HTTPFile(uri , opts)
  if (!opts) opts = {}
  this.uri = uri
  this.length = 0
}

HTTPFile.prototype.open = function (cb) {
  var self = this
  request(this.uri, {encoding: null}, function (err, resp, body) {
    if (err || resp.statusCode > 299) {
      return cb(err || new Error('Request Error ' + resp.statusCode))
    }
    self.length = body.length
    cb(null)
  })
}

HTTPFile.prototype.write = function (offset, data, cb) {
  this.open(cb) // hack, fix in hypercore !!
}

HTTPFile.prototype.read = function (offset, len, cb) {
  request(this.uri, {encoding: null}, function (err, resp, body) {
    if (err || resp.statusCode > 299) {
      return cb(err || new Error('Request Error ' + resp.statusCode))
    }
    if (body.length < offset + len) return cb(new Error('Could not satisfy length'))
    var part = body.slice(offset, offset + len)
    cb(null, part)
  })
}

HTTPFile.prototype.del = function (offset, len, cb) {
  throw new Error('del not supported by dat-http')
  if (cb) process.nextTick(cb)
}

HTTPFile.prototype.close = function (cb) {
  if (cb) process.nextTick(cb)
}

HTTPFile.prototype.destroy = function (cb) {
  if (cb) process.nextTick(cb)
}
