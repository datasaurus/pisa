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
   .	$Revision: 1.8 $ $Date: 2014/02/25 20:14:30 $
 */

svgNs="http://www.w3.org/2000/svg";

/* Convert Cartesian y coordinate in plot to SVG y coordinate in document */
function cart_y_to_svg(cart_y)
{
    var plot = document.getElementById("plot");
    var svg_y_top = plot.y.baseVal.value;
    var svg_ht = plot.height.baseVal.value;
    var cart_y_btm = plot.viewBox.baseVal.y;
    var cart_ht = plot.viewBox.baseVal.height;
    return svg_y_top + (1 - (cart_y - cart_y_btm) / cart_ht) * svg_ht;
}

/* Convert SVG y coordinate in document to Cartesian in plot */
function svg_y_to_cart(svg_y)
{
    var plot = document.getElementById("plot");
    var svg_y_top = plot.y.baseVal.value;
    var svg_ht = plot.height.baseVal.value;
    var cart_y_btm = plot.viewBox.baseVal.y;
    var cart_ht = plot.viewBox.baseVal.height;
    return cart_y_btm + (1 - (svg_y - svg_y_top) / svg_ht) * cart_ht;
}

/* Print a number with precision prx. Remove trailing 0's */
Number.prototype.to_prx = function(prx) {
    var s = this.toPrecision(prx);
    s = s.replace(/0+$/, "");
    return s.replace(/\.?$/, "");
};

/*
   This function creates a set of axis labels for an axis ranging from x_min to
   x_max with increment dx and print precision prx.
 */

function mk_lbl(x_min, x_max, dx, prx)
{
    var x0;				/* Coordinate of first label = nearest
					   multiple of dx less than x_min */
    var x;				/* x coordinate */
    var lbl;				/* String representation of a
					   coordinate */
    var labels;				/* Return object. Indeces are strings.
					   Values are coordinate values. */
    var n;				/* Loop index */

    labels = {};
    x0 = Math.floor(x_min / dx) * dx;
    for (n = 0; n <= Math.ceil((x_max - x_min) / dx); n++) {
	x = x0 + n * dx;
	if ( x >= x_min - dx / 4 && x <= x_max + dx / 4 ) {
	    lbl = x.to_prx(prx);
	    labels[lbl] = x;
	}
    }
    return labels;
}

/* Compute length of a set of labels for a horizontal axis */ 
function labels_x_sz(labels, font_sz)
{
    var lbl, len = 0;
    for (lbl in labels) {
	if ( labels.hasOwnProperty(lbl) ) {
	    len += (lbl.length + 1) * font_sz;
	}
    }
    return len;
}

/* Compute length of a set of labels for a vertical axis */ 
function labels_y_sz(labels, font_sz)
{
    var lbl, len = 0;
    for (lbl in labels) {
	if ( labels.hasOwnProperty(lbl) ) {
	    len += 2 * font_sz;
	}
    }
    return len;
}

/*
   axis_lbl --
   This function determines label locations for a an axis.
   x_min	coordinate at start of axis.
   x_max	coordinate at end of axis.
   prx		precision for printing a coordinate
   len		axis length, SVG display units
   font_sz	font size
   labels_sz	function to compute the space needed for the text of a set
   .		of labels, given a labels object (return value of mk_lbl) and
   .		font size.
   .
   Return value is an object to be used as an associated array. Each string
   index is a label to print on the axis. Each value is the coordinate on the
   axis at which to print the label.
 */

function axis_lbl(x_min, x_max, prx, len, font_sz, labels_sz)
{
   var dx;				/* Proposed label spacing */
   var lbl_str;				/* Coordinate(s) as a string */
   var l0, l1;				/* Candidates for return value */

    l0 = {};
    if ( x_min > x_max ) {
	var t = x_max;
	x_max = x_min;
	x_min = t;
    } 

    /* Handle axis with zero, one, or two labels */
    lbl_str = x_min.to_prx(prx);
    l0[lbl_str] = x_min;
    if ( x_min === x_max || lbl_str.length * font_sz > len ) {
	return l0;
    }
    lbl_str = x_max.to_prx(prx);
    l0[lbl_str] = x_max;
    lbl_str = x_min.to_prx(prx) + " " + x_max.to_prx(prx);
    if ( lbl_str.length * font_sz > len ) {
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
	if ( labels_sz(l1, font_sz) > len ) {
	    return l0;
	} else {
	    l0 = l1;
	}
	dx *= 0.5;			/* If dx was 5, now it is 2 */
	l1 = mk_lbl(x_min, x_max, dx, prx);
	if ( labels_sz(l1, font_sz) > len ) {
	    return l0;
	} else {
	    l0 = l1;
	}
	dx *= 0.4;			/* If dx was 2, now it is 1 */
	l1 = mk_lbl(x_min, x_max, dx, prx);
	if ( labels_sz(l1, font_sz) > len ) {
	    return l0;
	} else {
	    l0 = l1;
	}
	dx *= 0.5;			/* If dx was 2, now it is 1 */
    }
}

/* Label the axes around the plot. */
function update_axes()
{
    var axis;				/* SVG element with axis */
    var plot;				/* SVG element with plot area */
    var viewBox;			/* axis viewBox */
    var offset;				/* Axes extends slightly beyond plot
					   area so that labels at corners, if
					   any, are not clipped. */
    var elems;				/* Axis elements */
    var x, y;				/* Coordinate or axis location */
    var prx = 3;			/* Label precision */
    var font_sz;			/* Label font size */
    var labels;				/* Result from axis_lbl */
    var lbl;				/* Property of labels */
    var lbl_elem;			/* Coordinate text element */
    var svg_width;			/* Plot width, SVG coordinates */
    var svg_height;			/* Plot height, SVG coordinates */
    var cart_x_left;			/* Cartesian x coordinate of left edge
					   of plot */
    var cart_x_right;			/* Cartesian x coordinate of right side
					   of plot */
    var cart_width;			/* cart_x_right - cart_x_left */
    var cart_y_top;			/* Cartesian y coordinate at top edge
					   of plot */
    var cart_y_btm;			/* Cartesian y coordinate at bottom
					   edge of plot */
    var cart_ht;			/* cart_y_top - cart_y_btm */

    plot = document.getElementById("plot");
    svg_width = plot.width.baseVal.value;
    svg_height = plot.height.baseVal.value;
    cart_x_left = plot.viewBox.baseVal.x;
    cart_width = plot.viewBox.baseVal.width;
    cart_x_right = cart_x_left + cart_width;
    cart_y_btm = plot.viewBox.baseVal.y;
    cart_ht = plot.viewBox.baseVal.height;
    cart_y_top = cart_y_btm + cart_ht;

    /* Update x axis */
    axis = document.getElementById("xAxis");

    /* Fetch drawing attributes from first label */
    elems = axis.getElementsByTagName("text");
    lbl_elem = elems.item(0);
    y = lbl_elem.getAttribute("y");
    font_sz = Number(lbl_elem.getAttribute("font-size"));

    /* Move x axis back to position at start of drag and update viewBox */
    axis.setAttribute("x", axis.x0);
    viewBox = axis.x0 + " " + axis.viewBox.baseVal.y
	+ " " + axis.viewBox.baseVal.width
	+ " " + axis.viewBox.baseVal.height;
    axis.setAttribute("viewBox", viewBox);
    offset = 4.0 * font_sz;		/* From xyplot.awk */

    /* Create new labels for x axis */
    while ( axis.lastChild ) {
	axis.removeChild(axis.lastChild);
    }
    labels = axis_lbl(cart_x_left, cart_x_right, prx, svg_width, font_sz,
	    labels_x_sz);
    for (lbl in labels) {
	if ( labels.hasOwnProperty(lbl) ) {
	    lbl_elem = document.createElementNS(svgNs, "text");
	    lbl_elem.setAttribute("class", "x axis label");
	    x = offset + (labels[lbl] - cart_x_left) * svg_width / cart_width;
	    lbl_elem.setAttribute("x", x);
	    lbl_elem.setAttribute("y", y);
	    lbl_elem.setAttribute("font-size", font_sz);
	    lbl_elem.setAttribute("text-anchor", "middle");
	    lbl_elem.setAttribute("dominant-baseline", "hanging");
	    lbl_elem.appendChild(document.createTextNode(lbl));
	    axis.appendChild(lbl_elem);
	}
    }

    /* Update y axis */
    axis = document.getElementById("yAxis");

    /* Fetch drawing attributes from first y axis label */
    elems = axis.getElementsByTagName("text");
    lbl_elem = elems.item(0);
    x = lbl_elem.getAttribute("x");
    font_sz = Number(lbl_elem.getAttribute("font-size"));

    /* Move y axis back to position at start of drag and update viewBox */
    axis.setAttribute("y", axis.y0);
    viewBox = axis.viewBox.baseVal.x + " " + axis.y0
	+ " " + axis.viewBox.baseVal.width
	+ " " + axis.viewBox.baseVal.height;
    axis.setAttribute("viewBox", viewBox);
    offset = font_sz;			/* From xyplot.awk */

    /* Create new labels for y axis */
    while ( axis.lastChild ) {
	axis.removeChild(axis.lastChild);
    }
    labels = axis_lbl(cart_y_btm, cart_y_top, prx, svg_height, font_sz,
	    labels_y_sz);
    for (lbl in labels) {
	if ( labels.hasOwnProperty(lbl) ) {
	    lbl_elem = document.createElementNS(svgNs, "text");
	    lbl_elem.setAttribute("class", "y axis label");
	    y = cart_y_to_svg(labels[lbl]);
	    lbl_elem.setAttribute("x", x);
	    lbl_elem.setAttribute("y", y);
	    lbl_elem.setAttribute("font-size", font_sz);
	    lbl_elem.setAttribute("text-anchor", "end");
	    lbl_elem.setAttribute("dominant-baseline", "mathematical");
	    lbl_elem.appendChild(document.createTextNode(lbl));
	    axis.appendChild(lbl_elem);
	}
    }
}

/*
   start_plot_drag, plot_drag, and end_plot_drag event handlers enabled
   user to drag Cartesian plot and axes with the mouse.
 */

/*
   plot_drag is called at each mouse move while the plot is being dragged.
   It determines how much the mouse has moved since the last event, and
   shifts the dragable elements by that amount.
 */

function plot_drag(evt)
{
    var plot = document.getElementById("plot");
    var dx = evt.clientX - plot.prev_evt_x;
    var dy = plot.prev_evt_y - evt.clientY;
    var x = Number(plot.getAttribute("x"));
    var y = Number(plot.getAttribute("y"));
    plot.setAttribute("x", x + dx);
    plot.setAttribute("y", y + dy);

    var x_axis = document.getElementById("xAxis");
    x = Number(x_axis.getAttribute("x"));
    x_axis.setAttribute("x", x + dx);

    var y_axis = document.getElementById("yAxis");
    y = Number(y_axis.getAttribute("y"));
    y_axis.setAttribute("y", y - dy);

    plot.prev_evt_x = evt.clientX;
    plot.prev_evt_y = evt.clientY;
}

/*
   end_plot_drag is called at mouse up. It determines how much the viewBox
   has changed since the start of the drag. It restores dragged elements
   to their initial coordinates, plot.x0, plot.y0, but with a new shifted
   viewBox.
 */

function end_plot_drag(evt)
{
    var plot = document.getElementById("plot");

    /*
       Compute total distance dragged, in CARTESIAN coordinates, and move
       plot viewBox by this amount
    */

    var svg_width = plot.width.baseVal.value;
    var svg_height = plot.height.baseVal.value;
    var vb_width = plot.viewBox.baseVal.width;
    var vb_height = plot.viewBox.baseVal.height;
    var dx = (evt.clientX - plot.drag_x0) * vb_width / svg_width;
    var dy = (plot.drag_y0 - evt.clientY) * vb_height / svg_height;
    var vb_x0 = plot.viewBox.baseVal.x - dx;
    var vb_y0 = plot.viewBox.baseVal.y - dy;
    var viewBox = vb_x0 + " " + vb_y0
	+ " " + vb_width + " " + vb_height;
    plot.setAttribute("viewBox", viewBox);

    /*
       Restore plot and background to their position at start of drag.
       Elements in the plot will remain in the positions they were
       dragged to because of the adjments to the viewBox.
     */

    plot.setAttribute("x", plot.x0);
    plot.setAttribute("y", plot.y0);
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
   cursor location in members drag_x0 and drag_y0, which remain constant
   throughout the drag. It also records the cursor location in members
   prev_evt_x and prev_evt_y, which change at every mousemove during the
   drag.
*/

function start_plot_drag(evt)
{
    var plot = document.getElementById("plot");
    plot.x0 = Number(plot.getAttribute("x"));
    plot.y0 = Number(plot.getAttribute("y"));
    plot.prev_evt_x = plot.drag_x0 = evt.clientX;
    plot.prev_evt_y = plot.drag_y0 = evt.clientY;
    plot.addEventListener("mousemove", plot_drag, false);
    plot.addEventListener("mouseup", end_plot_drag, false);
    var x_axis = document.getElementById("xAxis");
    x_axis.x0 = Number(x_axis.getAttribute("x"));
    var y_axis = document.getElementById("yAxis");
    y_axis.y0 = Number(y_axis.getAttribute("y"));
}

/*
   This callback displays the Cartesian coordinates of the cursor location
   in a text element identified as "cursor_loc".
 */

function update_cursor_loc(evt)
{
    /* Identify elements */
    var cursor_loc = document.getElementById("cursor_loc");
    var plot = document.getElementById("plot");

    /* Compute Cartesian coordinates of cursor location */
    var svg_x0 = plot.x.baseVal.value;
    var svg_y0 = plot.y.baseVal.value;
    var svg_width = plot.width.baseVal.value;
    var svg_height = plot.height.baseVal.value;
    var vb_width = plot.viewBox.baseVal.width;
    var vb_height = plot.viewBox.baseVal.height;
    var vb_x0 = plot.viewBox.baseVal.x;
    var vb_y0 = plot.viewBox.baseVal.y;
    var x = vb_x0 + (evt.clientX - svg_x0) * vb_width / svg_width;
    var y = svg_y_to_cart(evt.clientY);

    /* Update display */
    var prev_loc = cursor_loc.firstChild;
    var new_loc = document.createTextNode(
	    x.to_prx(3) + " " + y.to_prx(3));
    cursor_loc.replaceChild(new_loc, prev_loc);
}
