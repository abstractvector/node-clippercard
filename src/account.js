import request from 'request'
import cheerio from 'cheerio'
import pjson from '../package.json'

/*
 * The ClipperAccount class serves as the wrapper for the account itself and is
 * the entry point for logging in to the Clipper Card. It has profile and
 * payment data bound to it, and provides access to the cards and their
 * statements.
 */
class ClipperAccount {

  /**
   * Constructor to create a new ClipperAccount
   *
   * @param {object} options - Contains required options for creating the class
   */
  constructor(options) {
    this.MAX_LOGIN_ATTEMPTS = 3;

    this.uris = {
      login: 'https://www.clippercard.com/ClipperCard/loginFrame.jsf',
      dashboard: 'https://www.clippercard.com/ClipperCard/dashboard.jsf',
      sessionExpired: 'https://www.clippercard.com/ClipperCard/sessionExpired.jsf'
    };

    this.userAgent = pjson.name + '@' + pjson.version;

    this.cookies = undefined;

    this.email = undefined;
    this.password = undefined;

    this.profile = undefined;
    this.cards = undefined;

    this._failedLoginCount = 0;

    if ('object' === typeof options) {

      // check we have a valid email address
      if (options.email && 'string' === typeof options.email) {
        this.email = options.email;
      } else {
        throw new Error('Email address must be provided in the class options');
      }

      // check we have a valid password
      if (options.password && 'string' === typeof options.password) {
        this.password = options.password;
      } else {
        throw new Error('The password must be provided in the class options');
      }

    }
  }

  /**
   * Loads the login form and extracts the form elements, then submits the
   * form. By the time the callback is invoked, the cookie jar is in the right
   * state to be logged in. Once a cookie jar exists, this method will lazy
   * bypass itself unless forceRefresh=true.
   *
   * @param {function} callback - invoked as callback(error);
   * @param {boolean} forceRefresh - set true to refresh cookies [false]
   */
  login(callback, forceRefresh=false) {
    if ('function' !== typeof callback) {
      callback = function(){};
    }

    if (false === forceRefresh && 'object' === typeof this.cookies) {
      return callback(null);
    }

    this._failedLoginAttempts = 0;
    this._login(callback);
  }

  /* Processes the actual login request
   *
   * @param {function} callback - invoked as callback(error);
   */
  _login(callback) {
    var self = this;

    this.cookies = request.jar();

    request({
      method: 'GET',
      uri: this.uris.login,
      gzip: true,
      jar: this.cookies
    }, function (error, response, body) {
      if (error) {
        return callback(error);
      }

      var $ = cheerio.load(body);
      var form = $('form').first().serializeArray();
      var formId = $('form').first().attr('id');

      // parse the form elements
      var params = {};
      for (var i of form) {
        if (undefined !== i.name && 'string' === typeof i.name) {
          params[i.name] = i.value;
        }
      }

      // manually add in the username and password
      params[formId + ':username'] = self.email;
      params[formId + ':password'] = self.password;

      // and some other parameters that look like they're needed
      params['javax.faces.source'] = formId + ':submitLogin';
      params['javax.faces.partial.event'] = 'click';
      params['javax.faces.partial.execute'] = formId + ':submitLogin ' + formId + ':username' + formId + ':password';
      params['javax.faces.partial.render'] = formId + ':err';
      params['javax.faces.behavior.event'] = 'action';
      params['javax.faces.partial.ajax'] = 'true';

      request({
        method: 'POST',
        uri: self.uris.login,
        gzip: true,
        jar: self.cookies,
        form: params
      }, function (error, response, body) {
        if (error) {
          return callback(error);
        }

        if ('string' === typeof response.headers.location) {
          if (self.uris.dashboard === response.headers.location) {
            self._failedLoginCount = 0;
            return callback(null);
          } else if (self.uris.sessionExpired === resposne.headers.location) {
            if (++self._failedLoginCount >= self.MAX_LOGIN_ATTEMPTS) {
              return callback(new Error('Exceeded maximum number of failed login attempts'));
            } else {
              return self._login(callback, forceRefresh);
            }
          } else {
            return callback(new Error('Redirected to an unexpected location: ' + response.headers.location));
          }
        } else {
          return callback(new Error(
            'Logging in did not redirect as expected: ' + JSON.stringify(response.headers)
          ));
        }
      });
    });
  };

  getProfile(callback, forceRefresh=false) {
    if ('function' !== typeof callback) {
      callback = function() {};
    }

    if (false === forceRefresh && 'object' === typeof this.profile) {
      return callback(null, this.profile);
    }

    var self = this;

    this._login(function(error) {
      if (error) {
        return callback(error);
      }

      self._getProfile(function(error, result) {
        if (error) {
          // we'll force a refreshed login this time
          self._login(function(error) {
            if (error) {
              return callback(error);
            }
            self._getProfile(callback);
          }, true);
        }
        callback(null, result);
      });

    });
  }

  _getProfile(callback) {
    var self = this;

    request({
      method: 'GET',
      uri: this.uris.dashboard,
      gzip: true,
      jar: this.cookies
    }, function (error, response, body) {
      if (error) {
        return callback(error);
      }

      var $ = cheerio.load(body);

      self.profile = {};
      try {
        self.profile.name = $('div.fieldName:contains("Name on Account:")').next('div.fieldData').text();
        self.profile.email = $('div.fieldName:contains("Email:")').next('div.fieldData').text();
        self.profile.address = $('div.fieldName:contains("Address:")').next('div.fieldData').text();
        self.profile.phone = $('div.fieldName:contains("Phone:")').next('div.fieldData').text();
      } catch (e) {
        if (e instanceof TypeError) {
          // swallow any TypeError exceptions that are thrown
          console.log(e);
        } else {
          return callback(e);
        }
      }

      self.profile.payment = {};
      try {
        self.profile.payment.primary = $('div.fieldName:contains("Primary:")').next('div.fieldData').text();
        self.profile.payment.expiry = $('div.fieldData:contains("Exp.")').text().match(/[0-9]{2}\/[0-9]{2}/)[0];
      } catch (e) {
        if (e instanceof TypeError) {
          // swallow any TypeError exceptions that are thrown
          console.log(e);
        } else {
          return callback(e);
        }
      }

      callback(null, self.profile);
    });
  }

}

export default ClipperAccount
