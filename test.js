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
  tmpDat(t, function (err, datDir, datCleanup) {
    if (err) t.ifErr(err)
    var server = http.createServer(ecstatic({ root: datDir }))
    server.listen(9988, function () {
      var storage = datHttp('http://localhost:9988')
      var httpDrive = hyperdrive(storage)
      httpDrive.on('ready', function () {
        tmp(function (err, dir, cleanup) {
          if (err) t.ifErr(err)
          Dat(dir, {key: httpDrive.key}, function (err, dat) {
            if (err) return t.ifErr(err, 'error')
            var localReplicate = dat.archive.replicate()
            localReplicate.pipe(httpDrive.replicate()).pipe(localReplicate)
            dat.archive.readFile('/hello.txt', function (err, content) {
              console.log('read')
              if (err) return t.ifErr(err, 'error')
              t.equals(content.toString(), 'hello', 'got hello')
              t.equals(fs.readFileSync(path.join(dir, 'hello.txt')).toString(), 'hello', 'file exists and matches')
              cleanup(function (err) {
                if (err) t.ifErr(err)
                datCleanup(function (err) {
                  if (err) t.ifErr(err)
                  server.close()
                  t.end()
                })
              })
            })
          })
        })
      })
    })
  })
})

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
