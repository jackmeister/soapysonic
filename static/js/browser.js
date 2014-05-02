$( document ).ready(function() {
	username = 'jack';
	password = 'pass';
	audioContext = null;
	throbber = null;
	musicThrobber = null;
	paused = false;

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
		ctlPause();
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

	console.log(id);
	$.ajax({
		'url': '/rest/getAlbum.view?id=' + id
		, dataType: 'xml'
		, 'beforeSend': function( xhr ) {
			xhr.setRequestHeader('Authorization', 'Basic ' + btoa(username + ':' + password))
		}
		, success: function( response, textStatus, jqXHR ) {
			var $album = $( response ).find( 'album' );

			$( '#library-browser' ).html('<div id="title-panel"><div id="cover-art"></div></div><div id=track-listing></div>');
			// Show cover art only after loaded
			var id = $( response ).find( 'song' ).attr('id');
			$( '#cover-art' ).css( 'opacity', '0' );
			$( '#cover-art' ).html( '<img src="/rest/getCoverArt.view?id=' + id + '&u=' + username + '&p=' + password + '&size=200"/>' );
			$( '#cover-art img' ).on('load', function() {
				$( '#cover-art' ).css( 'opacity', '100' );
			});
			$( '#title-panel' ).append('<div id=title-text><h1>' + $album.attr('name') + '</h1></div>');
			$( '#title-text' ).append('<h2>' + $album.attr('artist') + '</h1>');

			// Show "play all" and a track list
			$( '#track-listing' ).append('<div class=play-all><a>&#9654; Play all</a></div>');
			$( '#track-listing' ).append('<div class="album-list"><ul>');
			$( response ).find( 'song' ).each( function(){
				var $song = $(this);
				var $html = '<li><div class="song" id="' + $song.attr('id') + '">';
				$html += '<a>' + $song.attr('title') + '</a>';
				$html += '</div></li>';
				$( '#track-listing' ).append( $html );
			});
			$( '#track-listing' ).append( '</div>' );
	
			// Add onclick handlers to the newly created divs
			var ids = [];
			var song_count = 0;
			$( '.song' ).each(function() { 
				ids.push( $(this).attr('id') );
				$( this ).click(function(cnt) {
					return function() { playSongs(ids, cnt) };
				}(song_count));
				++song_count;
			});
			$( '.play-all' ).click(function(){
				playSongs( ids );
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