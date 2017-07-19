var request = require('request')

module.exports = function (host) {
  return {
    metadata: function (filename, opts) {
      var base = host + '/.dat/metadata.'
      return HTTPFile(base + filename)
      // if (typeof dir === 'function') return dir('.dat/metadata.' + name)
      // if (name === 'secret_key') return secretStorage()(path.join(dir, '.dat/metadata.ogd'), {key: opts.key, discoveryKey: opts.discoveryKey})
      // return raf(path.join(dir, '.dat/metadata.' + name))
    },
    content: function (filename, opts, archive) {
      var base = host + '/.dat/content.'
      return HTTPFile(base + filename)
      // if (!archive) archive = opts
      // if (name === 'data') return createStorage(archive, dir)
      // if (typeof dir === 'function') return dir('.dat/content.' + name)
      // return raf(path.join(dir, '.dat/content.' + name))
    }
  }
}

function HTTPFile (uri, opts) {
  if (!(this instanceof HTTPFile)) return new HTTPFile(uri , opts)
  if (!opts) opts = {}
  this.uri = uri
}

HTTPFile.prototype.open = function (cb) {
  if (cb) process.nextTick(cb)
}

HTTPFile.prototype.write = function (offset, data, cb) {
  if (cb) process.nextTick(cb)
}

HTTPFile.prototype.read = function (offset, len, cb) {
  request(this.uri, {encoding: null}, function (err, resp, body) {
    if (err || resp.statusCode > 299) {
      return cb(err || new Error('Request Error ' + resp.statusCode))
    }
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
