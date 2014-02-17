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

function start_plot_drag(evt)
{
    var plot = document.getElementById("plot");
    plot.x0 = Number(plot.getAttribute("x"));
    plot.y0 = Number(plot.getAttribute("y"));
    plot.prev_evt_x = plot.drag_x0 = evt.clientX;
    plot.prev_evt_y = plot.drag_y0 = evt.clientY;
    plot.addEventListener("mousemove", plot_drag, false);
    plot.addEventListener("mouseup", end_plot_drag, false);
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
    get_geom(plot);

    /*
       Compute total distance dragged, in CARTESIAN coordinates, and move
       plot viewBox by this amount
    */

    var dx = (evt.clientX - plot.drag_x0) * plot.cart_width / plot.svg_width;
    var dy = (evt.clientY - plot.drag_y0) * plot.cart_height / plot.svg_height;
    var x = plot.cart_x0 - dx;
    var y = plot.cart_y1 - dy;
    var viewBox = x + " " + y + " " + plot.cart_width + " " + plot.cart_height;
    plot.setAttribute("viewBox", viewBox);

    /*
       Restore plot and background to their position at start of drag.
       Elements in the plot will remain in the positions they were
       dragged to because of the adjments to the viewBox.
     */

    plot.setAttribute("x", plot.x0);
    plot.setAttribute("y", plot.y0);
    var background = document.getElementById("plotBackground");
    background.setAttribute("x", x);
    background.setAttribute("y", y);

    plot.removeEventListener("mousemove", plot_drag, false);
    plot.removeEventListener("mouseup", end_plot_drag, false);
}

/*
   This convenience function updates the following members of plot:
   cart_x0	- Cartesian x coordinate of plot left side.
   cart_x1	- Cartesian x coordinate of plot right side.
   cart_width	- cart_x1 - cart_x0
   cart_y0	- Cartesian y coordinate of plot bottom.
   cart_y1	- Cartesian y coordinate of plot top.
   cart_height	- cart_y1 - cart_y0
   clientX	- SVG x coordinate of plot in parent element, pixels.
   clientY	- SVG y coordinate of plot in parent element, pixels.
   clientWidth	- SVG width of plot, pixels.
   clientHeight	- SVG height of plot, pixels.
 */

function get_geom(plot)
{
    plot.svg_x = Number(plot.getAttribute("x"));
    plot.svg_y = Number(plot.getAttribute("y"));
    plot.svg_width = Number(plot.getAttribute("width"));
    plot.svg_height = Number(plot.getAttribute("height"));
    var viewBox = plot.getAttribute("viewBox");
    var vb = viewBox.split(/\s+/);
    plot.cart_x0 = Number(vb[0]);
    plot.cart_width = Number(vb[2]);
    plot.cart_x1 = plot.cart_x0 + plot.cart_width;
    plot.cart_y1 = Number(vb[1]);
    plot.cart_height = Number(vb[3]);
    plot.cart_y0 = plot.cart_y1 - plot.cart_height;
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
    get_geom(plot);
    var x = plot.cart_x0 + (evt.clientX - plot.svg_x)
	* plot.cart_width / plot.svg_width;
    var y = plot.cart_y0 + (plot.svg_height - (evt.clientY - plot.svg_y))
	* plot.cart_height / plot.svg_height;

    /* Update display */
    var prev_loc = cursor_loc.firstChild;
    var new_loc = document.createTextNode(
	    x.toPrecision(3) + " " + y.toPrecision(3));
    cursor_loc.replaceChild(new_loc, prev_loc);
}
