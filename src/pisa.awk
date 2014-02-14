#!/usr/bin/awk -f
#
#	xyplot.awk --
#		Create a SVG document with a cartesian plot in it.
#
################################################################################
#
# Copyright (c) 2013, Gordon D. Carrie. All rights reserved.
# 
# Redistribution and use in source and binary forms, with or without
# modification, are permitted provided that the following conditions
# are met:
# 
#     * Redistributions of source code must retain the above copyright
#     notice, this list of conditions and the following disclaimer.
#     * Redistributions in binary form must reproduce the above copyright
#     notice, this list of conditions and the following disclaimer in the
#     documentation and/or other materials provided with the distribution.
# 
# THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
# "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
# LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
# A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
# HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
# SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED
# TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
# PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
# LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
# NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
# SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
#
# Please send feedback to dev0@trekix.net
#
# $Revision: 1.12 $ $Date: 2014/02/03 23:05:53 $
#
################################################################################
#
# Standard input must include:
#
#	x0 plot_coord
#	x1 plot_coord
#	y0 plot_coord
#	y1 plot_coord
#	doc_width pixels
#	top pixels
#	right pixels
#	bottom pixels
#	left pixels
#	font_sz size
#	start_plot
#	end_plot
#	end
#
# Standard input may also include:
#
#	doc_height pixels
#
# where:
#	
#	x0		x coordinate of left edge of plot in plot coordinates
#	x1		x coordinate of right edge of plot in plot coordinates
#	y0		y coordinate of bottom edge of plot in plot coordinates
#	y1		y coordinate of top edge of plot in plot coordinates
#	doc_width	document width in display units (pixels).
#	doc_height	(optional) plot height, in display units (pixels).
#	top		size of the area above the plot, in display units
#	right		size of the area right of the plot, in display units
#	bottom		size of the area below the plot, in display units
#	left		size of the area left of the plot, in display units
#			Document width will be left + doc_width + right
#			Document height will be top + doc_height + bottom
#	font_sz		font size for labels, in display units
#	x_fmt		format for x axis labels
#	y_fmt		format for y axis labels
#	start_plot	tells the process to just pass input to output.
#			Input should be SVG code for items in the plot.
#	end_plot	indicates no more plot input. The process prints
#			SVG code to finish the plot. Then it resumes
#			passing input to output, allowing additional
#			SVG elements.
#	end		indicates no more input. The process prints
#			SVG code to finish the document, and exits.
#
################################################################################

# axis_lbl --
#	This function determines axis label locations.
#	x_min	(in)	start of axis.
#	x_max	(in)	end of axis.
#	fmt	(in) 	label format
#	n_max	(in)	number of characters allowed for all labels
#	labels	(out)	Label coordinates and strings are returned in labels.
#			Each index is an x coordinate. Corresponding value is
#			the string to print there.
#	l0, l1, dx, t	local variables
#
#	Algorithm:
#	Initialize the interval dx to a power of 10 larger than the interval
#	from x_max - x_min, then try smaller steps until all of the labels with
#	a space character between them fit into n_max characters. The interval
#	will be a multiple of 10, 5, or 2 times some power of 10.
#
function axis_lbl(x_min, x_max, fmt, n_max, labels,
	l0, l1, dx, t)
{
#   Put a tentative number of labels into l0.
#   Put more labels into l1. If l1 would need more than n_max
#   characters, return l0. Otherwise, copy l1 to l0 and try
#   a more populated l1.
    if ( x_min > x_max ) {
	t = x_max;
	x_max = x_min;
	x_min = t;
    } else if ( x_min == x_max ) {
	labels["0"] = "";
	return;
    }
    l0[x_min] = sprintf(fmt, x_min);
    if ( length(sprintf(fmt, x_min)) > n_max ) {
	copy_arr(labels, l0);
	return;
    }
    if ( length(sprintf(fmt " " fmt, x_min, x_max)) > n_max ) {
	copy_arr(labels, l0);
	return;
    }
    l0[x_min] = sprintf(fmt, x_min);
    l0[x_max] = sprintf(fmt, x_max);
    dx = pow10(x_max - x_min);
    while (1) {
	if ( mk_lbl(x_min, x_max, dx, fmt, l1) > n_max ) {
	    copy_arr(labels, l0);
	    return;
	} else {
	    copy_arr(l0, l1);
	}

	dx *= 0.5;
	if ( mk_lbl(x_min, x_max, dx, fmt, l1) > n_max ) {
	    copy_arr(labels, l0);
	    return;
	} else {
	    copy_arr(l0, l1);
	}

	dx *= 0.4;
	if ( mk_lbl(x_min, x_max, dx, fmt, l1) > n_max ) {
	    copy_arr(labels, l0);
	    return;
	} else {
	    copy_arr(l0, l1);
	}

	dx *= 0.5;
    }
}

# Print labels from x_min to x_max with separation dx and print format fmt
# to a string. Assign the label coordinates and label strings to the labels
# array.  Each index in labels array will be an x coordinate. Array value will
# be the label to print there. Return the length of the string.

function mk_lbl(x_min, x_max, dx, fmt, labels,
	l, x0, n, n_lbl, lbl_str, lbl)
{
    for (l in labels) {
	delete labels[l];
    }
    n_lbl = ceil((x_max - x_min) / dx);
    x0 = floor(x_min / dx) * dx;
    x_min -= dx / 4;
    x_max += dx / 4;
    lbl_str = "";
    for (n = 0; n <= n_lbl; n++) {
	x = x0 + n * dx;
	if ( x >= x_min && x <= x_max ) {
	    lbl = sprintf(fmt, x);
	    labels[x] = lbl;
	    lbl_str = lbl_str " " lbl;
	}
    }
    return length(lbl_str) - 1;
}

# This function returns the next power of 10 greater than or equal to the
# magnitude of x.

function pow10(x) {
    if (x == 0.0) {
	return 1.0e-100;
    } else if (x > 0.0) {
	n = int(log(x) / log(10) + 0.5);
	return exp(n * log(10.0));
    } else {
	n = int(log(-x) / log(10) + 0.5);
	return -exp(n * log(10.0));
    }
}

# Functions for floor and ceiling
function floor(x) {
    return (x > 0) ? int(x) : int(x) - 1;
}
function ceil(x) {
    return (x > 0) ? int(x) + 1 : int(x);
}

# Copy src array to dest
function copy_arr(dest, src)
{
    for (i in dest) {
	delete dest[i];
    }
    for (i in src) {
	dest[i] = src[i];
    }
}

# Initialize parameters with bogus values or reasonable defaults
BEGIN {
    FS = "=";
    printing = 0;
    doc_width = 800.0;
    doc_height = "nan";
    top = 0.0;
    right = 0.0;
    bottom = 0.0;
    left = 0.0;
    x0 = "nan";
    x1 = "nan";
    y0 = "nan";
    y1 = "nan";
    x_fmt = "%g";
    y_fmt = "%g";
    font_size = 12.0;
    app_nm = "xyplot";
    err = "/dev/stderr";
}

# Set parameters from standard input
/title/ {
    title = $2;
}
/^ *doc_width *= *[0-9.Ee-]+ *$/ {
    doc_width = $2 + 0.0;
    if ( doc_width <= 0.0 ) {
	printf "%s: expected positive number for plot width,", app_nm > err;
	printf " got %s\n", $2 > err;
	exit 1;
    }
}
/^ *doc_height *= *[0-9.Ee-]+ *$/ {
    doc_height = $2 + 0.0;
    if ( doc_height <= 0.0 ) {
	printf "%s: expected positive number for height,", app_nm > err;
	printf "got %s\n", $2 > err;
	exit 1;
    }
}
/^ *top *= *[0-9.Ee-]+ *$/ {
    top = $2 + 0.0;
    if ( top < 0.0 ) {
	printf "%s: expected non-negative number" app_nm > err;
	printf " for top margin, got %s\n", $2 > err;
	exit 1;
    }
}
/^ *right *= *[0-9.Ee-]+ *$/ {
    right = $2 + 0.0;
    if ( right < 0.0 ) {
	printf "%s: expected non-negative number" app_nm > err;
	printf " for right margin, got %s\n", $2 > err;
	exit 1;
    }
}
/^ *bottom *= *[0-9.Ee-]+ *$/ {
    bottom = $2 + 0.0;
    if ( bottom < 0.0 ) {
	printf "%s: expected non-negative number" app_nm > err;
	printf " for bottom margin, got %s\n", $2 > err;
	exit 1;
    }
}
/^ *left *= *[0-9.Ee-]+ *$/ {
    left = $2 + 0.0;
    if ( left < 0.0 ) {
	printf "%s: expected non-negative number" app_nm > err;
	printf " for left margin, got %s\n", $2 > err;
	exit 1;
    }
}
/^ *x0 *= *[0-9.Ee-]+ *$/ {
    x0 = $2 + 0.0;
}
/^ *x1 *= *[0-9.Ee-]+ *$/ {
    x1 = $2 + 0.0;
}
/^ *y0 *= *[0-9.Ee-]+ *$/ {
    y0 = $2 + 0.0;
}
/^ *y1 *= *[0-9.Ee-]+ *$/ {
    y1 = $2 + 0.0;
}
/^ *font_sz *= *[0-9.Ee-]+ *$/ {
    font_sz = $2 + 0.0;
    if ( font_sz < 0.0 ) {
	printf "%s: expected non-negative number" app_nm > err;
	printf " for font_sz margin, got %s\n", $2 > err;
	exit 1;
    }
}
/^ *x_fmt *= *[0-9.Ee-]+ *$/ {
    x_fmt = $2;
}
/^ *y_fmt *= *[0-9.Ee-]+ *$/ {
    y_fmt = $2;
}

# Validate parameters and start plotting.
/start_plot/ {
    if ( x0 == "nan" ) {
	printf "%s: x0 not set\n", app_nm > err;
	exit 1;
    }
    if ( x1 == "nan" ) {
	printf "%s: x1 not set\n", app_nm > err;
	exit 1;
    }
    x_width = x1 - x0;
    if ( x_width <= 0 ) {
	printf "%s: plot width must be positive\n", app_nm > err;
	exit 1;
    }
    if ( y0 == "nan" ) {
	printf "%s: y0 not set\n", app_nm > err;
	exit 1;
    }
    if ( y1 == "nan" ) {
	printf "%s: y1 not set\n", app_nm > err;
	exit 1;
    }
    y_height = y1 - y0;
    if ( y_height <= 0 ) {
	printf "%s: plot height must be positive\n", app_nm > err;
	exit 1;
    }
    plot_width = doc_width - left - right;
    if ( doc_height == "nan" ) {
	plot_height = plot_width * y_height / x_width;
	doc_height = plot_height + top + bottom;
    } else {
	plot_height = doc_height - top - bottom;
    }

#   Initialize the SVG document
    printf "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n";
    printf "<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.0//EN\"\n";
    printf "    \"http://www.w3.org/TR/2001/REC-SVG-20010904/DTD/svg10.dtd\">\n";
    printf "<svg\n";
    printf "    width=\"%f\"\n", doc_width;
    printf "    height=\"%f\"\n", doc_height;
    printf "    xmlns=\"http://www.w3.org/2000/svg\"\n";
    printf "    xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n";
    if ( length(title) > 0 ) {
	printf "  <title>%s</title>\n", title;
    }
    printf "\n";

    printf "<script\n";
    printf "    type=\"application/ecmascript\"\n";
    printf "    xlink:href=\"xyplot.js\" />\n";

#   Define plot area rectangle
    printf "<defs>\n";
    printf "  <!-- Plot area rectangle -->\n";
    printf "  <rect\n";
    printf "      id=\"PlotRect\"\n";
    printf "      width=\"%f\"\n", plot_width;
    printf "      height=\"%f\" />\n", plot_height;
    printf "</defs>\n";

#   Define plot area clip path
    printf "<defs>\n";
    printf "  <!-- Clip path for plot area -->\n";
    printf "  <clipPath id=\"PlotArea\">\n";
    printf "    <use\n";
    printf "        xlink:href=\"#PlotRect\"\n";
    printf "        x=\"%f\"\n", left;
    printf "        y=\"%f\" />\n", top;
    printf "  </clipPath>\n";

#   X axis geometry and clip path.
    x_axis_left = left - 4.0 * font_sz;
    x_axis_top = top + plot_height;
    x_axis_width = plot_width + 8.0 * font_sz;
    x_axis_height = 3 * font_sz;
    printf "  <!-- Clip path for x axis labels -->\n";
    printf "  <clipPath id=\"xAxisClip\">\n";
    printf "    <rect\n";
    printf "        x=\"%f\"\n", x_axis_left;
    printf "        y=\"%f\"\n", x_axis_top;
    printf "        width=\"%f\"\n", x_axis_width;
    printf "        height=\"%f\"/>\n", x_axis_height;
    printf "  </clipPath>\n";

#   Y axis geometry and clip path.
    y_axis_left = left - 9.0 * font_sz;
    y_axis_top = top - font_sz;
    y_axis_width = 9.0 * font_sz;
    y_axis_height = plot_height + 3.0 * font_sz;
    printf "  <!-- Clip path for y axis labels -->\n";
    printf "  <clipPath id=\"yAxisClip\">\n";
    printf "    <rect\n";
    printf "        x=\"%f\"\n", y_axis_left;
    printf "        y=\"%f\"\n", y_axis_top;
    printf "        width=\"%f\"\n", y_axis_width;
    printf "        height=\"%f\" />\n", y_axis_height;
    printf "  </clipPath>\n";
    printf "</defs>\n";

#   Create plot area.
    printf "<!-- Clip path and SVG element for plot area -->\n";
    printf "<g clip-path=\"url(#PlotArea)\">\n";
    printf "  <svg\n";
    printf "      id=\"plot\"\n";
    printf "      x=\"%f\"\n", left;
    printf "      y=\"%f\"\n", top;
    printf "      width=\"%f\"\n", plot_width;
    printf "      height=\"%f\"\n", plot_height;
    printf "      viewBox=\"0.0 0.0 %f %f\"\n", x_width, y_height;
    printf "      preserveAspectRatio=\"none\"\n";
    printf "      onmousedown=\"start_plot_drag(evt)\"\n";
    printf "      onmousemove=\"cursor_loc(evt)\">\n";
    printf "\n";
    printf "    <!-- Fill in plot area background -->\n";
    printf "    <use\n";
    printf "        xlink:href=\"#PlotRect\"\n";
    printf "        x=\"0.0\"\n";
    printf "        y=\"0.0\"\n";
    printf "        fill=\"white\">\n";
    printf "    </use>\n";
    printf "\n"
    printf "    <!-- Flip y coordinates to make them Cartesian -->\n";
    printf "    <g transform=\"matrix(1.0 0.0 0.0 -1 %f %f)\">\n",
	   -x0, y0 + y_height;
    printf "\n";
    printf "<!-- Define elements in plot area -->\n";
    $0 = "";
    printing = 1;
}

# When done plotting. Terminate plot area. Draw axes and labels.
/end_plot/ {
    printf "\n";
    printf "<!-- Done defining elements in plot area -->\n"
    printf "\n";
    printf "      </g>\n";
    printf "\n"
    printf "  <!-- Terminate SVG element for plot area -->\n"
    printf "  </svg>\n";
    printf "<!-- Terminate clipping for plot area -->\n"
    printf "</g>\n";
    printf "\n";
    printf "<!-- Draw boundary around plot area -->\n";
    printf "<use\n";
    printf "    xlink:href=\"#PlotRect\"\n";
    printf "    x=\"%f\"\n", left;
    printf "    y=\"%f\"\n", top;
    printf "    fill=\"none\"\n";
    printf "    stroke=\"black\">\n";
    printf "</use>\n";
    printf "\n";

#   Draw and label x axis
    y_px = top + plot_height + font_sz;
    px_per_m = plot_width / x_width;
    axis_lbl(x0, x0 + x_width, x_fmt, plot_width / font_sz + 1, labels);
    printf "<!-- Clip area and svg element for x axis and labels -->\n";
    printf "<g clip-path=\"url(#xAxisClip)\">\n";
    printf "  <svg\n";
    printf "      id=\"xAxis\"\n";
    printf "      x=\"%f\"\n", x_axis_left;
    printf "      y=\"%f\"\n", x_axis_top;
    printf "      width=\"%f\"\n", x_axis_width;
    printf "      height=\"%f\"\n", x_axis_height;
    printf "      viewBox=\"%f %f %f %f\">\n",
	   x_axis_left, x_axis_top, x_axis_width, x_axis_height;
    for (x in labels) {
	x_px = left + (x - x0) * px_per_m;
	printf "  <text\n";
	printf "      x=\"%f\"\n", x_px;
	printf "      y=\"%f\"\n", y_px;
	printf "      font-size=\"%.1f\"\n", font_sz;
	printf "      text-anchor=\"middle\"\n";
	printf "      dominant-baseline=\"hanging\">\n";
	printf "    %s\n", labels[x];
	printf "  </text>\n";
    }
    printf "  </svg>\n";
    printf "</g>\n";
    printf "\n";

#   Draw and label y axis
    x_px = left - font_sz;
    px_per_m = plot_height / y_height;
    y1 = y0 + y_height;
    longest = 6;
    axis_lbl(y0, y1, y_fmt, plot_height / font_sz + 1, labels);
    printf "<!-- Clip area and svg element for y axis and labels -->\n";
    printf "<g\n";
    printf "    clip-path=\"url(#yAxisClip)\">\n";
    printf "  <svg\n";
    printf "	id=\"yAxis\"\n";
    printf "    x=\"%f\"\n", y_axis_left;
    printf "    y=\"%f\"\n", y_axis_top;
    printf "    width=\"%f\"\n", y_axis_width;
    printf "    height=\"%f\"\n", y_axis_height;
    printf "	viewBox=\"%f %f %f %f\">\n",
	   y_axis_left, y_axis_top, y_axis_width, y_axis_height;
    for (y in labels) {
	y_px = top + (y1 - y) * px_per_m;
	printf "  <text\n";
	printf "      x=\"%f\" y=\"%f\"\n", x_px, y_px;
	printf "      font-size=\"%.0f\"\n", font_sz;
	printf "      text-anchor=\"end\"\n";
	printf "      dominant-baseline=\"mathematical\">";
	printf "%s", labels[y];
	printf "  </text>\n";
	len = length(labels[y]);
	if ( len > longest ) {
	    longest = len;
	}
    }
    printf "  </svg>\n";
    printf "</g>\n";
    printf "\n";

    $0 = "";

}

/end/ {
    printing = 0;
}

# If printing pass input SVG to output.
{
    if ( printing ) {
	print;
    }
}

END {
    printf "<!-- Information bar -->\n";
    printf "<text id=\"cursor_loc\" x=\"%f\" y=\"%f\">x y</text>\n",
	   2.0 * font_sz, 2.0 * font_sz;
    printf "</svg>\n";
}