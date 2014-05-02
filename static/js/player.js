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
		$( '#np-cover-art' ).html( '<img src="/rest/getCoverArt.view?id=' + id + '&u=' + username + '&p=' + password + '&size=100"/>' );

		var fmt = 'mp3';	// streaming format to request
		stream('/rest/stream.view?id=' + id + '&format=' + fmt);
	}
	});
}

// Begins streaming audio from a given URL.
function stream( url ) {
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
			setTimeout(playWhenReady, 500)
		} else {
			buffAudio.initNewBuffer(buffer);
			buffAudio.play();
			musicThrobber.stop();
		}
	}
}