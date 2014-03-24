/*
   -	xyplot.js --
   -		This script adds interactive behavior to a plot made by xyplot.
   -
   .	Copyright (c) 2013, Gordon D. Carrie. All rights reserved.
   .	
   .	Redistribution and use in source and binary forms, with or without
   .	modification, are permitted provided that the following conditions
   .	are met:
   .	
   .	* Redistributions of source code must retain the above copyright
   .	notice, this list of conditions and the following disclaimer.
   .	* Redistributions in binary form must reproduce the above copyright
   .	notice, this list of conditions and the following disclaimer in the
   .	documentation and/or other materials provided with the distribution.
   .	
   .	THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
   .	"AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
   .	LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
   .	A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
   .	HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
   .	SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED
   .	TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
   .	PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
   .	LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
   .	NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
   .	SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
   .	
   .	Please send feedback to dev0@trekix.net
   .	
   .	$Revision: 1.27 $ $Date: 2014/03/24 21:10:08 $
 */

/*
   Load callback. Plot variables and functions become members of the event
   handler call object, which will persist in closures assigned to event
   handlers.
 */

window.addEventListener("load", function (evt) {

	"use strict";
	/*jslint browser:true */

	/* These objects store information about the plot elements */
	var plot = document.getElementById("plot");
	var x_axis = document.getElementById("xAxis");
	var y_axis = document.getElementById("yAxis");
	var cursor_loc = document.getElementById("cursor_loc");

	/* Number of significant digits in axis labels */
	var x_prx = 3;
	var y_prx = 3;

	var svgNs="http://www.w3.org/2000/svg";

	/*
	   start_plot_drag, plot_drag, and end_plot_drag event handlers, defined
	   below, enable user to drag Cartesian plot and axes with the mouse.
	   These variables store information in this scope about the current
	   drag.
	 */

	var plot_x0, plot_y0;		/* SVG coordinates of plot element */
	var x_axis_x0;			/* SVG x coordinate of x axis element */
	var y_axis_y0;			/* SVG y coordinate of y axis element */
	var drag_x0, drag_y0;		/* SVG coordinates of mouse at start
					   of drag */
	var prev_evt_x, prev_evt_y;	/* SVG coordinates of mouse at previous
					   mouse event during drag */

	/*
	   Convert Cartesian y coordinate in plot to SVG y coordinate in
	   document
	 */

	function cart_x_to_svg(cart_x)
	{
	    var svg_left = plot.x.baseVal.value;
	    var svg_width = plot.width.baseVal.value;
	    var cart_left = plot.viewBox.baseVal.x;
	    var cart_width = plot.viewBox.baseVal.width;
	    return svg_left + (cart_x - cart_left) / cart_width * svg_width;
	}

	/*
	   Convert SVG x coordinate in document to Cartesian in plot
	 */

	function svg_x_to_cart(svg_x)
	{
	    var svg_left = plot.x.baseVal.value;
	    var svg_width = plot.width.baseVal.value;
	    var cart_left = plot.viewBox.baseVal.x;
	    var cart_width = plot.viewBox.baseVal.width;
	    return cart_left + (svg_x - svg_left) * cart_width / svg_width;
	}

	/*
	   Convert Cartesian y coordinate in plot to SVG y coordinate in
	   document
	 */

	function cart_y_to_svg(cart_y)
	{
	    var svg_y_top = plot.y.baseVal.value;
	    var svg_ht = plot.height.baseVal.value;
	    var cart_btm = plot.viewBox.baseVal.y;
	    var cart_ht = plot.viewBox.baseVal.height;
	    return svg_y_top + (1 - (cart_y - cart_btm) / cart_ht) * svg_ht;
	}

	/*
	   Convert SVG y coordinate in document to Cartesian in plot
	 */

	function svg_y_to_cart(svg_y)
	{
	    var svg_y_top = plot.y.baseVal.value;
	    var svg_ht = plot.height.baseVal.value;
	    var cart_btm = plot.viewBox.baseVal.y;
	    var cart_ht = plot.viewBox.baseVal.height;
	    return cart_btm + (1 - (svg_y - svg_y_top) / svg_ht) * cart_ht;
	}

	/* Print x with precision prx. Remove trailing "." and 0's */
	function to_prx(x, prx)
	{
	    var s = x.toPrecision(prx);
	    s = s.replace(/0+$/, "");
	    return s.replace(/\.?$/, "");
	}

	/*
	   This function creates a set of axis labels for an axis ranging from
	   x_min to x_max with increment dx and print precision prx. Returns an
	   object in which indeces are strings, values are coordinate values.
	 */

	function mk_lbl(x_min, x_max, dx, prx)
	{
	    var x0;			/* Coordinate of first label = nearest
					   multiple of dx less than x_min */
	    var x;			/* x coordinate */
	    var lbl;			/* String representation of a
					   coordinate */
	    var labels;			/* Return object. Indeces are strings.
					   Values are coordinate values. */
	    var n;			/* Loop index */

	    labels = {};
	    x0 = Math.floor(x_min / dx) * dx;
	    for (n = 0; n <= Math.ceil((x_max - x_min) / dx); n++) {
		x = x0 + n * dx;
		if ( x >= x_min - dx / 4 && x <= x_max + dx / 4 ) {
		    lbl = to_prx(x, prx);
		    labels[lbl] = x;
		}
	    }
	    return labels;
	}

	/* Compute length of a set of labels for a horizontal axis */ 
	function labels_x_sz(labels)
	{
	    var lbl_elem;		/* Element with the text of all labels.
					   Never displayed. Function return
					   value will be computed text length
					   of this element. */
	    var len;			/* Return value */
	    var lbl;			/* Member of labels */
	    var all;			/* String with text content of all
					   labels */

	    all = "";
	    for (lbl in labels) {
		if ( labels.hasOwnProperty(lbl) ) {
		    all = all + "____" + lbl;
		}
	    }
	    lbl_elem = document.createElementNS(svgNs, "text");
	    lbl_elem.appendChild(document.createTextNode(all));
	    x_axis.appendChild(lbl_elem);
	    len = lbl_elem.getComputedTextLength();
	    x_axis.removeChild(lbl_elem);
	    return len;
	}

	/* Compute length of a set of labels for a vertical axis */ 
	function labels_y_sz(labels)
	{
	    var lbl_elem;		/* Element with the text of all labels.
					   Never displayed. Function return
					   value will be computed text length
					   of this element. */
	    var lbl;			/* Member of labels */
	    var bbox;			/* Bounding box for an element */
	    var font_ht;		/* Character height */
	    var n;			/* Loop index */
	    var ht;			/* Return value */

	    /* Compute the height of a number */
	    lbl_elem = document.createElementNS(svgNs, "text");
	    lbl_elem.appendChild(document.createTextNode("0123456789"));
	    y_axis.appendChild(lbl_elem);
	    bbox = lbl_elem.getBBox();
	    font_ht = bbox.height;
	    y_axis.removeChild(lbl_elem);

	    /* Determine height needed for axis labels */
	    ht = 0.0;
	    for (lbl in labels) {
		if ( labels.hasOwnProperty(lbl) ) {
		    ht += 4 * font_ht;
		}
	    }
	    return ht;
	}

	/*
	   axis_lbl --
	   This function determines label locations for a an axis.
	   x_min	coordinate at start of axis.
	   x_max	coordinate at end of axis.
	   prx		precision for printing a coordinate
	   len		axis length, SVG display units
	   labels_sz	function to compute the space needed for the text of a
	   .		set of labels, given a labels object (return value of
	   .		mk_lbl) and font size.
	   .
	   Return value is an object to be used as an associated array. Each
	   string index is a label to print on the axis. Each value is the
	   coordinate on the axis at which to print the label.
	 */

	function axis_lbl(x_min, x_max, prx, len, labels_sz)
	{
	    var dx;			/* Proposed label spacing */
	    var lbl_str;		/* Coordinate(s) as a string */
	    var l0, l1;			/* Candidates for return value */

	    l0 = {};
	    if ( x_min > x_max ) {
		var t = x_max;
		x_max = x_min;
		x_min = t;
	    } 

	    /* Handle axis with zero, one, or two labels */
	    lbl_str = to_prx(x_min, prx);
	    l0[lbl_str] = x_min;
	    if ( x_min === x_max ) {
		return l0;
	    }
	    lbl_str = to_prx(x_max, prx);
	    l0[lbl_str] = x_max;
	    lbl_str = to_prx(x_min, prx) + " " + to_prx(x_max, prx);
	    if ( labels_sz(l0) > len ) {
		return l0;
	    }

	    /*
	       Initialize dx with smallest power of 10 larger in magnitude than
	       x_max - x_min. Decrease magnitude of dx. Place label set for the
	       smaller dx into l1. If printing the labels in l1 would overflow
	       the axis with characters, return l0. Otherwise, replace l0 with
	       l1 and retry with a smaller dx.
	     */

	    dx = Math.pow(10.0, Math.ceil(Math.log(x_max - x_min) / Math.LN10));
	    while (true) {
		l1 = mk_lbl(x_min, x_max, dx, prx);
		if ( labels_sz(l1) > len ) {
		    return l0;
		} else {
		    l0 = l1;
		}
		dx *= 0.5;			/* If dx was 5, now it is 2 */
		l1 = mk_lbl(x_min, x_max, dx, prx);
		if ( labels_sz(l1) > len ) {
		    return l0;
		} else {
		    l0 = l1;
		}
		dx *= 0.4;			/* If dx was 2, now it is 1 */
		l1 = mk_lbl(x_min, x_max, dx, prx);
		if ( labels_sz(l1) > len ) {
		    return l0;
		} else {
		    l0 = l1;
		}
		dx *= 0.5;			/* If dx was 2, now it is 1 */
	    }
	    return l0;
	}

	/* Label the axes around the plot. */
	function update_axes ()
	{
	    var viewBox;		/* axis viewBox */
	    var elems;			/* Axis elements */
	    var x, y;			/* Coordinate or axis location */
	    var labels;			/* Result from axis_lbl */
	    var lbl;			/* Property of labels */
	    var lbl_elem;		/* Coordinate text element */
	    var tick_len = 6.0;		/* Length of an axis tick */
	    var svg_left;		/* SVG coordinate of top edge of plot */
	    var svg_width;		/* Plot width, SVG coordinates */
	    var svg_top;		/* SVG coordinate of top edge of plot */
	    var svg_btm;		/* SVG coordinate of bottom edge of
					   plot */
	    var svg_height;		/* Plot height, SVG coordinates */
	    var cart_left;		/* Cartesian x coordinate of left edge
					   of plot */
	    var cart_right;		/* Cartesian x coordinate of right side
					   of plot */
	    var cart_width;		/* cart_right - cart_left */
	    var cart_top;		/* Cartesian y coordinate at top edge
					   of plot */
	    var cart_btm;		/* Cartesian y coordinate at bottom
					   edge of plot */
	    var cart_ht;		/* cart_top - cart_btm */

	    svg_left = plot.x.baseVal.value;
	    svg_width = plot.width.baseVal.value;
	    svg_top = plot.y.baseVal.value;
	    svg_height = plot.height.baseVal.value;
	    svg_btm = svg_top + svg_height;
	    cart_left = plot.viewBox.baseVal.x;
	    cart_width = plot.viewBox.baseVal.width;
	    cart_right = cart_left + cart_width;
	    cart_btm = plot.viewBox.baseVal.y;
	    cart_ht = plot.viewBox.baseVal.height;
	    cart_top = cart_btm + cart_ht;

	    /* Fetch drawing attributes from first label of x axis */
	    elems = x_axis.getElementsByTagName("text");
	    lbl_elem = elems.item(0);
	    y = lbl_elem.getAttribute("y");

	    /*
	       Move x axis back to position at start of drag and update viewBox
	     */

	    x_axis.setAttribute("x", x_axis_x0);
	    viewBox = x_axis_x0;
	    viewBox += " " + x_axis.viewBox.baseVal.y;
	    viewBox += " " + x_axis.viewBox.baseVal.width;
	    viewBox += " " + x_axis.viewBox.baseVal.height;
	    x_axis.setAttribute("viewBox", viewBox);

	    /* Create new labels for x axis */
	    while ( x_axis.lastChild ) {
		x_axis.removeChild(x_axis.lastChild);
	    }
	    labels = axis_lbl(cart_left, cart_right, x_prx, svg_width,
		    labels_x_sz);
	    for (lbl in labels) {
		if ( labels.hasOwnProperty(lbl) ) {
		    /* Create label text */
		    lbl_elem = document.createElementNS(svgNs, "text");
		    lbl_elem.setAttribute("class", "x axis label");
		    x = cart_x_to_svg(labels[lbl]);
		    lbl_elem.setAttribute("x", x);
		    lbl_elem.setAttribute("y", y);
		    lbl_elem.setAttribute("text-anchor", "middle");
		    lbl_elem.setAttribute("dominant-baseline", "hanging");
		    lbl_elem.appendChild(document.createTextNode(lbl));
		    x_axis.appendChild(lbl_elem);

		    /* Create label tick mark */
		    lbl_elem = document.createElementNS(svgNs, "line");
		    lbl_elem.setAttribute("x1", x);
		    lbl_elem.setAttribute("x2", x);
		    lbl_elem.setAttribute("y1", svg_btm);
		    lbl_elem.setAttribute("y2", svg_btm + tick_len);
		    lbl_elem.setAttribute("stroke", "black");
		    lbl_elem.setAttribute("stroke-width", "1");
		    x_axis.appendChild(lbl_elem);
		}
	    }

	    /* Fetch drawing attributes from first y axis label */
	    elems = y_axis.getElementsByTagName("text");
	    lbl_elem = elems.item(0);
	    x = lbl_elem.getAttribute("x");

	    /*
	       Move y axis back to position at start of drag and update viewBox
	     */

	    y_axis.setAttribute("y", y_axis_y0);
	    viewBox = y_axis.viewBox.baseVal.x;
	    viewBox += " " + y_axis_y0;
	    viewBox += " " + y_axis.viewBox.baseVal.width;
	    viewBox += " " + y_axis.viewBox.baseVal.height;
	    y_axis.setAttribute("viewBox", viewBox);

	    /* Create new labels for y axis */
	    while ( y_axis.lastChild ) {
		y_axis.removeChild(y_axis.lastChild);
	    }
	    labels = axis_lbl(cart_btm, cart_top, y_prx, svg_height,
		    labels_y_sz);
	    for (lbl in labels) {
		if ( labels.hasOwnProperty(lbl) ) {
		    /* Create label text */
		    lbl_elem = document.createElementNS(svgNs, "text");
		    lbl_elem.setAttribute("class", "y axis label");
		    y = cart_y_to_svg(labels[lbl]);
		    lbl_elem.setAttribute("x", x);
		    lbl_elem.setAttribute("y", y);
		    lbl_elem.setAttribute("text-anchor", "end");
		    lbl_elem.setAttribute("dominant-baseline", "mathematical");
		    lbl_elem.appendChild(document.createTextNode(lbl));
		    y_axis.appendChild(lbl_elem);

		    /* Create label tick mark */
		    lbl_elem = document.createElementNS(svgNs, "line");
		    lbl_elem.setAttribute("x1", svg_left - tick_len);
		    lbl_elem.setAttribute("x2", svg_left);
		    lbl_elem.setAttribute("y1", y);
		    lbl_elem.setAttribute("y2", y);
		    lbl_elem.setAttribute("stroke", "black");
		    lbl_elem.setAttribute("stroke-width", "1");
		    y_axis.appendChild(lbl_elem);
		}
	    }
	}

	plot_x0 = Number(plot.getAttribute("x"));
	plot_y0 = Number(plot.getAttribute("y"));
	x_axis_x0 = Number(x_axis.getAttribute("x"));
	y_axis_y0 = Number(y_axis.getAttribute("y"));

	/*
	   plot_drag is called at each mouse move while the plot is being
	   dragged. It determines how much the mouse has moved since the last
	   event, and shifts the dragable elements by that amount.
	 */

	function plot_drag(evt)
	{
	    var x, y;			/* SVG coordinates of plot and axis
					   SVG elements */
	    var dx, dy;			/* How much to move the elements */

	    dx = evt.clientX - prev_evt_x;
	    dy = prev_evt_y - evt.clientY;
	    x = Number(plot.getAttribute("x"));
	    y = Number(plot.getAttribute("y"));
	    plot.setAttribute("x", x + dx);
	    plot.setAttribute("y", y + dy);
	    x = Number(x_axis.getAttribute("x"));
	    x_axis.setAttribute("x", x + dx);
	    y = Number(y_axis.getAttribute("y"));
	    y_axis.setAttribute("y", y - dy);
	    prev_evt_x = evt.clientX;
	    prev_evt_y = evt.clientY;
	}

	/*
	   end_plot_drag is called at mouse up. It determines how much the
	   viewBox has changed since the start of the drag. It restores dragged
	   elements to their initial coordinates, plot_x0, plot_y0, but with a
	   new shifted viewBox.
	 */

	function end_plot_drag(evt)
	{
	    /*
	       Compute total distance dragged, in CARTESIAN coordinates, and
	       move plot viewBox by this amount
	     */

	    var svg_width = plot.width.baseVal.value;
	    var svg_height = plot.height.baseVal.value;
	    var vb_width = plot.viewBox.baseVal.width;
	    var vb_height = plot.viewBox.baseVal.height;
	    var dx = (evt.clientX - drag_x0) * vb_width / svg_width;
	    var dy = (drag_y0 - evt.clientY) * vb_height / svg_height;
	    var vb_x0 = plot.viewBox.baseVal.x - dx;
	    var vb_y0 = plot.viewBox.baseVal.y - dy;
	    var viewBox;
	    viewBox = vb_x0;
	    viewBox += " " + vb_y0;
	    viewBox += " " + vb_width;
	    viewBox += " " + vb_height;
	    plot.setAttribute("viewBox", viewBox);

	    /*
	       Restore plot and background to their position at start of drag.
	       Elements in the plot will remain in the positions they were
	       dragged to because of the adjments to the viewBox.
	     */

	    plot.setAttribute("x", plot_x0);
	    plot.setAttribute("y", plot_y0);
	    var background = document.getElementById("plotBackground");
	    background.setAttribute("x", vb_x0);
	    background.setAttribute("y", vb_y0);

	    update_axes();

	    plot.removeEventListener("mousemove", plot_drag, false);
	    plot.removeEventListener("mouseup", end_plot_drag, false);
	}

	/*
	   start_plot_drag is called at mouse down. It records the location of
	   the plot in its parent as members x0 and y0. It records the initial
	   cursor location in drag_x0 and drag_y0, which remain constant
	   throughout the drag. It also records the cursor location in members
	   prev_evt_x and prev_evt_y, which change at every mousemove during the
	   drag.
	 */

	function start_plot_drag(evt)
	{
	    prev_evt_x = drag_x0 = evt.clientX;
	    prev_evt_y = drag_y0 = evt.clientY;
	    plot.addEventListener("mousemove", plot_drag, false);
	    plot.addEventListener("mouseup", end_plot_drag, false);
	}

	/*
	   This callback displays the Cartesian coordinates of the cursor
	   location in a text element identified as "cursor_loc".
	 */

	function update_cursor_loc(evt)
	{
	    var x = svg_x_to_cart(evt.clientX);
	    var y = svg_y_to_cart(evt.clientY);
	    cursor_loc.textContent = to_prx(x, x_prx) + " " + to_prx(y, x_prx);
	}

	plot.addEventListener("mousedown", start_plot_drag, false);
	plot.addEventListener("mousemove", update_cursor_loc, false);

}, false);			/* Done defining load callback */

