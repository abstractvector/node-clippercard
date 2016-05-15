# ClipperCard Parser
Unofficial Node.js library to retrieve and parse profile and activity data from the Bay Area's Clipper Card system.

  [![Build Status][travis-image]][travis-url]
  [![Node Version][node-image]][node-url]
  [![NPM Version][npm-image]][npm-url]
  [![NPM Downloads][downloads-image]][downloads-url]

#Usage

This library works by emulating a user logging on through the [ClipperCard](https://www.clippercard.com/ClipperWeb/index.do) website. The library attempts to be as polite as possible when dealing with the website - minimizing the traffic and being respectful of the site. Regardless, please familiarize yourself with their Terms of Use before using this library so you can ensure that you are using this in accordance with their policies.

The default User-Agent string for this library identifies itself as this Node.js module, so the site administrators can easily identify the traffic if necessary. The goal of this library is *not* to misuse the site, but merely to provide easy access to the data within. If and when there is a ClipperCard API available, I will switch this library over to that.

Your use of this library is entirely at your own risk.

#Installation

To get started, simply install the module using npm:

    npm install node-clippercard

and then `require` it:

    var ClipperAccount = require('node-clippercard');

or using ES6 imports:

    import ClipperAccount from 'node-clippercard'

#Classes

This library exposes classes called `ClipperAccount` and `ClipperStatement`.

##ClipperAccount

This is intended to be the primary access point for the library. It provides the `login()` capability needed to access the account.

###new ClipperAccount(options)

* options `Object` An options object containing at least `email` and `password`

Creates a new `ClipperAccount` instance ready to log in to an account.

    let clipperAccount = new ClipperAccount({email: "test@example.com", password: "test");

###ClipperAccount.login(callback, forceRefresh=false)

###ClipperAccount.getProfile(callback, forceRefresh=false)

##ClipperStatement

[travis-image]: https://travis-ci.org/abstractvector/node-clippercard.svg?branch=master
[travis-url]: https://travis-ci.org/abstractvector/node-clippercard
[node-image]: https://img.shields.io/node/v/node-clippercard.svg
[node-url]: https://npmjs.org/package/node-clippercard
[npm-image]: https://img.shields.io/npm/v/node-clippercard.svg
[npm-url]: https://npmjs.org/package/node-clippercard
[downloads-image]: https://img.shields.io/npm/dt/node-clippercard.svg
[downloads-url]: https://npmjs.org/package/node-clippercard
