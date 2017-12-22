/**
 * @license Copyright (c) 2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'path' );

/**
 * Adds necessary file paths to files array which results in Karma including them in the test context.
 *
 * @param {Array} files Array of files loaded by Karma.
 * @returns {undefined} undefined
 */
function setup( files ) {
	files.unshift( {
		pattern: path.join( __dirname, 'src/guest.js' ),
		included: true,
		served: true,
		watched: false,
		nocache: false
	} );
	files.unshift( {
		pattern: path.join( __dirname, 'src/host.js' ),
		included: true,
		served: true,
		watched: false,
		nocache: false
	} );
	files.unshift( {
		pattern: path.join( __dirname, 'src/queue.js' ),
		included: true,
		served: true,
		watched: false,
		nocache: false
	} );
	files.unshift( {
		pattern: path.join( __dirname, 'src/iframe.html' ),
		included: false,
		served: true,
		watched: false,
		nocache: false
	} );
}

setup.$inject = [ 'config.files' ];

module.exports = {
	'framework:ckeditor4-bender-iframes': [ 'factory', setup ]
};
