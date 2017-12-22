/**
 * @license Copyright (c) 2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or http://ckeditor.com/license
 */

/* eslint-env browser */

( function( window ) {

	'use strict';

	// Very simple queue class, used for queuing test suites in host window.
	function TestQueue() {
		this._queue = [];
	}

	TestQueue.prototype.add = function( testSuite ) {
		this._queue.push( testSuite );
	};

	TestQueue.prototype.next = function() {
		if ( this._queue.length ) {
			return this._queue.shift();
		}
		return false;
	};

	window.TestQueue = TestQueue;

} ( window ) );
