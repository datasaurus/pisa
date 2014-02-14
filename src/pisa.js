/* This script add interactive behavior to a plot made by xyplot. */

/* Event handlers for dragging the plot area */
function start_plot_drag(evt)
{
    var plot = document.getElementById("plot");
    plot.x_axis = document.getElementById("xAxis");
    plot.y_axis = document.getElementById("yAxis");
    plot.background = document.getElementById("plotBackground");
    plot.x0 = Number(plot.getAttribute("x"));
    plot.y0 = Number(plot.getAttribute("y"));
    plot.prev_evt_x = plot.drag_x0 = evt.clientX;
    plot.prev_evt_y = plot.drag_y0 = evt.clientY;
    plot.drag = plot_drag;
    plot.end_drag = end_plot_drag;
    plot.addEventListener("mousemove", plot.drag, false);
    plot.addEventListener("mouseup", plot.end_drag, false);
}
function plot_drag(evt) {
    var plot = this;
    var x = Number(plot.getAttribute("x"));
    var y = Number(plot.getAttribute("y"));
    plot.setAttribute("x", x + evt.clientX - plot.prev_evt_x);
    plot.setAttribute("y", y + evt.clientY - plot.prev_evt_y);
    x = Number(plot.x_axis.getAttribute("x"));
    plot.x_axis.setAttribute("x", x + evt.clientX - plot.prev_evt_x);
    y = Number(plot.y_axis.getAttribute("y"));
    plot.y_axis.setAttribute("y", y + evt.clientY - plot.prev_evt_y);
    plot.prev_evt_x = evt.clientX
    plot.prev_evt_y = evt.clientY
}
function end_plot_drag(evt)
{
    var plot = this;
    get_geom(plot);
    var dx = (evt.clientX - plot.drag_x0) * plot.cart_width / plot.svg_width;
    var dy = (evt.clientY - plot.drag_y0) * plot.cart_height / plot.svg_height;
    var x = plot.cart_x0 - dx;
    var y = plot.cart_y1 - dy;
    var viewBox = x + " " + y + " " + plot.cart_width + " " + plot.cart_height;
    plot.setAttribute("viewBox", viewBox);
    plot.setAttribute("x", plot.x0);
    plot.setAttribute("y", plot.y0);
    plot.background.setAttribute("x", x);
    plot.background.setAttribute("y", y);
    plot.removeEventListener("mousemove", plot.drag, false);
    plot.removeEventListener("mouseup", plot.end_drag, false);
}

/*
   This callback displays the cursor location in a text element
   identified as "cursor_loc".
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
