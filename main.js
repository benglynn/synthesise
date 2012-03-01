/*globals window, document */
/*jslint white:true */

(function () {

    "use strict";

    var 

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
      params: time, frequency, amplitude, phase
     */
    sinusoid = function(t, f, a, p) {
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
	console.log('render');
	// time
	var t = 0,
	// amplitude
	a = document.getElementById('amplitude').value,
	// frequency
	f = document.getElementById('frequency').value,
	// phase (todo: implement input)
	p = 0;
	
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
    
    document.getElementById('amplitude').addEventListener('change', render);
    document.getElementById('frequency').addEventListener('change', render);
    window.onload = render();

}());