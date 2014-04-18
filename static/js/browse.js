/* JQuery functions for browsing the library. */
$( document ).ready(function() {

	username = 'jack';
	password = 'pass';

	// Renders the list of albums alphabetically by artist.
	$.ajax({
		'url': '/rest/getAlbumList2.view?type=alphabeticalByArtist&size=500'
		, dataType: 'xml'
		, 'beforeSend': function( xhr ) {
			xhr.setRequestHeader('Authorization', 'Basic ' + btoa(username + ':' + password))
		}
		, success: function( response, textStatus, jqXHR ) {
			$( '#library-browser' ).html('<h1><div class="title">Albums</div></h1>');
			$( '#library-browser' ).append('<div class="album-list">');

			$( response ).find( 'album' ).each( function(){
				var $album = $(this);
				var $html = '<div class="album" id="' + $album.attr('id') + '">';
				$html += '<dt>' + $album.attr('name') + '</dt>';
				$html += '<dd>' + $album.attr('artist') + '</dd>';
				$html += '</div>';
				$( '#library-browser' ).append( $html );
			})
			$( '#library-browser' ).append( '</div>' );

			// Add onclick handlers to the newly created divs
			$( '.album' ).click(function() {
				showAlbum( $(this).attr('id') );
			});
		}
	});

	// Renders the list of songs in an album.
	function showAlbum( id ) {
		$.ajax({
		'url': '/rest/getAlbum.view?id=' + id
		, dataType: 'xml'
		, 'beforeSend': function( xhr ) {
			xhr.setRequestHeader('Authorization', 'Basic ' + btoa(username + ':' + password))
		}
		, success: function( response, textStatus, jqXHR ) {
			var $album = $( response ).find( 'album' ).attr('name');
			$( '#library-browser' ).html('<h1><div class="title">' + $album + '</div></h1>');
			$( '#library-browser' ).append('<div class="album-list">');

			$( response ).find( 'song' ).each( function(){
				var $song = $(this);
				var $html = '<div class="song" id="' + $song.attr('id') + '">';
				$html += '<dt>' + $song.attr('title') + '</dt>';
				$html += '</div>';
				$( '#library-browser' ).append( $html );
			})
			$( '#library-browser' ).append( '</div>' );

			// Add onclick handlers to the newly created divs
			$( '.song' ).click(function() {
				playSong( $(this).attr('id') );
			});
		}
		});
	}

	// Plays a song (no queueing).
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
		$.ajax({
		'url': '/rest/getCoverArt.view?id=' + id + '&size=100'
		, dataType: 'text'
		, 'beforeSend': function( xhr ) {
			xhr.setRequestHeader('Authorization', 'Basic ' + btoa(username + ':' + password))
		}
		, success: function( response, textStatus, jqXHR ) {
			$( '#np-cover-art' ).html( '<img src=&quot;data:image/jpeg;base64, ' + response + '&quot; >' ).text();
		}
		});

		// Stream the music
		$.ajax({
		'url': '/rest/stream.view?id=' + id
		, dataType: 'text'
		, 'beforeSend': function( xhr ) {
			xhr.setRequestHeader('Authorization', 'Basic ' + btoa(username + ':' + password))
		}
		, success: function( response, textStatus, jqXHR ) {
			$( '#np-player' ).html('<audio src="http://upload.wikimedia.org/wikipedia/en/4/45/ACDC_-_Back_In_Black-sample.ogg" autoplay controls="controls">Your browser does not support the <code>audio</code> element.</audio>');
		}
		});
	}
});