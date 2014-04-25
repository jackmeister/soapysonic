/* Javascript/JQuery functions for browsing the library. */

$( document ).ready(function() {
	username = 'jack';
	password = 'pass';
	context = null;

	init();
	showLibrary();
});

// Creates the audio context.
function init() {
	try {
		// Account for prefixing in Safari, Opera, mobile Chrome
		window.AudioContext = window.AudioContext || window.webkitAudioContext;
		context = new AudioContext();
	}
	catch(e) {
		alert('Web Audio is not supported in this browser; nothing will play.');
	}
}


// Renders the list of artists.
function showLibrary() {
	$.ajax({
		'url': '/rest/getArtists.view'
		, dataType: 'xml'
		, 'beforeSend': function( xhr ) {
			xhr.setRequestHeader('Authorization', 'Basic ' + btoa(username + ':' + password))
		}
		, success: function( response, textStatus, jqXHR ) {
			$( '#library-browser' ).html('<h1>Library</h1>');
			$( '#library-browser' ).append('<div class="artist-list"><ul>');

				$( response ).find( 'artist' ).each( function(){
					var $artist = $(this);
					var $html = '<div class="artist" id="' + $artist.attr('id') + '">';
					$html += '<li><a>' + $artist.attr('name') + '</a></li>';
					$html += '</div>';
					$( '#library-browser' ).append( $html );
				})
				$( '#library-browser' ).append( '</ul></div>' );

				// Add onclick handlers to the new divs
				$( '.artist' ).click(function() {
					showArtist( $(this).attr('id') );
				});

				// Update the sidebar
				$( '#nav' ).html('');
			}
	});
}

// Renders artist info, including an album list.
function showArtist( id ) {
	$.ajax({
		'url': '/rest/getArtist.view?id=' + id
		, dataType: 'xml'
		, 'beforeSend': function( xhr ) {
			xhr.setRequestHeader('Authorization', 'Basic ' + btoa(username + ':' + password))
		}
		, success: function( response, textStatus, jqXHR ) {
			var $artist = $( response ).find( 'artist' );
			$( '#library-browser' ).html('<h1>' + $artist.attr('name') + '</h1>');
			$( '#library-browser' ).append('<div class="album-list"><ul>');

				$( response ).find( 'album' ).each( function(){
					var $album = $(this);
					var $html = '<div class="album" id="' + $album.attr('id') + '">';
					$html += '<li><a>' + $album.attr('name') + '</a></li>';
					$html += '</div>';
					$( '#library-browser' ).append( $html );
				})
				$( '#library-browser' ).append( '</ul></div>' );

				// Add onclick handlers to the new divs
				$( '.album' ).click(function() {
					showAlbum( $(this).attr('id') );
				});

				// Update the sidebar
				$( '#nav' ).html('<div id="nav-library"><h1><a>Library</a></h1></div>');
				$( '#nav-library' ).click(function() {
					showLibrary();
				});
			}
	});
}

// Renders album info, including a list of songs.
function showAlbum( id ) {
	$.ajax({
	'url': '/rest/getAlbum.view?id=' + id
	, dataType: 'xml'
	, 'beforeSend': function( xhr ) {
		xhr.setRequestHeader('Authorization', 'Basic ' + btoa(username + ':' + password))
	}
	, success: function( response, textStatus, jqXHR ) {
		var $album = $( response ).find( 'album' );
		$( '#library-browser' ).html('<h1>' + $album.attr('name') + '</h1>');
		$( '#library-browser' ).append('<div class="album-list"><ul>');
		$( response ).find( 'song' ).each( function(){
			var $song = $(this);
			var $html = '<div class="song" id="' + $song.attr('id') + '">';
			$html += '<li><a>' + $song.attr('title') + '</a></li>';
			$html += '</div>';
			$( '#library-browser' ).append( $html );
		});
		$( '#library-browser' ).append( '</div>' );

		// Add onclick handlers to the newly created divs
		$( '.song' ).click(function() {
			playSong( $(this).attr('id') );
		});

		// Update the sidebar
		$( '#nav' ).append('<div id="nav-artist"><h2><a>' + $album.attr('artist') + '</a></h2></div>');
		$( '#nav-artist' ).click(function() {
			showArtist( $album.attr('artistId') );
		});
	}
	});
}