/*jslint white:true, nomen:true, vars:true */
/*globals window, document, jQuery, _, Backbone */

(function ($, Backbone, _) {

    "use strict";

    /**
      * A wave with an amplitude, frequency and phase
      */
    var WaveModel = Backbone.Model.extend({

	defaults: {
	    //frequency: 0, // Hz
	    //amplitude: 0, // 0 >= amplitude <= 1
	    phase: 0, // 0 >= phase <= 1
	    graphPeriod: 1/20 // length of x axis in seconds
	},

	initialize: function () {

	    // Offset, in seconds, set to bring different frequencies into phase
	    this._phaseOffset = 0;
	},

	validate: function (attributes) {

	    // todo: validation

	    // Rember previous frequency
	    this._prevFreq = this.get('frequency');

	},

	/**
	  * The angular frequency, radians per second
	  */
	getW: function () {
	    return 2*Math.PI*this.get('frequency');
	},

	/**
	 * The value for y at a given time (seconds)
	 */
	getSine: function (time) {

	    // If the frequency has changed
	    if(this._prevFreq !== undefined) {

		// calculate the previous phase
		var prevWavelength = 1/this._prevFreq;
		var prevPhase = (time/prevWavelength) % 1;

		// calculate the current phase
		var curWavelength = 1/this.get('frequency');
		var curPhase = (time/curWavelength) ;
		
		// Update the phase offset to avoid glitches
		this._phaseOffset = prevPhase - curPhase;

		// Forget the previous frequency
		delete this._prevFreq;
	    }

	    // todo: evaluate on frequency change, persist as a property
	    var wavelength = 1/this.get('frequency');

	    // currentPhase is the fraction of the wave cycle elapsed
	    var currentPhase = (time/wavelength) % 1;
	    //console.log(currentPhase);

	    var offset = wavelength*this._phaseOffset;
	    var w = this.getW()
	    var a = this.get('amplitude');
	    var y = Math.sin(w*(time+offset))*a;
	    return y;
	}
    });
    var wave = new WaveModel();


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

	    if (this.model.get('amplitude') === undefined || this.model.get('frequency') === undefined) {
		return;
	    }

	    // Begin at 0 time and the graph's origin, 0 userUnits
	    var time = 0, data, userUnit = 0, inc = 1;
	    // For each increment
	    for (userUnit = 0; userUnit <= this.vBWidth; userUnit += inc) {

		// todo: for testing only, change the frequency half way through
		if (userUnit === 300) {
		    this.model.set('frequency', 90);
		}


		// time in seconds
		time = userUnit/this.vBWidth*this.model.get('graphPeriod');
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
		    data += 'L' + (userUnit + inc) + ',' + y;
		}
	    }
	    this.$path[0].setAttributeNS(null, 'd', data);

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

    // render here for now, as we've decoupled the graph for testing
    graph.render();

    if (false && window.webkitAudioContext) {

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


