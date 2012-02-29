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
    // Width of the graph
    width = parseInt(graph.getAttributeNS(null, 'width'), 10),
    // Height of the graph
    height = parseInt(graph.getAttributeNS(null, 'height'), 10),
    // Path on the graph
    path = document.getElementById('line'),
    // Path's data attribute
    d = path.getAttributeNS(null, 'd'),
    // Width of the path's stroke
    strokeWidth = parseInt(getComputedStyle(path).strokeWidth, 10),

    // One pixel of the graph's width
    pixel,
    // Function to return y coordinate
    getY;




    // y as a function of x
    getY = function(t) {
	var y = (Math.sin(w*t)*a);
	// translate to graph's height
	y = (height/2) + (y*(height-strokeWidth)/2);
	return y;
    };

    // Move to the origin
    d = 'M0,' + (height/2);
    // For each pixel
    for (pixel = 0; pixel <= width; pixel += 1) {
	t = pixel/width;
	d += 'L' + pixel + ',' + getY(t);
    }
    path.setAttributeNS(null, 'd', d);

}());