
/*global window,jQuery */

"use strict";

var Bookmarklet;

/**
 * Bookmarklet constructor.
 * Creates bookmarklet and setups all event handlers.
 *
 * @constructor
 */
Bookmarklet = function (settings) {
  var t = this,
      cleanUrl;

  this.settings = settings;
  this.url = settings.url;

  // Compatibility fix for some IE versions.
  this.compatibilityFix();

  // Check if the url contains '?'.
  cleanUrl = this.url.indexOf('?') === -1;

  // Build url.
  this.url = cleanUrl ? this.url + '?title=' : this.url + '&title=';
  this.url += encodeURIComponent(document.title);
  this.url += '&url=' + encodeURIComponent(document.URL);
  this.url += settings.image ? this.getImages() : '';

  // Create bookmarklet.
  this.createBookmarklet(this.url);

  // Close bookmarklet when ESC key is pressed.
  document.onkeydown = function(evt) {
    evt = evt || window.event;
    if (evt.keyCode === 27) {
      t.closeBookmarklet();
    }
  };

  // Listen to message from bookmarklet iframe and close it after the message is received.
  var eventMethod = window.addEventListener ? 'addEventListener' : 'attachEvent',
      eventer = window[eventMethod],
      messageEvent = eventMethod === 'attachEvent' ? 'onmessage' : 'message';
      
  eventer(messageEvent,function(e) {
    if (e.data === 'close') {
      t.closeBookmarklet();
    }
  }, false);
};

/**
 * Inserts bookmarklet iframe and overlay to DOM.
 *
 * @function
 */
Bookmarklet.prototype.createBookmarklet = function (src) {
  var body = document.getElementsByTagName('body')[0],
      iframe = document.createElement('iframe'),
      overlay = document.createElement('div'),
      t = this;

  // Set iframe's and overlay's CSS.
  iframe.setAttribute('style', this.settings.css_iframe);
  overlay.setAttribute('style', this.settings.css_overlay);

  iframe.src = src;

  // Append them to the body.
  body.appendChild(iframe);
  body.appendChild(overlay);

  // Close bookmarklet when overlay is clicked.
  overlay.onclick = function() {
    t.closeBookmarklet();
  };

  // Set pointer to iframe and overlay.
  this.bookmarklet = {
    iframe: iframe,
    overlay: overlay
  }
};

/**
 * Finds all images, checks their width and height and sorts them by height
 * in descending order.
 *
 * We limit number of images to 20 to don't exceed url length limit.
 *
 * @function
 * @return {string} url component containing array of images.
 */
Bookmarklet.prototype.getImages = function() {
  var images = [],
      images_string = '',
      width  = this.settings.image_width,
      height = this.settings.image_height,
      image,
      i;

  // Check width and height.
  for (i in document.images) {
    image = document.images[i];

    if (image.width >= width && image.height >= height && image.src) {
      images.push(image);
    }
  }

  // Sort images by height in descending order.
  images = images.sort(function(a, b) { return - a.height + b.height; });


  // Build url component.
  for (i in images) {
    images_string += '&images[' + i + ']=' + encodeURIComponent(images[i].src);

    if (i > 20) break;
  }

  return images_string;
}

/**
 * Fixes missing array.filter function in some versions if IE.
 *
 * @function
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter#Compatibility
 */
Bookmarklet.prototype.compatibilityFix = function() {
  if (!Array.prototype.filter) {
    Array.prototype.filter = function(fun /*, thisp*/)  {
      "use strict";

      if (this === null) {
        throw new TypeError();
      }

      var t = Object(this);
      var len = t.length >>> 0;
      if (typeof fun !== 'function') {
        throw new TypeError();
      }
      var res = [];
      var thisp = arguments[1];
      for (var i = 0; i < len; i++) {
        if (i in t) {
          var val = t[i]; // in case fun mutates this
          if (fun.call(thisp, val, i, t))
            res.push(val);
        }
      }

      return res;
    };
  }
}

/**
 * Removes bookmarklet iframe and overlay from DOM.
 *
 * @function
 */
Bookmarklet.prototype.closeBookmarklet = function() {
  var iframe  = this.bookmarklet.iframe,
      overlay = this.bookmarklet.overlay;

  // Remove from dom.
  iframe.parentNode.removeChild(iframe);
  overlay.parentNode.removeChild(overlay);

  // Delete pointer.
  delete this.bookmarklet;
}

/**
 * Creates new bookmarklet iframe in a case that bookmarklet instance
 * has been created already but iframe is missing (user closed it).
 *
 * @function
 */
Bookmarklet.prototype.reOpen = function() {
  if (!this.bookmarklet) {
    this.createBookmarklet(this.url);
  }
}
