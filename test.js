var fs = require('fs')
var path = require('path')
var http = require('http')
var tape = require('tape')
var Dat = require('dat-node')
var ram = require('random-access-memory')
var hyperdrive = require('hyperdrive')
var tmp = require('temporary-directory')
var ecstatic = require('ecstatic')
var datHttp = require('./')

tape('replicate file', function (t) {
  makeTestServer(t, function runTest (datDir, destDir, cleanup) {
    var storage = datHttp('http://localhost:9988')
    var httpDrive = hyperdrive(storage, {latest: true})
    httpDrive.on('ready', function () {
      Dat(destDir, {key: httpDrive.key}, function (err, dat) {
        if (err) return t.ifErr(err, 'error')
        var localReplicate = dat.archive.replicate()
        localReplicate.pipe(httpDrive.replicate()).pipe(localReplicate)
        dat.archive.readFile('/hello.txt', function (err, content) {
          if (err) return t.ifErr(err, 'error')
          t.equals(content.toString(), 'hello', 'got hello')
          t.equals(fs.readFileSync(path.join(destDir, 'hello.txt')).toString(), 'hello', 'file exists and matches')
          cleanup()
        })
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
      server.listen(9988, function () {
        var cleanup = function () {
          tmpCleanup(function (err) {
            if (err) t.ifErr(err)
            datCleanup(function (err) {
              if (err) t.ifErr(err)
              server.close()
              t.end()
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
