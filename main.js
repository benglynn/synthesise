/*jslint white:true, nomen:true, vars:true */
/*globals window, document, jQuery, _, Backbone */

(function ($, Backbone, _) {

    "use strict";

    /**
      * A wave with an amplitude, frequency and phase
      */
    var WaveModel = Backbone.Model.extend({
	defaults: {
	    frequency: 0,
	    amplitude: 0,
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
    var wave = new WaveModel();


    /**
     * View representing the SVG graph
     */
    var GraphView = Backbone.View.extend({

	initialize: function () {

	    // Listen for changes to the model
	    this.model.bind('change', this.render, this);

	    // todo: override if in options? How can we change this? Read from the SVG?
	    this.graphPeriod = 1/40;

	    // width and height values from the viewBox attribute
	    var viewBox = this.el.getAttributeNS(null, 'viewBox')
		.match(/^(\d+)\s*(\d+)\s*(\d+)\s*(\d+)$/);
	    this.width = parseInt(viewBox[3], 10);
	    this.height = parseInt(viewBox[4], 10);
	    this.path = this.$('path#line2');
	    this.strokeWidth = parseInt(this.path.css('stroke-width'), 10);

	},

	/**
	 * Render the graph
	 */
	render: function () {

	    // Begin at 0 time and the graph's origin, 0 userUnits (SVG units 
	    // are independent of width as we're using viewBox)
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

    var graph = new GraphView({
	model: wave,
	el: $('#graph2')[0]
    });


    /**
     * Form controls
     */
    var FormView = Backbone.View.extend({
	
	events : {
	    'change #amplitude': 'onAmplitudeChange',
	    'change #frequency': 'onFrequencyChange'
	},

	onAmplitudeChange: function (evt) {
	    wave.set('amplitude', evt.target.value);
	},

	onFrequencyChange: function (evt) {
	    wave.set('frequency', evt.target.value);
	}

    });

    var form = new FormView({
	el: $('form#graph-controls')[0]
    });

    form.delegateEvents();
    $('form#graph-controls input').trigger('change');


    if (window.webkitAudioContext) {

	var SAMPLE_RATE = 44100; // todo: why is this always 44.1KHz?
	/**
	 * Callback for audio process
	 * @param evt An AudioProcessingEvent
	 */
	var audioProcessCallback = function (evt)
	{
	    var buffer = evt.outputBuffer, j, i, y, channelBuffer;
	    for (j = 0; j < buffer.numberOfChannels; j += 1) {
		channelBuffer = evt.outputBuffer.getChannelData(j);
		for (i = 0; i < channelBuffer.length; i += 1) {
		    y = wave.getSine((audioProcessCallback.n + i)/SAMPLE_RATE);
		    channelBuffer[i] = y;
		}
	    }
	    // Remember the phase for next time to avoid glitches
	    audioProcessCallback.n += i;

	      audioProcessCallback.count += 1;
	    /*
	    if (audioProcessCallback.count > 50) {
		audioProcessCallback.node.disconnect();
	    }*/
	};

	var audioContext = new window.webkitAudioContext();
	var node = audioContext.createJavaScriptNode(1024, 0, 1);
	node.onaudioprocess = audioProcessCallback;
	node.connect(audioContext.destination);

	// todo: OOD
	audioProcessCallback.n = 0;
	audioProcessCallback.count = 0;
	audioProcessCallback.node = node;
    }

}(jQuery, Backbone, _));


