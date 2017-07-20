var fs = require('fs')
var path = require('path')
var http = require('http')
var tape = require('tape')
var concat = require('concat-stream')
var Dat = require('dat-node')
var ram = require('random-access-memory')
var hyperdrive = require('hyperdrive')
var tmp = require('temporary-directory')
var ecstatic = require('ecstatic')
var datHttp = require('./')

tape('can end replication immediately', function (t) {
  makeTestServer(t, function runTest (datDir, destDir, cleanup) {
    var storage = datHttp('http://localhost:9988')
    var httpDrive = hyperdrive(storage, {latest: true})
    httpDrive.on('ready', function () {
      Dat(destDir, {key: httpDrive.key, sparse: true}, function (err, dat) {
        if (err) return t.ifErr(err, 'error')
        var localReplicate = dat.archive.replicate()
        var httpReplicate = httpDrive.replicate()
        localReplicate.pipe(httpReplicate).pipe(localReplicate)
        localReplicate.end()
        httpReplicate.end()
        var pending = 2
        localReplicate.on('end', function () {
          console.log('local replicate ended')
          if (--pending === 0) onEnd()
        })
        httpReplicate.on('end', function () {
          console.log('http replicate ended')
          if (--pending === 0) onEnd()
        })
        function onEnd () {
          httpDrive.close(function () {
            dat.close(function () {
              cleanup()
            })
          })
        }
      })
    })
  })
})

tape('replicate file', function (t) {
  makeTestServer(t, function runTest (datDir, destDir, cleanup) {
    var storage = datHttp('http://localhost:9988')
    var httpDrive = hyperdrive(storage, {latest: true})
    httpDrive.on('ready', function () {
      Dat(destDir, {key: httpDrive.key, sparse: true}, function (err, dat) {
        if (err) return t.ifErr(err, 'error')
        var localReplicate = dat.archive.replicate()
        localReplicate.pipe(httpDrive.replicate()).pipe(localReplicate)
        dat.archive.readFile('/hello.txt', function (err, content) {
          if (err) return t.ifErr(err, 'error')
          t.equals(content.toString(), 'hello', 'got hello')
          t.equals(fs.readFileSync(path.join(destDir, 'hello.txt')).toString(), 'hello', 'file exists and matches')
          httpDrive.close()
          dat.close()
          cleanup()
        })
      })
    })
  })
})

tape('replicate byte range', function (t) {
  makeTestServer(t, function runTest (datDir, destDir, cleanup) {
    var storage = datHttp('http://localhost:9988')
    var httpDrive = hyperdrive(storage, {latest: true})
    httpDrive.on('ready', function () {
      Dat(destDir, {key: httpDrive.key, sparse: true}, function (err, dat) {
        if (err) return t.ifErr(err, 'error')
        var localReplicate = dat.archive.replicate()
        localReplicate.pipe(httpDrive.replicate()).pipe(localReplicate)
        var rs = dat.archive.createReadStream('/numbers.txt', {start: 1000, end: 1100})
        rs.pipe(concat(function (content) {
          t.equals(content.length, 1000, 'length 1000')
          t.equals(content[0], 1000, '1000')
          t.equals(content[100], 1100, '1100')
          t.ok(fs.readFileSync(path.join(destDir, 'numbers.txt')), 'file exists')
          cleanup()
        }))
      })
    })
  })
})

function makeTestServer (t, cb) {
  tmpDat(t, function (err, datDir, datCleanup) {
    if (err) t.ifErr(err)
    tmp(function (err, destDir, tmpCleanup) {
      if (err) t.ifErr(err)
      var server = http.createServer(ecstatic({ root: datDir }))
      server.listen(9988, function (err) {
        if (err) t.ifErr(err)
        var cleanup = function () {
          tmpCleanup(function (err) {
            if (err) t.ifErr(err)
            datCleanup(function (err) {
              if (err) t.ifErr(err)
              server.close(function () {
                t.end()
              })
            })
          })
        }
        cb(datDir, destDir, cleanup)
      })
    })
  })
}

function tmpDat (t, cb) {
  tmp(function created (err, dir, cleanup) {
    if (err) return cb(err)
    var bigBuf = new Buffer(1024 * 1024 * 10)
    for (var i = 0; i < bigBuf.length; i++) bigBuf[i] = i
    fs.writeFileSync(path.join(dir, 'numbers.txt'), bigBuf)
    fs.writeFileSync(path.join(dir, 'hello.txt'), 'hello')
    Dat(dir, function (err, dat) {
      if (err) return cb(err)
      dat.importFiles(function (err) {
        if (err) return cb(err)
        dat.close(function () {
          cb(null, dir, cleanup)
        })
      })
    })
  })
}
