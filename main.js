/*jslint white:true, nomen:true, vars:true */
/*globals window, document, jQuery, _, Backbone */

(function ($, Backbone, _) {

    "use strict";

    // todo, OOD for these globals
    var graphPeriod = 1/20;

    /**
      * Returns -1 >= y <= 1 at a given time. Phase is maintained when frequency
      * is altered.
      */
    var OscillatorModel = Backbone.Model.extend({

	defaults: {
	    frequency: 1, // Hz
	},

	initialize: function () {

	    // Offset the phase of the waveform after frequency has changed to
	    // ensure consistant phase and so avoid audible glitches
	    this._phaseOffset = 0;
	},

	validate: function (attributes) {

	    // Remember the previous frequency
	    this._prevFreq = this.get('frequency');
	},

	/**
	  * The angular frequency, radians per second
	  */
	getW: function () {
	    return 2*Math.PI*this.get('frequency');
	},

	/**
	 * Value of y at a given time (seconds)
	 */
	getSine: function (time) {

	    var curWavelength = 1/this.get('frequency');

	    // If the frequency has changed, slide the new waveform to match the
	    // phase of the old
	    if(this._prevFreq !== undefined) {
		var prevWavelength = 1/this._prevFreq;
		var prevPhase = (time/prevWavelength) % 1;
		var curPhase = (time/curWavelength) ;
		this._phaseOffset = prevPhase - curPhase;
		// Forget the previous frequency, we don't want to adjust again
		delete this._prevFreq;
	    }
	    var offset = curWavelength*this._phaseOffset;
	    var w = this.getW()
	    time += offset;
	    var y = Math.sin(w*time);
	    return y;
	}
    });
    var oscillator = new OscillatorModel();


    /**
     * View representing the SVG graph
     */
    var GraphView = Backbone.View.extend({

	initialize: function () {

	    // Listen for changes to the model
	    //this.model.bind('change', this.render, this);

	    // width and height values from the viewBox attribute
	    var viewBox = this.el.getAttributeNS(null, 'viewBox')
		.match(/^(\d+)\s*(\d+)\s*(\d+)\s*(\d+)$/);
	    this.vBWidth = parseInt(viewBox[3], 10);
	    this.vBHeight = parseInt(viewBox[4], 10);
	    this.$path = this.$('path#line2');
	    this.strokeWidth = parseInt(this.$path.css('stroke-width'), 10);
	},

	/**
	 * Render the graph
	 */
	render: function () {

	    if (this.model.get('frequency') === undefined) {
		return;
	    }

	    // Begin at 0 time and the graph's origin, 0 userUnits
	    var time = 0, data, userUnit = 0, inc = 1;
	    for (userUnit = 0; userUnit <= this.vBWidth; userUnit += inc) {

		// // todo: for testing only, change the frequency half way through
		// if (userUnit === 300) {
		//     this.model.set('frequency', 570);
		// }

		// time in seconds
		time = userUnit/this.vBWidth*graphPeriod;
		var y = this.model.getSine(time);
		// translate to graph's height
		y = (this.vBHeight/2) + (y*(this.vBHeight-this.strokeWidth)/2);

		// Start or add to the line's data
		if (userUnit === 0) {
		    data = 'M';
		} else {
		    data += 'L';
		}
		data += userUnit + ',' + y;
		if (inc > 1) {
		    data += 'L' + (userUnit + inc) + ',' + y; //todo: templates?
		}
	    }
	    this.$path[0].setAttributeNS(null, 'd', data);
	    return this;
	}
    });

    var graph = new GraphView({
	model: oscillator,
	el: $('#graph2')[0]
    });

    /**
     * Form controls
     */
    var FormView = Backbone.View.extend({
	
	events : {
	    'change #frequency': 'onFrequencyChange'
	},

	onFrequencyChange: function (evt) {
	    oscillator.set('frequency', evt.target.value);
	}

    });

    var form = new FormView({
	el: $('form#graph-controls')[0]
    });

    form.delegateEvents();
    $('form#graph-controls input').trigger('change');

    // render here for now, as we've decoupled the graph for testing
    graph.render();

    if (window.webkitAudioContext) {


	var audioContext = new window.webkitAudioContext();
	var sampleRate = audioContext.sampleRate;
	var bufferSize = 1024;

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
		    var time = (i + audioProcessCallback.lastTime)/sampleRate;
		    y = oscillator.getSine((time));
		    channelBuffer[i] = y;
		}
	    }
	    audioProcessCallback.lastTime += i;

	      audioProcessCallback.count += 1;
	    /*
	    if (audioProcessCallback.count > 50) {
		audioProcessCallback.node.disconnect();
	    }*/
	};
	var node = audioContext.createJavaScriptNode(bufferSize, 0, 1);
	node.onaudioprocess = audioProcessCallback;
	node.connect(audioContext.destination);
	// todo: OOD
	audioProcessCallback.lastTime = 0;
	audioProcessCallback.count = 0;
	audioProcessCallback.node = node;
    }

}(jQuery, Backbone, _));


