/*globals document */
/*jslint white:true */

(function () {

    "use strict";

    var 

    // t: time, the graph always represents 1 second
    t,
    // a: amplitude, between 0 and 1
    a = 1,
    // w: angular frequency, radians per second
    w = 2*Math.PI, // 1 revolution or 1Hz
    // p: phase, where in the cycle when t = 0
    p = 0,

    // SVG graph element
    graph = document.getElementById('graph'),
    // Width of the graph, always 100, stretched to fit
    width = parseInt(getComputedStyle(graph).width, 10),
    // Height of the graph
    height = parseInt(getComputedStyle(graph).height, 10),
    // Path on the graph
    path = document.getElementById('line'),
    // Path's data attribute
    d = path.getAttributeNS(null, 'd'),
    // Width of the path's stroke
    strokeWidth = parseInt(getComputedStyle(path).strokeWidth, 10),

    // One userUnit of the graph's width
    userUnit,
    // Function to return y coordinate
    getY,
    // Function to render the graph
    render;


    // y as a function of x
    getY = function(t) {
	var y = (Math.sin(w*t)*a);
	// translate to graph's height
	y = (height/2) + (y*(height-strokeWidth)/2);
	return y;
    };

    render = function () {
	// Move to the origin
	d = 'M0,' + (height/2);
	// For each userUnit
	for (userUnit = 0; userUnit <= width; userUnit += 1) {
	    t = userUnit/width;
	    d += 'L' + userUnit + ',' + getY(t);
	}
	path.setAttributeNS(null, 'd', d);
    };

    window.onload = window.onresize = render;

}());