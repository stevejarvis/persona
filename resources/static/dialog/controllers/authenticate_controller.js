/*jshint browser:true, jQuery: true, forin: true, laxbreak:true */
/*global BrowserID:true, PageController: true */
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Mozilla BrowserID.
 *
 * The Initial Developer of the Original Code is Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2011
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */
(function() {
  "use strict";

  var ANIMATION_TIME = 250,
      bid = BrowserID,
      user = bid.User,
      errors = bid.Errors,
      validation = bid.Validation,
      tooltip = bid.Tooltip,
      helpers = bid.Helpers,
      dom = bid.DOM,
      lastEmail = "";

  function getEmail() {
    return helpers.getAndValidateEmail("#email");
  }

  function checkEmail(event) {
    var email = getEmail(),
        self = this;

    cancelEvent(event);

    if (!email) return;

    user.isEmailRegistered(email, function onComplete(registered) {
      if (registered) {
        enterPasswordState.call(self);
      }
      else {
        createUserState.call(self);
      }
    }, self.getErrorDialog(errors.isEmailRegistered));
  }

  function createUser(event) {
    var self=this,
        email = getEmail();

    cancelEvent(event);

    if(email) {
      helpers.createUser.call(self, email);
    }
  }

  function authenticate(event) {
    var email = getEmail(),
        pass = helpers.getAndValidatePassword("#password"),
        self = this;

    cancelEvent(event);

    if(email && pass) {
      helpers.authenticateUser.call(self, email, pass, function() {
        self.close("authenticated", {
          email: email
        });
      });
    }
  }

  function resetPassword(event) {
    var email = getEmail();

    cancelEvent(event);

    if(email) {
      helpers.resetPassword.call(this, email);
    }
  }

  function animateSwap(fadeOutSelector, fadeInSelector, callback) {
    // XXX instead of using jQuery here, think about using CSS animations.
    $(fadeOutSelector).fadeOut(ANIMATION_TIME, function() {
      $(fadeInSelector).fadeIn(ANIMATION_TIME, callback);
    });
  }

  function cancelEvent(event) {
    if (event) event.preventDefault();
  }

  function enterEmailState(el) {
    if (!el.is(":disabled")) {
      this.submit = checkEmail;
      animateSwap(".returning:visible,.newuser:visible,.forgot:visible", ".start");
    }
  }

  function enterPasswordState(event) {
    cancelEvent(event);
    var self=this;

    self.publish("enter_password");
    self.submit = authenticate;
    animateSwap(".start:visible,.newuser:visible,.forgot:visible", ".returning", function() {
      dom.getElements("#password")[0].focus();
    });
  }

  function forgotPasswordState(event) {
    cancelEvent(event);

    this.submit = resetPassword;
    dom.setAttr("#email", "disabled", "disabled");

    animateSwap(".start:visible,.newuser:visible,.returning:visible", ".forgot");
  }

  function cancelForgotPassword(event) {
    cancelEvent(event);

    dom.removeAttr("#email", "disabled");
    enterPasswordState.call(this);
  }

  function createUserState(event) {
    cancelEvent(event);

    var self=this;

    self.publish("create_user");
    self.submit = createUser;
    animateSwap(".start:visible,.returning:visible,.forgot:visible", ".newuser");
  }


  function emailKeyUp(event) {
    var newEmail = dom.getInner(event.target);
    if (newEmail !== lastEmail) {
      lastEmail = newEmail;
      enterEmailState.call(this, $(event.target));
    }
  }

  PageController.extend("Authenticate", {}, {
    start: function(options) {
      var self=this;
      self.renderDialog("authenticate", {
        sitename: user.getHostname(),
        email: options.email || ""
      });

      self.submit = checkEmail;
      // If we already have an email address, check if it is valid, if so, show
      // password.
      if (options.email) self.submit();


      self.bind("#email", "keyup", emailKeyUp);
      self.bind("#forgotPassword", "click", forgotPasswordState);
      self.bind("#cancel_forgot_password", "click", cancelForgotPassword);

      self._super();
    },

    checkEmail: checkEmail,
    createUser: createUser,
    authenticate: authenticate,
    resetPassword: resetPassword
  });

}());
