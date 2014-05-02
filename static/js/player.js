// Playback controls
function play() {
	buffAudio.play();
	$( '#play-pause' ).html("<div id='pause'><a><image src='/static/img/player/pause.png'></a></div>");
	$( '#pause' ).click(function(){
		pause();
	});
}
function pause() {
	buffAudio.pause();
	$( '#play-pause' ).html("<div id='play'><a><image src='/static/img/player/play.png'></a></div>");
	$( '#play' ).click(function(){
		play();
	});
}

// Sequentially plays all songs in the array passed in.
// TODO: this is trash
function playSongs( ids ) {

	playSong(ids.shift());
	waitForNext(false, ids);

	function waitForNext( hasStarted ) {
		if (!hasStarted) {
			buffAudio._isPlaying ? waitForNext(true) : setTimeout(function(){waitForNext(false)}, 500);
		} else {
			if (buffAudio._isPlaying) {
				setTimeout(function(){waitForNext(true)}, 500);
			} else {
				if (ids.length > 0) playSongs(ids);
			}
		}
	}
}

// Plays a single song, updating the "now playing" panel appropriately. 
function playSong( id ) {
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

		stream('/rest/stream.view?id=' + id + '&format=mp3');
	}
	});
}

// Begins streaming audio from a given URL.
function stream( url ) {
	$( 'body' ).css('margin-bottom', '125px');
	$( 'footer' ).css('height', '100px');
	$( '#sidebar' ).css('height', 'calc( 100% - 100px )');

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
			audioContext.decodeAudioData(request.response, function(buf) {
		  		buffer = buf;
			}, function() {console.log('audio decoding error')} );
		}
		request.send();
	}

	// Wait for loadAudio to create an AudioBuffer
	// TODO: there is almost certainly a more performant way to do this 
	playWhenReady();
	function playWhenReady() {
		if (buffer === null) {
			console.log('null buffer, waiting');
			setTimeout(playWhenReady, 500);
		} else {
			buffAudio.initNewBuffer(buffer);
			buffAudio.play();
			musicThrobber.stop();
		}
	}
}
