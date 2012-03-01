/*globals window, document */
/*jslint white:true */

(function () {

    "use strict";

    var 

    // Amplitude
    a,

    // Frequency
    f,

    // phase (todo: implement input)
    p = 0,

    // the duration in seconds represented on the graph
    graphPeriod = 1/40,

    // SVG graph element
    graph = document.getElementById('graph'),
    // width and height values from the viewBox attribute
    viewBox = graph.getAttributeNS(null, 'viewBox').match(/^(\d+)\s*(\d+)\s*(\d+)\s*(\d+)$/),
    width = parseInt(viewBox[3], 10),
    height = parseInt(viewBox[4], 10),
    // Path on the graph
    path = document.getElementById('line'),
    // Path's data attribute
    d = path.getAttributeNS(null, 'd'),
    // Width of the path's stroke
    strokeWidth = parseInt(window.getComputedStyle(path).strokeWidth, 10),

    // One userUnit of the graph's width
    userUnit,
    // Function to return y coordinate
    sinusoid, square, sawtooth,
    // Function to render the graph
    render;


    /*
      A sine wave
      params: time
     */
    sinusoid = function(t) {
	// w: angular frequency, radians per second
	var w = 2*Math.PI*f,
	y = (Math.sin(w*t)*a);
	// translate to graph's height
	y = (height/2) + (y*(height-strokeWidth)/2);
	return y;
    };

    /*
      render the graph
      params: amplitude, frequency, phase
     */
    render = function () {
	// time
	var t = 0;
	
	// Begin the line's data, move to origin
	d = 'M0,' + (height/2);
	// For each userUnit
	for (userUnit = 0; userUnit <= width; userUnit += 1) {
	    t = userUnit/width*graphPeriod;
	    // move line to that point
	    d += 'L' + userUnit + ',' + sinusoid(t, f, a, p);
	}
	path.setAttributeNS(null, 'd', d);
    };

    // Get values from the form controls
    var updateAmplitude = function () {
	a = document.getElementById('amplitude').value;
    };
    
    var updateFrequency = function () {
	f = document.getElementById('frequency').value;
    };


    var update = function () {
	updateAmplitude();
	updateFrequency();
	render();
    };

    // Listen for form changes and set appropriate value
    document.getElementById('amplitude').addEventListener('change', update);
    document.getElementById('frequency').addEventListener('change', update);


    window.onload = update;

    // Play tone if Audio API available

    var SAMPLE_RATE = 44100;
    var PI_2 = Math.PI * 2;

    var audioProcessCallback = function (evt)
    {
	var buffer = evt.outputBuffer;

	for (var j = 0; j < buffer.numberOfChannels; ++j) {
	    var channelBuffer = evt.outputBuffer.getChannelData(j);

	    for (var i = 0; i < channelBuffer.length; ++i) {
		channelBuffer[i] = a * Math.sin(f * PI_2 * (audioProcessCallback.n + i) / SAMPLE_RATE);
	    }
	}
	// Remember the phase for next time to avoid glitches
	audioProcessCallback.n += i;

	/*if (audioProcessCallback.count++ > 10) {
	    audioProcessCallback.node.disconnect();
	}*/
    };

    if (!window.AudioContext && window.webkitAudioContext) {
	window.AudioContext = window.webkitAudioContext;
    }
    if (window.AudioContext) {

	var ctx = new AudioContext();

	var node = ctx.createJavaScriptNode(256, 0, 1);
	node.onaudioprocess = audioProcessCallback;
	node.connect(ctx.destination);

	// todo: ood
	audioProcessCallback.n = 0;
	audioProcessCallback.count = 0;
	audioProcessCallback.node = node;
    }


}());