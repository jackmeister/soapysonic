/* JQuery functions for browsing the library. */
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
		$( '#library-browser' ).append('<div class="album-list">');
		$( response ).find( 'song' ).each( function(){
			var $song = $(this);
			var $html = '<div class="song" id="' + $song.attr('id') + '">';
			$html += '<a><dt>' + $song.attr('title') + '</a></dt>';
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

// Plays a single song, updating the "now playing" panel appropriately. 
function playSong( id ) {
	// Update the "now playing" panel text
	$.ajax({
	'url': '/rest/getSong.view?id=' + id
	, dataType: 'xml'
	, 'beforeSend': function( xhr ) {
		xhr.setRequestHeader('Authorization', 'Basic ' + btoa(username + ':' + password))
	}
	, success: function( response, textStatus, jqXHR ) {
		var $song = $( response ).find( 'song' );
		$( '#np-title' ).text( $song.attr('title') );
		$( '#np-artist' ).text( $song.attr('artist') );
		$( '#np-album' ).text( $song.attr('album') );
	}
	});
	// Update the "now playing" panel cover art
	$( '#np-cover-art' ).html( '<img src="/rest/getCoverArt.view?id=' + id + '&u=' + username + '&p=' + password + '&size=100"/>' );

	stream('/rest/stream.view?id=' + id);
}

// Begins streaming audio from a given URL.
function stream( url ) {

	var buffer = null;
	loadAudio(url);
	// Wait for loadAudio to create an AudioBuffer
	playWhenReady();

	function playWhenReady() {
		if (buffer === null) {
			console.log('null buffer, waiting');
			setTimeout(playWhenReady, 100)
		} else {
			playAudio(buffer);
		}
	}
	
	// Loads audio from the url and decodes it into the ArrayBuffer buffer.
	function loadAudio( url ) {
		// JQuery does not currently support the arraybuffer as a responseType, so use XMLHttpRequest directly
		var request = new XMLHttpRequest();
		request.open('GET', url, true);
		request.responseType = 'arraybuffer';
		request.setRequestHeader('Authorization', 'Basic ' + btoa(username + ':' + password));
		// Decode asynchronously
		request.onload = function() {
			context.decodeAudioData(request.response, function(buf) {
		  		buffer = buf;
				console.log('buffer: ' + buffer);
			}, function() {console.log('audio decoding error')} );
		}
		request.send();
	}

	// Plays audio from a given ArrayBuffer.
	function playAudio( buffer ) {
		console.log('playing from ' + buffer);
		var source = context.createBufferSource();
		source.buffer = buffer;
		source.connect(context.destination);
		source.start(0);
	}
}