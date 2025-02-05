'use strict';
/* global mapboxgl */

var syncMove = require('@mapbox/mapbox-gl-sync-move');
var EventEmitter = require('events').EventEmitter;

function Compare(a, b, options) {
  this.options = options ? options : {};
  this._horizontal = options.orientation === 'horizontal';
  this._onDown = this._onDown.bind(this);
  this._onMove = this._onMove.bind(this);
  this._onMouseUp = this._onMouseUp.bind(this);
  this._onTouchEnd = this._onTouchEnd.bind(this);
  this._ev = new EventEmitter();
  this._swiper = document.createElement('div');
  this._swiper.className = this._horizontal ? 'compare-swiper-horizontal'  : 'compare-swiper-vertical';

  this._container = document.createElement('div');
  this._container.className = this._horizontal ? 'mapboxgl-compare mapboxgl-compare-horizontal'  : 'mapboxgl-compare';
  this._container.appendChild(this._swiper);

  a.getContainer().appendChild(this._container);

  this._clippedMap = b;
  this._bounds = b.getContainer().getBoundingClientRect();
  var swiperPosition = (this._horizontal ? this._bounds.height : this._bounds.width)/2;
  this._setPosition(swiperPosition);
  syncMove(a, b);

  b.on(
    'resize',
    function() {
      this._bounds = b.getContainer().getBoundingClientRect();
      if (this.currentPosition) this._setPosition(this.currentPosition);
    }.bind(this)
  );

  if (this.options && this.options.mousemove) {
    a.getContainer().addEventListener('mousemove', this._onMove);
    b.getContainer().addEventListener('mousemove', this._onMove);
  }

  this._swiper.addEventListener('mousedown', this._onDown);
  this._swiper.addEventListener('touchstart', this._onDown);
}

Compare.prototype = {
  _setPointerEvents: function(v) {
    this._container.style.pointerEvents = v;
    this._swiper.style.pointerEvents = v;
  },

  _onDown: function(e) {
    if (e.touches) {
      document.addEventListener('touchmove', this._onMove);
      document.addEventListener('touchend', this._onTouchEnd);
    } else {
      document.addEventListener('mousemove', this._onMove);
      document.addEventListener('mouseup', this._onMouseUp);
    }
  },

  _setPosition: function(x) {
    x = Math.min(x, this._horizontal
                    ? this._bounds.height
                    : this._bounds.width);
    var pos = this._horizontal
              ? 'translate(0, '+ x + 'px)'
              : 'translate(' + x + 'px, 0)';
    this._container.style.transform = pos;
    this._container.style.WebkitTransform = pos;
    var clip = this._horizontal
                ? 'rect('+ x + 'px, 999em, ' + this._bounds.width + 'px,0)'
                : 'rect(0, 999em, ' + this._bounds.height + 'px,' + x + 'px)';
    this._clippedMap.getContainer().style.clip = clip;
    this.currentPosition = x;
  },

  _onMove: function(e) {
    if (this.options && this.options.mousemove) {
      this._setPointerEvents(e.touches ? 'auto' : 'none');
    }

    this._horizontal
      ? this._setPosition(this._getY(e))
      : this._setPosition(this._getX(e));
  },

  _onMouseUp: function() {
    document.removeEventListener('mousemove', this._onMove);
    document.removeEventListener('mouseup', this._onMouseUp);
    this.fire('slideend', { currentPosition: this.currentPosition });
  },

  _onTouchEnd: function() {
    document.removeEventListener('touchmove', this._onMove);
    document.removeEventListener('touchend', this._onTouchEnd);
  },

  _getX: function(e) {
    e = e.touches ? e.touches[0] : e;
    var x = e.clientX - this._bounds.left;
    if (x < 0) x = 0;
    if (x > this._bounds.width) x = this._bounds.width;
    return x;
  },

  _getY: function(e) {
    e = e.touches ? e.touches[0] : e;
    var y = e.clientY - this._bounds.top;
    if (y < 0) y = 0;
    if (y > this._bounds.height) y = this._bounds.height;
    return y;
  },

  setSlider: function(x) {
    this._setPosition(x);
  },

  on: function(type, fn) {
    this._ev.on(type, fn);
    return this;
  },

  fire: function(type, data) {
    this._ev.emit(type, data);
    return this;
  },

  off: function(type, fn) {
    this._ev.removeListener(type, fn);
    return this;
  }
};

if (window.mapboxgl) {
  mapboxgl.Compare = Compare;
} else if (typeof module !== 'undefined') {
  module.exports = Compare;
}
