// Playback controls
function ctlPlay() {
	paused = false;
	buffAudio.play();
	$( '#play-pause' ).html("<div id='pause'><a><image src='/static/img/player/pause.png'></a></div>");
	$( '#pause' ).click(function(){ ctlPause() });
}
function ctlPause() {
	paused = true;
	buffAudio.pause();
	$( '#play-pause' ).html("<div id='play'><a><image src='/static/img/player/play.png'></a></div>");
	$( '#play' ).click(function(){ ctlPlay() });
}

// Sequentially plays all songs in the array passed in, allowing skip forward/backward.
// Optionally accepts the index of the song playback should start on.
function playSongs( ids, index ) {
	if (typeof index === 'undefined') index = 0;
	var skip = false;
	_play(ids);

	// Bind player controls specific to playlists
	$( '#skip-fwd' ).click(function(){ _skip(index+1) });
	$( '#skip-bwd' ).click(function(){ _skip(index-1) });

	// Skips to an index, or ends the playlist if the index is invalid.
	function _skip( to ) {
		if (to < 0) {
			_skip(0);
		} else if (to >= ids.length) {
			_playlistOver();
		} else {
			index = to;
			skip = true;
			buffAudio.stop();
		}
	}

	// Cleans up after the playlist ends.
	function _playlistOver() {
		skip = false;
		buffAudio.stop();
		clearNowPlaying();
	}

	// Loop for playing automatically
	function _play( ids ) {
		if (index < ids.length) {
			playSong( ids[index] );
			_waitForNext(false, ids);
		} else _playlistOver();

		// Two phases: wait for playback to start, then wait for it to end (but not due to pausing)
		// TODO: there is almost certainly a better way to do this 
		function _waitForNext( hasStarted ) {
			if (skip) {
				skip = false;
				_play(ids);
			} else if (!hasStarted) {
				buffAudio._isPlaying ? _waitForNext(true) : setTimeout(function(){_waitForNext(false)}, 500);
			} else if (buffAudio._isPlaying || paused){
				setTimeout(function(){_waitForNext(true)}, 500);
			} else {
				_skip(index+1);
				_waitForNext(false);
			}
		}
	}
}

// Clears and hides the "now playing" panel.
function clearNowPlaying() {
	hideNowPlaying();
	$( '#np-title' ).empty();
	$( '#np-artist' ).empty();
	$( '#np-album' ).empty();
	$( '#np-cover-art' ).empty();
}
function hideNowPlaying() {
	$( '#sidebar' ).css('height', '100%');
	$( 'body' ).css('margin-bottom', '25px');
	$( 'footer' ).css('height', '0');
}
function showNowPlaying() {
	$( '#sidebar' ).css('height', 'calc( 100% - 100px )');
	$( 'body' ).css('margin-bottom', '125px');
	$( 'footer' ).css('height', '100px');
}

// Plays a single song, updating the "now playing" panel appropriately. 
function playSong( id ) {
	showNowPlaying();
	musicThrobber.start();

	// Update the "now playing" panel
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

		// TODO: obfuscate password
		$( '#np-cover-art' ).css( 'display', 'none' );
		$( '#np-cover-art' ).html( '<img src="/rest/getCoverArt.view?id=' + id + '&u=' + username + '&p=' + password + '&size=100"/>' );
		$( '#np-cover-art img' ).on('load', function() {
			$( '#np-cover-art' ).css( 'display', 'block' );
		});

		_stream('/rest/stream.view?id=' + id + '&format=mp3');
	}
	});

	// Begins streaming audio from a given URL.
	function _stream( url ) {
	
		var buffer = null;
	
		loadAudio(url);
		// Loads audio from the url and decodes it into the ArrayBuffer buffer.
		function loadAudio( url ) {
			// JQuery does not currently support arraybuffer as a responseType, so use XMLHttpRequest directly
			var request = new XMLHttpRequest();
			request.open('GET', url, true);
			request.responseType = 'arraybuffer';
			request.setRequestHeader('Authorization', 'Basic ' + btoa(username + ':' + password));
			// Decode asynchronously
			request.onload = function() {
				buffAudio.stop();
				audioContext.decodeAudioData(request.response, function(buf) {
			  		buffer = buf;
				}, function() {console.log('audio decoding error')} );
			}
			request.send();
		}
	
		// Wait for loadAudio to create an AudioBuffer
		// TODO: there is almost certainly a more performant way to do this 
		_playWhenReady();
		function _playWhenReady() {
			if (buffer === null) {
				console.log('null buffer, waiting');
				setTimeout(_playWhenReady, 500);
			} else {
				buffAudio.initNewBuffer(buffer);
				buffAudio.play();
				musicThrobber.stop();
			}
		}
	}
}
