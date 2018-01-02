/**
 * @license Copyright (c) 2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* eslint-env browser */
/* eslint prefer-arrow-callback: 0, prefer-template: 0, no-var: 0, object-shorthand: 0, no-console: 0, prefer-rest-params: 0, prefer-spread: 0 */

window.bender = window.bender || {};

( function( window ) {
	'use strict';

	// Do not execute inside main window.
	if ( window.top === window.self ) {
		return;
	}

	var config = JSON.parse( decodeURIComponent( window.location.hash.substr( 1 ) ) ),
		errors = [];

	// Sends post message to the host window.
	function sendMessage( type, data ) {
		var message;

		try {
			message = JSON.stringify( {
				type: type,
				data: data
			} );
		} catch ( err ) {
			if ( err.message.match( /Converting circular structure to JSON/i ) ) {
				data.args = [ data.args[ 0 ] ];
			} else {
				data.args = [ 'Error while converting console log: ' + err.message ];
			}
			message = JSON.stringify( {
				type: type,
				data: data
			} );
		}

		window.parent.postMessage( message, '*' );
	}

	// Pass console messages to host window.
	function proxyConsole( level ) {
		var original = console[ level ];

		if ( original instanceof Function ) {
			console[ level ] = function() {
				original.apply( console, arguments );
				sendMessage( 'console', {
					level: level,
					args: Array.apply( null, arguments )
				} );
			};
		}
	}

	// Catch and store unexpected errors so they may be passed to the main window.
	function addErrorListener() {
		function formatError( error ) {
			var stack = error.stack;
			var message = error.message;

			if ( stack && message ) {
				stack = message + '\n' + stack;
				return stack;
			}
			return message;
		}

		window.addEventListener( 'error', function( evt ) {
			errors.push( formatError( evt.error ) );
		} );
	}

	// Register error listener;
	addErrorListener();

	// Get fixtures.
	window.__html__ = window.parent.__html__;

	// Create methods needed for tests results gathering.
	window.__karma__.info = function( data ) {
		sendMessage( 'info', data );
	};

	window.__karma__.complete = function( data ) {
		if ( errors.length ) {
			data.result = {
				id: '',
				description: '',
				suite: [],
				success: false,
				skipped: false,
				pending: false,
				time: 0,
				log: errors,
				assertionErrors: [],
				startTime: 0,
				endTime: 0
			};
			errors = [];
		}

		sendMessage( 'complete', data );
	};

	window.__karma__.result = function( data ) {
		sendMessage( 'result', data );
	};

	window.__karma__.error = function( data ) {
		sendMessage( 'error', data );
	};

	// Proxy console if configured.
	if ( config.config.captureConsole ) {
		var levels = [ 'log', 'info', 'warn', 'error', 'debug' ];
		for ( var i = 0; i < levels.length; i++ ) {
			proxyConsole( levels[ i ] );
		}
	}

} ( window ) );
