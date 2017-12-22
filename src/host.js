/**
 * @license Copyright (c) 2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* eslint-env browser */
/* eslint prefer-arrow-callback: 0, prefer-template: 0, no-var: 0, object-shorthand: 0, no-console: 0 */

window.bender = window.bender || {};

( function( window, bender ) {
	'use strict';

	// Do not execute inside iframe.
	if ( window.top !== window.self ) {
		return;
	}

	var config = window.__karma__.config,
		files = Object.keys( window.__karma__.files ),
		runner = window.__karma__,
		testQueue = new window.TestQueue(),
		totalTests = 0,
		iframe = null;

	// Returns array of file paths/urls (as generated by karma) matching given filename or regular expression.
	function getFilesPath( fileName ) {
		if ( fileName instanceof RegExp ) {
			return files.filter( function( file ) {
				return !!file.match( fileName );
			} );
		} else {
			return files.filter( function( file ) {
				return file.split( '/' ).pop() === fileName;
			} );
		}
	}

	// Returns a list of scripts loaded by karma on the main window. These scripts are then loaded inside the iframe.
	// Use only dynamically loaded scripts (crossOrigin=anonymous) and skip test files (as they are loaded manually on
	// the very end inside iframe).
	function getInitialScripts() {
		var scripts = [];
		document.querySelectorAll( 'script' ).forEach( function( script ) {
			if ( script.src && script.crossOrigin === 'anonymous' && !script.src.match( /\/base\/tests\// ) ) {
				scripts.push( script.src );
			}
		} );
		return scripts;
	}

	// Returns list of custom scripts which handles bender/mocha transition. This is hardcoded now, better approach could
	// be adding it to Karma config.
	function getTestsScripts( testFile ) {
		var scripts = [];
		scripts = scripts.concat( getFilesPath( /.*\/_karma\/(?!runner\.js).*\.js/ ) );
		scripts = scripts.concat( getFilesPath( /_karma\/runner.js/ ) );
		scripts.push( testFile.fullpath );
		return scripts;
	}

	// Creates an Iframe which runs given test suite inside.
	function runIframedTest( testSuite ) {
		if ( iframe ) {
			iframe.remove();
			iframe = null;
		}

		iframe = document.createElement( 'iframe' );
		iframe.src = 'about:blank';
		iframe.style.position = 'absolute';
		iframe.style.left = '0';
		iframe.style.top = '0';
		iframe.style.width = '100%';
		iframe.style.height = '100%';
		iframe.style.border = '0';
		iframe.style.margin = '0';
		iframe.style.padding = '0';

		document.body.appendChild( iframe );

		iframe.src = getFilesPath( 'iframe.html' ).pop() + '#' + encodeURIComponent( JSON.stringify( {
			tags: testSuite.tags,
			scripts: {
				initial: getInitialScripts(),
				ckeditor: getFilesPath( /base\/ckeditor.js/ ),
				karma: getTestsScripts( testSuite.tags.test.file )
			},
			config: config
		} ) );
	}

	function runNextTestSuite() {
		var testSuite = testQueue.next();
		if ( testSuite ) {
			runIframedTest( testSuite );
		} else {
			runner.complete();
		}
	}

	// Listen to iframe messages.
	function addMessageListener() {
		function onMessage( evt ) {
			var message = null;
			try {
				message = JSON.parse( evt.data );
			} catch ( err ) {
				console.error( 'Cannot parse guest message', err );
			}

			if ( message ) {
				var type = message.type,
					data = message.data;

				if ( type === 'console' ) {
					console[ data.level ].apply( null, data.args );

				} else if ( runner ) {
					switch ( type ) {
					case 'info':
						// Test suite execution started inside iframe.
						totalTests += data.total;
						// Karma does not allow to dynamically update total tests number.
						runner.info( {
							total: 0
						} );
						break;

					case 'complete':
						// Test suite execution ended inside iframe.
						if ( data.result ) {
							runner.result( data.result );
						}
						runNextTestSuite();
						break;

					case 'result':
						// Single test execution ended inside iframe.
						runner.result( data );
						break;

					case 'error':
						// Error occurred.
						runner.error( data );
						break;
					}
				}
			}
		}

		window.addEventListener( 'message', onMessage, false );
	}

	// Listen for messages from guest window.
	addMessageListener();

	// Adds test suite to a queue.
	bender.testSuite = function( testSuite ) {
		testQueue.add( testSuite );

		if ( !runner._initialized ) {
			// Add start method which starts tests execution. Done here to overwrite start added by karma-mocha adapter.
			runner._initialized = true;
			runner.start = function() {
				if ( !runner._started ) {
					runner._started = true;
					runNextTestSuite();
				}
			};
		}

		runner.start();
	};
} ( window, window.bender ) );
