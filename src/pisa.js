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
   .	$Revision: 1.35 $ $Date: 2014/04/23 17:15:00 $
 */

/*
   This function adds variables and functions related to the SVG plot
   to its call object. It sets up several event listeners, where the
   plot variables and functions persist anonymously in closures.
 */

window.addEventListener("load", function (evt) {

	"use strict";
	/*jslint browser:true */

	/* These objects store information about the plot elements */
	var plot = document.getElementById("plot");
	var plotBackground = document.getElementById("plotBackground");
	var cartG = document.getElementById("cartG");
	var x_axis = document.getElementById("xAxis");
	var y_axis = document.getElementById("yAxis");

	/*
	   Axis labels:
	   For each axis there will be an array of objects.
	   Each object will have as members:
	   lbl	- a text element with the text of the label
	   tic	- a line element with a tick mark
	 */

	var x_labels = [];
	var y_labels = [];

	var tick_len = 9.0;		/* Length of an axis tick */

	/* Number of significant digits in axis labels */
	var x_prx = 3;
	var y_prx = 3;

	var svgNs = "http://www.w3.org/2000/svg";

	/*
	   start_plot_drag, plot_drag, and end_plot_drag event handlers,
	   defined below, enable user to drag Cartesian plot and axes with
	   the mouse. These variables store information in this scope about
	   the initial positions of the plot elements and about the current
	   drag.
	 */

	var plotSVGX, plotSVGY;		/* SVG coordinates of plot element */
	var xAxisSVGX, xAxisSVGY;	/* SVG coordinates of x axis element */
	var yAxisSVGX, yAxisSVGY;	/* SVG coordinates of y axis element */
	var dragSVGX0, dragSVGY0;	/* SVG coordinates of mouse at start
					   of drag */
	var prevEvtSVGX, prevEvtSVGY;	/* SVG coordinates of mouse at previous
					   mouse event during drag */

	plotSVGX = Number(plot.getAttribute("x"));
	plotSVGY = Number(plot.getAttribute("y"));
	xAxisSVGX = Number(x_axis.getAttribute("x"));
	xAxisSVGY = Number(x_axis.getAttribute("y"));
	yAxisSVGX = Number(y_axis.getAttribute("x"));
	yAxisSVGY = Number(y_axis.getAttribute("y"));

	/* Local function definitions */

	/*
	   This function gets limits of the plot area in Cartesian coordinates.
	   Return value is an object with the following members:
	   .	left = x coordinate at left edge of plot area.
	   .	rght = x coordinate at right edge of plot area.
	   .	top = y coordinate at top edge of plot area.
	   .	btm = y coordinate at bottom edge of plot area.
	 */

	function get_cart()
	{
	    var xForm = cartG.transform.baseVal.getItem(0).matrix;
	    var a = xForm.a;
	    var d = xForm.d;
	    var e = xForm.e;
	    var f = xForm.f;
	    var cart = {};
	    cart.left = -e / a;
	    cart.rght = (plot.width.baseVal.value - e) / a;
	    cart.top = -f / d;
	    cart.btm = (plot.height.baseVal.value - f) / d;
	    return cart;
	}

	/*
	   Set limits of plot area in Cartesian coordinates from cart,
	   which is an object with the same members as the return value
	   from get_cart.
	 */

	function set_cart(cart)
	{
	    var xForm = cartG.transform.baseVal.getItem(0).matrix;
	    var widthSVG = plot.width.baseVal.value;
	    var htSVG = plot.height.baseVal.value;
	    xForm.a = widthSVG / (cart.rght - cart.left);
	    xForm.b = 0.0;
	    xForm.c = 0.0;
	    xForm.d = htSVG / (cart.btm - cart.top);
	    xForm.e = widthSVG * cart.left / (cart.left - cart.rght);
	    xForm.f = htSVG * cart.top / (cart.top - cart.btm);
	}

	/* Convert Cartesian x to SVG x */
	function cart_x_to_svg(cartX)
	{
	    var xLeftSVG = plot.x.baseVal.value;
	    var widthSVG = plot.width.baseVal.value;
	    var cart = get_cart();
	    var pxPerM = widthSVG / (cart.rght - cart.left);
	    return xLeftSVG + (cartX - cart.left) * pxPerM;
	}

	/* Convert SVG x Cartesian x */
	function svg_x_to_cart(svgX)
	{
	    var xLeftSVG = plot.x.baseVal.value;
	    var widthSVG = plot.width.baseVal.value;
	    var cart = get_cart();
	    var mPerPx = (cart.rght - cart.left) / widthSVG;
	    return cart.left + (svgX - xLeftSVG) * mPerPx;
	}

	/* Convert Cartesian y to SVG y */
	function cart_y_to_svg(cartY)
	{
	    var yTopSVG = plot.y.baseVal.value;
	    var htSVG = plot.height.baseVal.value;
	    var cart = get_cart();
	    var pxPerM = htSVG / (cart.btm - cart.top);
	    return yTopSVG + (cartY - cart.top) * pxPerM;
	}

	/* Convert SVG y Cartesian y */
	function svg_y_to_cart(svgY)
	{
	    var yTopSVG = plot.y.baseVal.value;
	    var htSVG = plot.height.baseVal.value;
	    var cart = get_cart();
	    var mPerPx = (cart.btm - cart.top) / htSVG;
	    return cart.top + (svgY - yTopSVG) * mPerPx;
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
	   Hide label, which must be a label object with text and tic elements.
	   The elements still exist in the document.
	 */ 

	function hide_label(label) {
	    label.lbl.setAttribute("x", -80.0);
	    label.lbl.setAttribute("y", -80.0);
	    label.lbl.textContent = "";
	    label.tic.setAttribute("x1", -80.0);
	    label.tic.setAttribute("x2", -90.0);
	    label.tic.setAttribute("y1", -80.0);
	    label.tic.setAttribute("y2", -90.0);
	}

	/*
	   Apply coordinate list coords to x axis. Return total display length
	   of the labels.
	 */

	function apply_x_coords(coords)
	{
	    var x_svg, y_svg;		/* Label location */
	    var plot_right;		/* SVG x coordinate of right side
					   of plot */
	    var l;			/* Label index */
	    var textLength;		/* SVG width required display text of
					   all labels */
	    var lbl, tic;		/* New label and tic elements */

	    y_svg = xAxisSVGY + 1.5 * tick_len;
	    plot_right = plotSVGX + Number(plot.getAttribute("width"));
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
		if ( plotSVGX <= x_svg && x_svg <= plot_right ) {
		    x_labels[l].lbl.setAttribute("x", x_svg);
		    x_labels[l].lbl.setAttribute("y", y_svg);
		    x_labels[l].lbl.textContent = to_prx(coords[l], x_prx);
		    x_labels[l].tic.setAttribute("x1", x_svg);
		    x_labels[l].tic.setAttribute("x2", x_svg);
		    x_labels[l].tic.setAttribute("y1", xAxisSVGY);
		    x_labels[l].tic.setAttribute("y2", xAxisSVGY + tick_len);
		    textLength += x_labels[l].lbl.getComputedTextLength();
		} else {
		    hide_label(x_labels[l]);
		}
	    }
	    for ( ; l < x_labels.length; l++) {
		hide_label(x_labels[l]);
	    }
	    return textLength;
	}

	/*
	   Apply coordinate list coords to y axis. Return total display height
	   of the labels.
	 */

	function apply_y_coords(coords)
	{
	    var x_svg;			/* SVG x coordinates of RIGHT side of
					   y axis element */
	    var y_svg;			/* SVG y coordinate of a label */
	    var width;			/* Width of y axis element */
	    var plot_btm;		/* SVG y coordinate of bottom of plot */
	    var l;			/* Label, coordinate index */
	    var bbox;			/* Bounding box for an element */
	    var font_ht;		/* Character height */
	    var textHeight;		/* Total display height */
	    var lbl, tic;

	    width = Number(y_axis.getAttribute("width"));
	    x_svg = yAxisSVGX + width;
	    plot_btm = plotSVGY + Number(plot.getAttribute("height"));
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
		if ( plotSVGY <= y_svg && y_svg <= plot_btm ) {
		    y_labels[l].lbl.setAttribute("x", x_svg - 1.5 * tick_len);
		    y_labels[l].lbl.setAttribute("y", y_svg);
		    y_labels[l].lbl.textContent = to_prx(coords[l], y_prx);
		    y_labels[l].tic.setAttribute("x1", x_svg - tick_len);
		    y_labels[l].tic.setAttribute("x2", x_svg);
		    y_labels[l].tic.setAttribute("y1", y_svg);
		    y_labels[l].tic.setAttribute("y2", y_svg);
		    bbox = y_labels[l].lbl.getBBox();
		    textHeight += bbox.height;
		} else {
		    hide_label(y_labels[l]);
		}
	    }
	    for ( ; l < y_labels.length; l++) {
		hide_label(y_labels[l]);
	    }
	    return textHeight;
	}

	/*
	   Produce a set of labels for coordinates ranging from lo to hi.
	   apply_coords must be a function that creates the labels in the
	   document and returns the amount of space they use. max_sz must
	   specify the maximum amount of space they are allowed to use.
	 */

	function mk_labels(lo, hi, apply_coords, max_sz)
	{
	    /*
	       Initialize dx with smallest power of 10 larger in magnitude
	       than hi - lo. Decrease magnitude of dx. Place
	       label set for the smaller dx into l1. If printing the labels
	       in l1 would overflow the axis with characters, restore and
	       use l0. Otherwise, replace l0 with l1 and retry with a
	       smaller dx.
	     */

	    var dx, have_labels, l0, l1, t;

	    if ( lo === hi ) {
		apply_coords([l0]);
		return;
	    }
	    if ( lo > hi ) {
		t = hi;
		hi = lo;
		lo = t;
	    }
	    dx = Math.pow(10.0, Math.ceil(Math.log(hi - lo) / Math.LN10));
	    for (have_labels = false; !have_labels; ) {
		l1 = coord_list(lo, hi, dx);
		if ( apply_coords(l1) > max_sz ) {
		    apply_coords(l0);
		    have_labels = true;
		} else {
		    l0 = l1;
		}
		dx *= 0.5;			/* If dx was 10, now it is 5 */
		l1 = coord_list(lo, hi, dx);
		if ( apply_coords(l1) > max_sz ) {
		    apply_coords(l0);
		    have_labels = true;
		} else {
		    l0 = l1;
		}
		dx *= 0.4;			/* If dx was 5, now it is 2 */
		l1 = coord_list(lo, hi, dx);
		if ( apply_coords(l1) > max_sz ) {
		    apply_coords(l0);
		    have_labels = true;
		} else {
		    l0 = l1;
		}
		dx *= 0.5;			/* If dx was 2, now it is 1 */
	    }
	}

	/* Label the plot axes. */
	function update_axes ()
	{
	    var viewBox;		/* axis viewBox */
	    var widthSVG;		/* Plot width, SVG coordinates */
	    var htSVG;			/* Plot height, SVG coordinates */
	    var cart;			/* Limits of plot in Cartesian
					   coordinates */

	    widthSVG = plot.width.baseVal.value;
	    htSVG = plot.height.baseVal.value;
	    cart = get_cart();

	    /* Restore x axis position and update viewBox */
	    x_axis.setAttribute("x", xAxisSVGX);
	    viewBox = xAxisSVGX;
	    viewBox += " " + x_axis.viewBox.baseVal.y;
	    viewBox += " " + x_axis.viewBox.baseVal.width;
	    viewBox += " " + x_axis.viewBox.baseVal.height;
	    x_axis.setAttribute("viewBox", viewBox);

	    /* Create new labels for x axis */
	    mk_labels(cart.left, cart.rght, apply_x_coords, widthSVG / 4);

	    /* Restore y axis position and update viewBox */
	    y_axis.setAttribute("y", yAxisSVGY);
	    viewBox = y_axis.viewBox.baseVal.x;
	    viewBox += " " + yAxisSVGY;
	    viewBox += " " + y_axis.viewBox.baseVal.width;
	    viewBox += " " + y_axis.viewBox.baseVal.height;
	    y_axis.setAttribute("viewBox", viewBox);

	    /* Create new labels for y axis */
	    mk_labels(cart.btm, cart.top, apply_y_coords, htSVG / 4);
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

	    dx = evt.clientX - prevEvtSVGX;
	    dy = evt.clientY - prevEvtSVGY;
	    x = Number(plot.getAttribute("x"));
	    y = Number(plot.getAttribute("y"));
	    plot.setAttribute("x", x + dx);
	    plot.setAttribute("y", y + dy);
	    x = Number(x_axis.getAttribute("x"));
	    x_axis.setAttribute("x", x + dx);
	    y = Number(y_axis.getAttribute("y"));
	    y_axis.setAttribute("y", y + dy);
	    prevEvtSVGX = evt.clientX;
	    prevEvtSVGY = evt.clientY;
	}

	/*
	   end_plot_drag is called at mouse up. It determines how much the
	   viewBox has changed since the start of the drag. It restores dragged
	   elements to their initial coordinates, plotSVGX, plotSVGY, but with a
	   new shifted viewBox.
	 */

	function end_plot_drag(evt)
	{
	    /*
	       Compute total distance dragged, in CARTESIAN coordinates, and
	       move plot viewBox by this amount
	     */

	    var widthSVG, htSVG;	/* SVG dimensions of plot area */
	    var cart;			/* Cartesian dimensions of plot area */
	    var mPerPx;			/* Convert Cartesian distance to SVG */
	    var dx, dy;			/* Drag distance in Cartesian
					   coordinates */

	    cart = get_cart();
	    widthSVG = plot.width.baseVal.value;
	    mPerPx = (cart.rght - cart.left) / widthSVG;
	    dx = (dragSVGX0 - evt.clientX) * mPerPx;
	    cart.left += dx;
	    cart.rght += dx;
	    htSVG = plot.height.baseVal.value;
	    mPerPx = (cart.btm - cart.top) / htSVG;
	    dy = (dragSVGY0 - evt.clientY) * mPerPx;
	    cart.btm += dy;
	    cart.top += dy;
	    set_cart(cart);

	    /*
	       Restore plot and background to their position at start of drag.
	       Elements in the plot will remain in the positions they were
	       dragged to because of the adjments to the viewBox.
	     */

	    plot.setAttribute("x", plotSVGX);
	    plot.setAttribute("y", plotSVGY);
	    var x_min = (cart.left < cart.rght) ? cart.left : cart.rght;
	    plotBackground.setAttribute("x", x_min);
	    var y_min = (cart.btm < cart.top) ? cart.btm : cart.top;
	    plotBackground.setAttribute("y", y_min);

	    update_axes();

	    plot.removeEventListener("mousemove", plot_drag, false);
	    plot.removeEventListener("mouseup", end_plot_drag, false);
	}

	/*
	   start_plot_drag is called at mouse down. It records the location of
	   the plot in its parent as members x0 and y0. It records the initial
	   cursor location in dragSVGX0 and dragSVGY0, which remain constant
	   throughout the drag. It also records the cursor location in members
	   prevEvtSVGX and prevEvtSVGY, which change at every mousemove during the
	   drag.
	 */

	function start_plot_drag(evt)
	{
	    prevEvtSVGX = dragSVGX0 = evt.clientX;
	    prevEvtSVGY = dragSVGY0 = evt.clientY;
	    plot.addEventListener("mousemove", plot_drag, false);
	    plot.addEventListener("mouseup", end_plot_drag, false);
	}

	plot.addEventListener("mousedown", start_plot_drag, false);
	plot.addEventListener("mousemove", update_cursor_loc, false);

	/*
	   Create a text element that displays the Cartesian coordinates
	   of the cursor location.
	 */

	var cursor_loc = document.createElementNS(svgNs, "text");
	cursor_loc.setAttribute("x", "24");
	cursor_loc.setAttribute("y", "24");
	cursor_loc.textContent = "x y";
	document.rootElement.appendChild(cursor_loc);

	function update_cursor_loc(evt)
	{
	    var x = svg_x_to_cart(evt.clientX);
	    var y = svg_y_to_cart(evt.clientY);
	    var txt = "Cursor: " + to_prx(x, x_prx) + " " + to_prx(y, x_prx);
	    cursor_loc.textContent = txt;
	}

	/*
	   Redraw the labels with javascript. This prevents sudden changes
	   in the image is the static document from the awk script noticeably
	   differs from the Javascript rendition.
	 */

	while ( x_axis.lastChild ) {
	    x_axis.removeChild(x_axis.lastChild);
	}
	while ( y_axis.lastChild ) {
	    y_axis.removeChild(y_axis.lastChild);
	}
	update_axes();

}, false);			/* Done defining load callback */

