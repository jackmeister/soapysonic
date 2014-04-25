/* Javascript/JQuery functions for playing music. */

// Plays a single song, updating the "now playing" panel appropriately. 
function playSong( id ) {
	var fmt = 'mp3';	// streaming format to request
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
	// TODO: obfuscate password
	$( '#np-cover-art' ).html( '<img src="/rest/getCoverArt.view?id=' + id + '&u=' + username + '&p=' + password + '&size=100"/>' );

	stream('/rest/stream.view?id=' + id + '&format=' + fmt);
}

// Begins streaming audio from a given URL.
function stream( url ) {

	var buffer = null;
	loadAudio(url);
	// Wait for loadAudio to create an AudioBuffer
	// TODO: there is almost certainly a more performant way to do this 
	playWhenReady();
	function playWhenReady() {
		if (buffer === null) {
			console.log('null buffer, waiting');
			setTimeout(playWhenReady, 500)
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