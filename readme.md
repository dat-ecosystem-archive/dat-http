[![deprecated](http://badges.github.io/stability-badges/dist/deprecated.svg)](https://dat-ecosystem.org/) 

More info on active projects and modules at [dat-ecosystem.org](https://dat-ecosystem.org/) <img src="https://i.imgur.com/qZWlO1y.jpg" width="30" height="30" /> 

---

# dat-http

An HTTP transport/storage provider for Dat, allowing replication of Dats over normal HTTP connections from flat files on the server. Currently only supports read operations, write operations coming in the future (open an issue if you need this).

The entire `.dat` folder must be available on the server for this to work. Point this at the root url where the `.dat` folder is and you can use this to do replication.

This is implemented as a storage provider, conforming to the https://www.npmjs.com/package/abstract-random-access API. That may seem counterintuitive, as this provides a networkworking transport but implements a storage provider API. However, in Dat you can wrap a storage provider in a Hyperdrive instance to turn it into a network transport.

### example

```js
var hyperdrive = require('hyperdrive')
var Dat = require('dat-node')
var datHttp = require('dat-http')

// httpDrive is a drive that 'wraps' the http storage provider in a hyperdrive instance. It won't write any data to disk, in fact we won't be using it to write anything, only to read things.
var storage = datHttp('https://wherever-my-dat-is.com')
var httpDrive = hyperdrive(storage, {latest: true})

httpDrive.on('ready', function () {
  // create a 'real' dat using the default storage in a local folder
  Dat('./local-copy', {key: httpDrive.key, sparse: true}, function (err, dat) {
    if (err) throw err
    // heres the magic that hooks up the http read only hyperdrive to our real one
    var localReplicate = dat.archive.replicate()
    var httpReplicate = httpDrive.replicate()
    localReplicate.pipe(httpReplicate).pipe(localReplicate)
  
    // after this point, the 'real' dat will use the http dat as a source for all data
  })
})
```
