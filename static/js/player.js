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