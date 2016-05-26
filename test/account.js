import chai from 'chai'
let expect = chai.expect

import nock from 'nock'
nock.disableNetConnect();

import ClipperAccount from '../lib/account.js'

describe('ClipperAccount class', function() {

  describe('The class itself', function() {
    it('can be constructed', function() {
      expect(ClipperAccount).to.be.a('function');
    });

    it('is called ClipperAccount', function() {
      expect(ClipperAccount.name).to.equal('ClipperAccount');
    });
  });

  describe('Object instantiation', function() {
    it('accepts an options object with email and password', function() {
      let account = new ClipperAccount({email: 'test@example.com', password: 'test'});
      expect(account).to.be.an.instanceof(ClipperAccount);
      expect(account.email).to.equal('test@example.com');
      expect(account.password).to.equal('test');
    });

    it('requires an email address', function() {
      expect(() => (new ClipperAccount({password: 'test'}))).to.throw(Error, /email/i);
    });

    it('requires a password', function() {
      expect(() => (new ClipperAccount({email: 'test@example.com'}))).to.throw(Error, /password/i);
    });
  });

  describe('User Agent behavior', function() {
    it('has a default user agent', function() {
      let account = new ClipperAccount({email: 'test@example.com', password: 'test'});
      expect(account.userAgent).to.be.a('string');
      expect(account.userAgent).to.have.length.above(10);
    });

    it('accepts a user agent', function() {
      let account = new ClipperAccount({email: 'test@example.com', password: 'test', userAgent: 'myTestUserAgent'});
      expect(account.userAgent).to.equal('myTestUserAgent');
    });
  });

  describe('The object', function() {
    let account = new ClipperAccount({email: 'test@example.com', password: 'test'});

    describe('The URIs', function() {
      it('has default URIs specified', function() {
        expect(account.uris).to.be.an('object');
        expect(account.uris).to.have.keys('login', 'dashboard', 'sessionExpired');
      });

      it('has a valid login URI', function() {
        expect(account.uris.login).to.be.a('string');
        expect(account.uris.login).to.equal('https://www.clippercard.com/ClipperCard/loginFrame.jsf');
      });

      it('has a valid dashboard URI', function() {
        expect(account.uris.dashboard).to.be.a('string');
        expect(account.uris.dashboard).to.equal('https://www.clippercard.com/ClipperCard/dashboard.jsf');
      });

      it('has a valid session expired URI', function() {
        expect(account.uris.sessionExpired).to.be.a('string');
        expect(account.uris.sessionExpired).to.equal('https://www.clippercard.com/ClipperCard/sessionExpired.jsf');
      });
    });

    describe('The methods', function() {
      describe('login()', function() {
        it('has a login() method', function() {
          expect(account).to.respondTo('login');
        });
      });

      describe('getProfile()', function() {
        it('has a getProfile() method', function() {
          expect(account).to.respondTo('getProfile');
        });
      });
    });
  });

  describe('Data retrieval', function() {
    let account = new ClipperAccount({email: 'test@example.com', password: 'test'});

    let cookies = [
      'JSESSIONID=!SlNFU1NJT05JRA==; path=/ClipperCard; secure; HttpOnly',
      'visid_incap_123456=dmlzaWRfaW5jYXBfMTIzNDU2; expires=Tue, 31 Dec 2099 12:34:56 GMT; path=/; Domain=.clippercard.com',
      'incap_ses_12_123456=aW5jYXBfc2VzXzEyXzEyMzQ1Ng==; path=/; Domain=.clippercard.com',
      '___utmvmABcdEFG=X19fdXRtdm1BQmNkRUZH; path=/; Max-Age=900',
      '___utmvaABcdEFG=X19fdXRtdmFBQmNkRUZH; path=/; Max-Age=900',
      '___utmvbABcdEFG=X19fdXRtdmJBQmNkRUZH; path=/; Max-Age=900'
    ];

    beforeEach(function() {
      let loginPage = nock('https://www.clippercard.com')
          .get('/ClipperCard/loginFrame.jsf')
          .replyWithFile(200, __dirname + '/fixtures/login-frame.html', {'Set-Cookie': cookies});
      
      let loginPost = nock('https://www.clippercard.com')
          .post('/ClipperCard/loginFrame.jsf')
          .matchHeader('cookie', function(h) {
            return h.indexOf('JSESSIONID=!SlNFU1NJT05JRA==') > -1;
          })
          .replyWithFile(302, __dirname + '/fixtures/login-post.html', {
            'location': 'https://www.clippercard.com/ClipperCard/dashboard.jsf',
            'set-cookie': [
              'firstName=firstName; path=/; secure; Max-Age=300; Expires=Tue, 31-Dec-2099 12:34:56;secure; GMT;secure;',
              'JSESSIONID=!bG9nZ2VkaW5KU0VTU0lPTklE; path=/ClipperCard; secure; HttpOnly'
            ]
          });

      let dashboard = nock('https://www.clippercard.com')
          .get('/ClipperCard/dashboard.jsf')
          .replyWithFile(200,  __dirname + '/fixtures/dashboard.html');
    });

    describe('Logging in', function() {
      it('works', function() {
        account.getProfile(function(error, result) {
          expect(error).to.be(null);
          expect(result).to.be.an('object');
          expect(result).to.have.keys('name', 'email');
        });
      });
    });
  });

});
