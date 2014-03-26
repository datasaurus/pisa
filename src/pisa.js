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
   .	$Revision: 1.29 $ $Date: 2014/03/25 14:59:27 $
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

	/*
	   Axis labels:
	   For each axis there will be an array of objects.
	   Each object will have as members:
	   lbl	- a text element with the text of the label
	   tic	- a line element with a tick mark
	 */

	var x_labels = [];
	var y_labels = [];

	var tick_len = 6.0;		/* Length of an axis tick */

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
	var x_axis_x0, x_axis_y0;	/* SVG coordinates of x axis element */
	var y_axis_x0, y_axis_y0;	/* SVG coordinates of y axis element */
	var y_axis_x1;			/* Right side of y axis element */
	var drag_x0, drag_y0;		/* SVG coordinates of mouse at start
					   of drag */
	var prev_evt_x, prev_evt_y;	/* SVG coordinates of mouse at previous
					   mouse event during drag */

	plot_x0 = Number(plot.getAttribute("x"));
	plot_y0 = Number(plot.getAttribute("y"));
	x_axis_x0 = Number(x_axis.getAttribute("x"));
	x_axis_y0 = Number(x_axis.getAttribute("y"));
	y_axis_x0 = Number(y_axis.getAttribute("x"));
	y_axis_x1 = y_axis_x0 + Number(y_axis.getAttribute("width"));
	y_axis_y0 = Number(y_axis.getAttribute("y"));

	/* Local function definitions */

	/* Convert Cartesian y to SVG y */
	function cart_x_to_svg(cart_x)
	{
	    var svg_left = plot.x.baseVal.value;
	    var svg_width = plot.width.baseVal.value;
	    var cart_left = plot.viewBox.baseVal.x;
	    var cart_width = plot.viewBox.baseVal.width;
	    return svg_left + (cart_x - cart_left) / cart_width * svg_width;
	}

	/* Convert SVG x Cartesian x */
	function svg_x_to_cart(svg_x)
	{
	    var svg_left = plot.x.baseVal.value;
	    var svg_width = plot.width.baseVal.value;
	    var cart_left = plot.viewBox.baseVal.x;
	    var cart_width = plot.viewBox.baseVal.width;
	    return cart_left + (svg_x - svg_left) * cart_width / svg_width;
	}

	/* Convert Cartesian y to SVG y */
	function cart_y_to_svg(cart_y)
	{
	    var svg_y_top = plot.y.baseVal.value;
	    var svg_ht = plot.height.baseVal.value;
	    var cart_btm = plot.viewBox.baseVal.y;
	    var cart_ht = plot.viewBox.baseVal.height;
	    return svg_y_top + (1 - (cart_y - cart_btm) / cart_ht) * svg_ht;
	}

	/* Convert SVG y Cartesian y */
	function svg_y_to_cart(svg_y)
	{
	    var svg_y_top = plot.y.baseVal.value;
	    var svg_ht = plot.height.baseVal.value;
	    var cart_btm = plot.viewBox.baseVal.y;
	    var cart_ht = plot.viewBox.baseVal.height;
	    return cart_btm + (1 - (svg_y - svg_y_top) / svg_ht) * cart_ht;
	}

	/* Print x with precision prx, removing trailing "." and 0's */
	function to_prx(x, prx)
	{
	    var s = x.toPrecision(prx);
	    s = s.replace(/0+$/, "");
	    return s.replace(/\.?$/, "");
	}

	/*
	   Create a set of axis labels for an axis ranging from x_min to x_max
	   with increment dx. Returns an array of coordinate values.
	 */

	function coord_list(x_min, x_max, dx)
	{
	    var x0;			/* Coordinate of first label = nearest
					   multiple of dx less than x_min */
	    var x;			/* x coordinate */
	    var coords;			/* Return value */
	    var n, m;			/* Loop indeces */

	    coords = [];
	    x0 = Math.floor(x_min / dx) * dx;
	    for (n = m = 0; n <= Math.ceil((x_max - x_min) / dx); n++) {
		x = x0 + n * dx;
		if ( x >= x_min - dx / 4 && x <= x_max + dx / 4 ) {
		    coords[m] = x;
		    m++;
		}
	    }
	    return coords;
	}

	/*
	   Apply coordinate list coords to x axis. Return total display length
	   of the labels.
	 */

	function apply_x_coords(coords)
	{
	    var l;
	    var textLength;
	    var x_svg;
	    var lbl, tic;

	    /*
	       If this is the first call, remove labels from static document.
	       This function call will create and manage new labels.
	    */

	    if ( x_labels.length === 0 ) {
		while ( x_axis.lastChild ) {
		    x_axis.removeChild(x_axis.lastChild);
		}
	    }

	    /* Create and position labels and tick marks */ 
	    for (l = 0, textLength = 0.0; l < coords.length; l++) {
		if ( !x_labels[l] ) {
		    lbl = document.createElementNS(svgNs, "text");
		    lbl.setAttribute("class", "x axis label");
		    lbl.setAttribute("text-anchor", "middle");
		    lbl.setAttribute("dominant-baseline", "hanging");
		    x_axis.appendChild(lbl);
		    tic = document.createElementNS(svgNs, "line");
		    tic.setAttribute("class", "x axis tic");
		    tic.setAttribute("stroke", "black");
		    tic.setAttribute("stroke-width", "1");
		    x_axis.appendChild(tic);
		    x_labels[l] = {};
		    x_labels[l].lbl = lbl;
		    x_labels[l].tic = tic;
		}
		x_svg = cart_x_to_svg(coords[l]);
		x_labels[l].lbl.setAttribute("x", x_svg);
		x_labels[l].lbl.setAttribute("y", x_axis_y0 + tick_len);
		x_labels[l].lbl.textContent = to_prx(coords[l], x_prx);
		x_labels[l].tic.setAttribute("x1", x_svg);
		x_labels[l].tic.setAttribute("x2", x_svg);
		x_labels[l].tic.setAttribute("y1", x_axis_y0);
		x_labels[l].tic.setAttribute("y2", x_axis_y0 + tick_len);
		textLength += x_labels[l].lbl.getComputedTextLength();
	    }

	    /* Keep extra label elements, but hide them */
	    for ( ; l < x_labels.length; l++) {
		x_labels[l].lbl.setAttribute("x", -80.0);
		x_labels[l].lbl.setAttribute("y", -80.0);
		x_labels[l].lbl.textContent = "";
		x_labels[l].tic.setAttribute("x1", -80.0);
		x_labels[l].tic.setAttribute("x2", -90.0);
		x_labels[l].tic.setAttribute("y1", -80.0);
		x_labels[l].tic.setAttribute("y2", -90.0);
	    }

	    return textLength;
	}

	/*
	   Apply coordinate list coords to y axis. Return total display height
	   of the labels.
	 */

	function apply_y_coords(coords)
	{
	    var y_svg;			/* SVG x coordinate of a label */
	    var l;			/* Label, coordinate index */
	    var bbox;			/* Bounding box for an element */
	    var font_ht;		/* Character height */
	    var textHeight;		/* Total display height */
	    var lbl, tic;

	    /*
	       If this is the first call, remove labels from static document.
	       This function call will create and manage new labels.
	    */

	    if ( y_labels.length === 0 ) {
		while ( y_axis.lastChild ) {
		    y_axis.removeChild(y_axis.lastChild);
		}
	    }

	    for (l = 0, textHeight = 0.0; l < coords.length; l++) {
		if ( !y_labels[l] ) {
		    lbl = document.createElementNS(svgNs, "text");
		    lbl.setAttribute("class", "y axis label");
		    lbl.setAttribute("text-anchor", "end");
		    lbl.setAttribute("dominant-baseline", "mathematical");
		    y_axis.appendChild(lbl);
		    tic = document.createElementNS(svgNs, "line");
		    tic.setAttribute("class", "y axis tic");
		    tic.setAttribute("stroke", "black");
		    tic.setAttribute("stroke-width", "1");
		    y_axis.appendChild(tic);
		    y_labels[l] = {};
		    y_labels[l].lbl = lbl;
		    y_labels[l].tic = tic;
		}
		y_svg = cart_y_to_svg(coords[l]);
		y_labels[l].lbl.setAttribute("x", y_axis_x1 - tick_len);
		y_labels[l].lbl.setAttribute("y", y_svg);
		y_labels[l].lbl.textContent = to_prx(coords[l], y_prx);
		y_labels[l].tic.setAttribute("x1", y_axis_x1 - tick_len);
		y_labels[l].tic.setAttribute("x2", y_axis_x1);
		y_labels[l].tic.setAttribute("y1", y_svg);
		y_labels[l].tic.setAttribute("y2", y_svg);
		bbox = y_labels[l].lbl.getBBox();
		textHeight += bbox.height;
	    }

	    /* Keep extra label elements, but hide them */
	    for ( ; l < y_labels.length; l++) {
		y_labels[l].lbl.setAttribute("x", -80.0);
		y_labels[l].lbl.setAttribute("y", -80.0);
		y_labels[l].lbl.textContent = "";
		y_labels[l].tic.setAttribute("x1", -80.0);
		y_labels[l].tic.setAttribute("x2", -90.0);
		y_labels[l].tic.setAttribute("y1", -80.0);
		y_labels[l].tic.setAttribute("y2", -90.0);
	    }

	    return textHeight;
	}

	/* Find smallest power of 10 larger than x */
	function up10(x)
	{
	    return Math.pow(10.0, Math.ceil(Math.log(x) / Math.LN10));
	}

	/* Label the plot axes. */
	function update_axes ()
	{
	    var viewBox;		/* axis viewBox */
	    var x, y;			/* Coordinate or axis location */
	    var dx, dy;			/* Proposed label spacing */
	    var l0, l1;			/* Lists of coordinates */
	    var max_sz;			/* Maximum space for labels */
	    var have_labels;		/* If true, have found a set of labels
					   for an axis */
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
	    var t;			/* Temporary */

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

	    /* Restore x axis position and update viewBox */
	    x_axis.setAttribute("x", x_axis_x0);
	    viewBox = x_axis_x0;
	    viewBox += " " + x_axis.viewBox.baseVal.y;
	    viewBox += " " + x_axis.viewBox.baseVal.width;
	    viewBox += " " + x_axis.viewBox.baseVal.height;
	    x_axis.setAttribute("viewBox", viewBox);

	    /* Create new labels for x axis */
	    max_sz = svg_width / 4;
	    if ( cart_left > cart_right ) {
		t = cart_right;
		cart_right = cart_left;
		cart_left = t;
	    }
	    l0 = [cart_left];
	    if ( cart_left === cart_right ) {
		apply_x_coords(l0);
	    } else {
		/*
		   Initialize dx with smallest power of 10 larger in magnitude
		   than cart_right - cart_left. Decrease magnitude of dx. Place
		   label set for the smaller dx into l1. If printing the labels
		   in l1 would overflow the axis with characters, restore and
		   use l0. Otherwise, replace l0 with l1 and retry with a
		   smaller dx.
		 */

		dx = up10(cart_right - cart_left);
		for (have_labels = false; !have_labels; ) {
		    l1 = coord_list(cart_left, cart_right, dx);
		    if ( apply_x_coords(l1) > max_sz ) {
			apply_x_coords(l0);
			have_labels = true;
		    } else {
			l0 = l1;
		    }
		    dx *= 0.5;			/* If dx was 10, now it is 5 */
		    l1 = coord_list(cart_left, cart_right, dx);
		    if ( apply_x_coords(l1) > max_sz ) {
			apply_x_coords(l0);
			have_labels = true;
		    } else {
			l0 = l1;
		    }
		    dx *= 0.4;			/* If dx was 5, now it is 2 */
		    l1 = coord_list(cart_left, cart_right, dx);
		    if ( apply_x_coords(l1) > max_sz ) {
			apply_x_coords(l0);
			have_labels = true;
		    } else {
			l0 = l1;
		    }
		    dx *= 0.5;			/* If dx was 2, now it is 1 */
		}
	    }

	    /* Restore y axis position and update viewBox */
	    y_axis.setAttribute("y", y_axis_y0);
	    viewBox = y_axis.viewBox.baseVal.x;
	    viewBox += " " + y_axis_y0;
	    viewBox += " " + y_axis.viewBox.baseVal.width;
	    viewBox += " " + y_axis.viewBox.baseVal.height;
	    y_axis.setAttribute("viewBox", viewBox);

	    /* Create new labels for y axis */
	    max_sz = svg_height / 4;
	    if ( cart_btm > cart_top ) {
		t = cart_top;
		cart_top = cart_btm;
		cart_btm = t;
	    }
	    l0 = [cart_btm];
	    if ( cart_btm === cart_top ) {
		apply_y_coords(l0);
	    } else {
		/*
		   Initialize dy with smallest power of 10 larger in magnitude
		   than cart_top - cart_btm. Decrease magnitude of dy. Place
		   label set for the smaller dy into l1. If printing the labels
		   in l1 would overflow the axis with characters, restore and
		   use l0. Otherwise, replace l0 with l1 and retry with a
		   smaller dy.
		 */

		dy = up10(cart_top - cart_btm);
		for (have_labels = false; !have_labels; ) {
		    l1 = coord_list(cart_btm, cart_top, dy);
		    if ( apply_y_coords(l1) > max_sz ) {
			apply_y_coords(l0);
			have_labels = true;
		    } else {
			l0 = l1;
		    }
		    dy *= 0.5;			/* If dy was 10, now it is 5 */
		    l1 = coord_list(cart_btm, cart_top, dy);
		    if ( apply_y_coords(l1) > max_sz ) {
			apply_y_coords(l0);
			have_labels = true;
		    } else {
			l0 = l1;
		    }
		    dy *= 0.4;			/* If dy was 5, now it is 2 */
		    l1 = coord_list(cart_btm, cart_top, dy);
		    if ( apply_y_coords(l1) > max_sz ) {
			apply_y_coords(l0);
			have_labels = true;
		    } else {
			l0 = l1;
		    }
		    dy *= 0.5;			/* If dy was 2, now it is 1 */
		}
	    }
	}

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

