/*jslint white:true, nomen:true, vars:true */
/*globals window, document, jQuery, _, Backbone */

(function ($, Backbone, _) {

    "use strict";

    /**
      * A wave with an amplitude, frequency and phase
      */
    var WaveModel = Backbone.Model.extend({
	defaults: {
	    phase: 0,
	},

	/**
	  * The angular frequency, radians per second
	  */
	getW: function () {
	    return 2*Math.PI*this.get('frequency');
	},

	/**
	 * The value for y at a given time 
	 */
	getSine: function (time) {
	    
	    // w: angular frequency, radians per second
	    return Math.sin(this.getW()*time)*this.get('amplitude');
	}
    });

    var GraphView = Backbone.View.extend({

	initialize: function () {

	    // Listen for changes to the model
	    this.model.bind('change', this.render, this);

	    // todo: override if in options? How can we change this?
	    this.graphPeriod = 1/40;

	    // width and height values from the viewBox attribute
	    var viewBox = this.el.getAttributeNS(null, 'viewBox')
		.match(/^(\d+)\s*(\d+)\s*(\d+)\s*(\d+)$/);
	    this.width = parseInt(viewBox[3], 10);
	    this.height = parseInt(viewBox[4], 10);
	    this.path = this.$('path#line2');
	    this.strokeWidth = parseInt(this.path.css('stroke-width'), 10);

	},

	render: function () {

	    // Begin at 0 time and the graph's origin, 0 userUnits (SVG units independent of width)
	    var time = 0, data = 'M0,' + (this.height/2), userUnit = 0;
	    // For each userUnit
	    for (userUnit = 0; userUnit <= this.width; userUnit += 1) {
		time = userUnit/this.width*this.graphPeriod;
		var y = this.model.getSine(time);
		// translate to graph's height
		y = (this.height/2) + (y*(this.height-this.strokeWidth)/2);
		// move line to that point
		data += 'L' + userUnit + ',' + y;
	    }
	    this.path[0].setAttributeNS(null, 'd', data);

	    return this;
	}

    });

    

    var wave = new WaveModel();

    var graph = new GraphView({
	model: wave,
	el: $('#graph2')[0]
    });

    wave.set({
	frequency: 220,
	amplitude: 0.5,
    });

}(jQuery, Backbone, _));





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

    // Path on the graph, its data attributs and stroke width
    path = document.getElementById('line'),
    d = path.getAttributeNS(null, 'd'),
    strokeWidth = parseInt(window.getComputedStyle(path).strokeWidth, 10),

    // One userUnit of the graph's width
    userUnit,

    // Functions to return y coordinate
    sinusoid, square, sawtooth,

    // update values from UI, render the graph
    updateAmplitude, updateFrequency, update, render,

    // Audio
    SAMPLE_RATE = 44100, audioProcessCallback, audioContext, node;

    /**
      * A sine wave
      * @params t (number) Time
      */
    sinusoid = function(t) {
	// w: angular frequency, radians per second
	var w = 2*Math.PI*f,
	y = (Math.sin(w*t)*a);
	// translate to graph's height
	y = (height/2) + (y*(height-strokeWidth)/2);
	return y;
    };

    /**
      * Render the graph
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

    /**
      * Get amplitude from the form control
      */
    updateAmplitude = function () {
	a = document.getElementById('amplitude').value;
    };
    
    /**
      * Get frequency from the form control
      */
    updateFrequency = function () {
	f = document.getElementById('frequency').value;
    };


    /**
      * Update a and f and render the graph
      */
    update = function () {
	updateAmplitude();
	updateFrequency();
	render();
    };


    // Event handlers
    document.getElementById('amplitude').addEventListener('change', update);
    document.getElementById('frequency').addEventListener('change', update);
    window.onload = update;

    if (window.webkitAudioContext) {

	/**
	 * Callback for audio process
	 * @param evt An AudioProcessingEvent
	 */
	audioProcessCallback = function (evt)
	{
	    var buffer = evt.outputBuffer, j, i, y, channelBuffer;
	    for (j = 0; j < buffer.numberOfChannels; j += 1) {
		channelBuffer = evt.outputBuffer.getChannelData(j);
		for (i = 0; i < channelBuffer.length; i += 1) {
		    // todo: use sinusoid function
		    y = a * Math.sin(f * Math.PI*2 * (audioProcessCallback.n + i) / SAMPLE_RATE);
		    channelBuffer[i] = y;
		}
	    }
	    // Remember the phase for next time to avoid glitches
	    audioProcessCallback.n += i;

	    audioProcessCallback.count += 1;
	    if (audioProcessCallback.count > 50) {
		audioProcessCallback.node.disconnect();
	    }
	};

	audioContext = new window.webkitAudioContext();
	node = audioContext.createJavaScriptNode(1024, 0, 1);
	node.onaudioprocess = audioProcessCallback;
	node.connect(audioContext.destination);

	// todo: OOD
	audioProcessCallback.n = 0;
	audioProcessCallback.count = 0;
	audioProcessCallback.node = node;
    }


}());