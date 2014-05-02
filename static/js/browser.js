$( document ).ready(function() {
	username = 'jack';
	password = 'pass';
	audioContext = null;
	throbber = null;
	musicThrobber = null;

	init();
	buffAudio = new BuffAudio(audioContext, null)

	showLibrary();
});

function init() {
	createAudioContext();
	createThrobber();
	createMusicThrobber();

	function createAudioContext(){
		try {
			// Account for prefixing in Safari, Opera, mobile Chrome
			window.AudioContext = window.AudioContext || window.webkitAudioContext;
			audioContext = new AudioContext();
		}
		catch(e) {
			alert('Web Audio is not supported in this browser; nothing will play.');
		}
	}

	function createThrobber() {
		throbber = Throbber({
			color: 'orange'
			, padding: 75
			, size: 100
			, lines: 30
			, rotationspeed: 1
			, fade: 150
		}).appendTo( document.getElementById('throbber') );
	}

	function createMusicThrobber() {
		musicThrobber = Throbber({
			color: 'orange'
			, padding: 50
			, size: 70
			, lines: 20
			, rotationspeed: 10
			, clockwise: false
			, fade: 25
		}).appendTo( document.getElementById('np-throbber') );
	}

	// Playback controls
	$( '#pause' ).click(function(){
		pause();
	});
}


// Renders the list of artists.
function showLibrary() {
	throbber.start();

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
		, complete: function( jqXHR, textStatus ) { throbber.stop(); }
	});
}

// Renders artist info, including an album list.
function showArtist( id ) {
	throbber.start();

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
			$( '#nav' ).html('<div id="nav-library"><a><h1>Library</h1></a></div>');
			$( '#nav-library' ).click(function() {
				showLibrary();
			});
		}
		, complete: function( jqXHR, textStatus ) { throbber.stop(); }
	});
}

// Renders album info, including a list of songs.
function showAlbum( id ) {
	throbber.start();

	$.ajax({
		'url': '/rest/getAlbum.view?id=' + id
		, dataType: 'xml'
		, 'beforeSend': function( xhr ) {
			xhr.setRequestHeader('Authorization', 'Basic ' + btoa(username + ':' + password))
		}
		, success: function( response, textStatus, jqXHR ) {
			var $album = $( response ).find( 'album' );
			$( '#library-browser' ).html('<h1>' + $album.attr('name') + '</h1>');
			$( '#library-browser' ).html('<div class=play-all><h2><a>Play all</a></h2></div>');
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
			$( '#nav' ).append('<div id="nav-artist"><a><h2>' + $album.attr('artist') + '</h2></a></div>');
			$( '#nav-artist' ).click(function() {
				showArtist( $album.attr('artistId') );
			});
		}
		, complete: function( jqXHR, textStatus ) { throbber.stop(); }
	});
}