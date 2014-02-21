/* This script adds interactive behavior to a plot made by xyplot. */

/*
   start_plot_drag, plot_drag, and end_plot_drag are event handlers for
   dragging the plot area and axes.

   Cartesian plot is in a SVG element with id "plot"
   var plot is the associated object.

   start_plot_drag is called at mouse down. It records the location of
   the plot in its parent as members x0 and y0. It records the initial
   cursor location in members drag_x0 and drag_y0, which remain constant
   throughout the drag. It also records the cursor location in members
   prev_evt_x and prev_evt_y, which change at every mousemove during the
   drag.
*/

svgNs="http://www.w3.org/2000/svg";

function start_plot_drag(evt)
{
    var plot = document.getElementById("plot");
    plot.x0 = Number(plot.getAttribute("x"));
    plot.y0 = Number(plot.getAttribute("y"));
    plot.prev_evt_x = plot.drag_x0 = evt.clientX;
    plot.prev_evt_y = plot.drag_y0 = evt.clientY;
    plot.addEventListener("mousemove", plot_drag, false);
    plot.addEventListener("mouseup", end_plot_drag, false);
    x_axis = document.getElementById("xAxis");
    x_axis.x0 = Number(x_axis.getAttribute("x"));
}

/*
   plot_drag is called at each mouse move during the drag. It determines
   how much the mouse has moved since the last event, and shifts the
   dragable elements by that amount.
 */

function plot_drag(evt) {
    var plot = document.getElementById("plot");
    var dx = evt.clientX - plot.prev_evt_x;
    var dy = evt.clientY - plot.prev_evt_y;
    var x = Number(plot.getAttribute("x"));
    var y = Number(plot.getAttribute("y"));
    plot.setAttribute("x", x + dx);
    plot.setAttribute("y", y + dy);

    var x_axis = document.getElementById("xAxis");
    x = Number(x_axis.getAttribute("x"));
    x_axis.setAttribute("x", x + dx);

    var y_axis = document.getElementById("yAxis");
    y = Number(y_axis.getAttribute("y"));
    y_axis.setAttribute("y", y + dy);

    plot.prev_evt_x = evt.clientX
    plot.prev_evt_y = evt.clientY
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
    var cart_width = plot.viewBox.baseVal.width;
    var cart_height = plot.viewBox.baseVal.height;
    var dx = (evt.clientX - plot.drag_x0) * cart_width / svg_width;
    var dy = (evt.clientY - plot.drag_y0) * cart_height / svg_height;
    var cart_x0 = plot.viewBox.baseVal.x - dx;
    var cart_y0 = plot.viewBox.baseVal.y - dy;
    var viewBox = cart_x0 + " " + cart_y0
	+ " " + cart_width + " " + cart_height;
    plot.setAttribute("viewBox", viewBox);

    /*
       Restore plot and background to their position at start of drag.
       Elements in the plot will remain in the positions they were
       dragged to because of the adjments to the viewBox.
     */

    plot.setAttribute("x", plot.x0);
    plot.setAttribute("y", plot.y0);
    var background = document.getElementById("plotBackground");
    background.setAttribute("x", cart_x0);
    background.setAttribute("y", cart_y0);

    update_axes();

    plot.removeEventListener("mousemove", plot_drag, false);
    plot.removeEventListener("mouseup", end_plot_drag, false);
}

/* Label the axes. */
function update_axes()
{
    var x_axis;				/* SVG element with axis */
    var plot;				/* SVG element with axis */
    var viewBox;			/* x_axis viewBox */
    var x_offset;			/* x_axis extends slightly beyond plot
					   area so that corner labels, if any,
					   will not be clipped. */
    var elems;				/* Axis elements */
    var x, y;				/* Coordinate or axis location */
    var prx = 3;			/* Label precision */
    var font_sz;			/* Label font size */
    var n_max;				/* Axis length in characters */
    var labels;				/* Result from axis_lbl */
    var lbl;				/* Property of labels */
    var lbl_elem;			/* Coordinate text element */

    x_axis = document.getElementById("xAxis");
    plot = document.getElementById("plot");

    /* Fetch drawing attributes from first label */
    elems = x_axis.getElementsByTagName("text");
    lbl_elem = elems.item(0);
    y = lbl_elem.getAttribute("y");
    font_sz = Number(lbl_elem.getAttribute("font-size"));

    /* Move x axis back to position at start of drag and update viewBox */
    x_axis.setAttribute("x", x_axis.x0);
    viewBox = x_axis.x0 + " " + x_axis.viewBox.baseVal.y
	+ " " + x_axis.viewBox.baseVal.width
	+ " " + x_axis.viewBox.baseVal.height;
    x_axis.setAttribute("viewBox", viewBox);
    x_offset = 4.0 * font_sz;

    /* Create new labels */
    while ( x_axis.lastChild ) {
	x_axis.removeChild(x_axis.lastChild);
    }
    var svg_width = plot.width.baseVal.value;
    var cart_left_x = plot.viewBox.baseVal.x;
    var cart_width = plot.viewBox.baseVal.width;
    var cart_right_x = cart_left_x + cart_width;
    n_max = Math.floor(svg_width / font_sz);
    labels = axis_lbl(cart_left_x, cart_right_x, prx, n_max);
    for (lbl in labels) {
	lbl_elem = document.createElementNS(svgNs, "text");
	lbl_elem.setAttribute("class", "x axis label");
	x = x_offset + (labels[lbl] - cart_left_x) * svg_width / cart_width;
	lbl_elem.setAttribute("x", x);
	lbl_elem.setAttribute("y", y);
	lbl_elem.setAttribute("font-size", font_sz);
	lbl_elem.setAttribute("text-anchor", "middle");
	lbl_elem.setAttribute("dominant-baseline", "hanging");
	lbl_elem.appendChild(document.createTextNode(lbl));
	x_axis.appendChild(lbl_elem);
    }
}

/*
   axis_lbl --
   This function determines label locations for a horizontal axis.
   x_min	coordinate at start of axis.
   x_max	coordinate at end of axis.
   prx		precision for printing a coordinate
   n_max	number of characters allowed for all labels

   Return value is an object to be used as an associated array. Each index
   is a label to print on the axis. Each value is the coordinate along the
   axis at which to print the label.
 */

function axis_lbl(x_min, x_max, prx, n_max)
{
   var dx;				/* Proposed label spacing */
   var lbl_str;				/* Coordinate(s) as a string */
   var l0, l1;				/* Candidates for return value */

    /* Force x_max > x_min */
    if ( x_min > x_max ) {
	var t = x_max;
	x_max = x_min;
	x_min = t;
    } 

    l0 = new Object();

    /* Handle axis with zero, one, or two labels */
    lbl_str = x_min.toPrecision(prx);
    l0[lbl_str] = x_min;
    if ( x_min == x_max || lbl_str.length > n_max ) {
	return l0;
    }
    lbl_str = x_max.toPrecision(prx);
    l0[lbl_str] = x_max;
    lbl_str = x_min.toPrecision(prx) + " " + x_max.toPrecision(prx);
    if ( lbl_str.length > n_max ) {
	return l0;
    }

    /*
       Initialize dx with smallest power of 10 larger in magnitude than
       x_max - x_min. Decrease magnitude of dx. Place label set for the
       smaller dx into l1. If printing the labels in l1 would overflow
       the axis with characters, return l0. Otherwise, replace l0 with
       l1 and retry with a smaller dx.
     */

    dx = Math.pow(10.0, Math.ceil(Math.log(x_max - x_min) / Math.LN10))
    while (1) {
	l1 = mk_lbl(x_min, x_max, dx, prx);
	if ( labels_len(l1) > n_max ) {
	    return l0;
	} else {
	    l0 = l1;

	}
	dx *= 0.5;			/* If dx was 5, now it is 2 */
	l1 = mk_lbl(x_min, x_max, dx, prx);
	if ( labels_len(l1) > n_max ) {
	    return l0;
	} else {
	    l0 = l1;
	}
	dx *= 0.4;			/* If dx was 2, now it is 1 */
	l1 = mk_lbl(x_min, x_max, dx, prx);
	if ( labels_len(l1) > n_max ) {
	    return l0;
	} else {
	    l0 = l1;
	}
	dx *= 0.5;			/* If dx was 2, now it is 1 */
    }
}

/*
   Print labels from x_min to x_max with increment dx and print precision
   prx to a string. Assign the label coordinates and label strings into l1.
   Return the length of the string needed to print the labels.
 */

function mk_lbl(x_min, x_max, dx, prx)
{
    var n;				/* Label index */
    var x0;				/* Coordinate of first label = nearest
					   multiple of dx less than x_min */
    var x;				/* x coordinate */
    var lbl;				/* String representation of a
					   coordinate */
    var labels;				/* Return object. Indeces are strings.
					   Values are coordinate values. */

    labels = new Object();
    x0 = Math.floor(x_min / dx) * dx;
    for (n = 0; n <= Math.ceil((x_max - x_min) / dx); n++) {
	x = x0 + n * dx;
	if ( x >= x_min - dx / 4 && x <= x_max + dx / 4 ) {
	    lbl = x.toPrecision(prx);
	    labels[lbl] = x;
	}
    }
    return labels;
}

/*
   Return length of a set of labels.
 */

function labels_len(labels)
{
    var lbl, len = 0;

    for (lbl in labels) {
	len += lbl.length + 1;
    }
    return len;
}

/*
   This callback displays the Cartesian coordinates of the cursor location
   in a text element identified as "cursor_loc".
 */

function cursor_loc(evt)
{
    /* Identify elements */
    var cursor_loc = document.getElementById("cursor_loc");
    var plot = document.getElementById("plot");

    /* Compute Cartesian coordinates of cursor location */
    var svg_x0 = plot.x.baseVal.value;
    var svg_y0 = plot.y.baseVal.value;
    var svg_width = plot.width.baseVal.value;
    var svg_height = plot.height.baseVal.value;
    var cart_width = plot.viewBox.baseVal.width;
    var cart_height = plot.viewBox.baseVal.height;
    var cart_x0 = plot.viewBox.baseVal.x;
    var cart_y0 = plot.viewBox.baseVal.y;
    var x = cart_x0 + (evt.clientX - svg_x0) * cart_width / svg_width;
    var y = cart_y0 - (evt.clientY - svg_y0) * cart_height / svg_height;

    /* Update display */
    var prev_loc = cursor_loc.firstChild;
    var new_loc = document.createTextNode(
	    x.toPrecision(3) + " " + y.toPrecision(3));
    cursor_loc.replaceChild(new_loc, prev_loc);
}

