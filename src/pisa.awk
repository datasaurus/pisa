#!/usr/bin/awk -f
#
# Initialize a SVG document that defines a plot area with axes and labels.
#
# SVG code concatatenated to output from this script will be
# rendered in a cartesian coordinate system with origin at x0, y0
# at the lower left, x increasing right, y increasing upward.
#
# SVG code for the plot area MUST be terminated with "</g></svg>"
#
# Subsequent svg code will be rendered in the initial coordinate
# system of the document.
#
# The document MUST be terminated with "</svg>"
#
# Standard input must include, in any order:
#
#	x0 plot_coord
#	dx plot_coord
#	y0 plot_coord
#	dy plot_coord
#	width pixels
#	top pixels
#	right pixels
#	bottom pixels
#	left pixels
#	font_sz size
#	start_plot
#	end_plot
#
# Standard input may also include:
#
#	height pixels
#	x_label string ...
#	y_label string ...
#	caption string ...
#
# where:
#	
#	x0		x coordinate of left edge of plot in plot coordinates
#	dx 		plot width in plot coordinates
#	y0		y coordinate of bottom edge of plot in plot coordinates
#	dy		plot height in plot coordinates
#	width		width of the plot, in display units
#	height		height of the plot, in display units. If not given,
#			height will be set to width * dy / dx;
#	top		size of the area above the plot, in display units
#	right		size of the area right of the plot, in display units
#	bottom		size of the area below the plot, in display units
#	left		size of the area left of the plot, in display units
#			Document width will be left + width + right
#			Document height will be top + height + bottom
#	font_sz		font size for labels, in display units
#	x_label		x axis label, centered below the x axis
#	x_fmt		format for x axis labels
#	y_label		y axis label, centered below the y axis
#	y_fmt		format for y axis labels
#	caption		more text, centered below the x label.
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

# This function finds at determines axis label locations.
#	x_min	start of axis.
#	x_max	end of axis.
#	fmt 	label format
#	n_max	number of characters allowed for all labels
#
# Initialize the interval dx to a power of 10 larger than the interval from
# x_max - x_min, then try smaller steps until all of the labels with a space
# character between them fit into n_max characters. The interval will be a
# multiple of 10, 5, or 2 times some power of 10.
#
# Label coordinates and strings are returned in labels. Each index is an
# x coordinate. Corresponding value is the string to print there.

function axis_lbl(x_min, x_max, fmt, n_max, labels,
	l0, l1, dx, t)
{
    # Put a tentative number of labels into l0.
    # Put more labels into l1. If l1 would need more than n_max
    # characters, return l0. Otherwise, copy l1 to l0 and try
    # a more populated l1.

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
    width = 800.0;
    height = "nan";
    top = 0.0;
    right = 0.0;
    bottom = 0.0;
    left = 0.0;
    x0 = "nan";
    dx = "nan";
    y0 = "nan";
    dy = "nan";
    x_fmt = "%g";
    y_fmt = "%g";
    font_size = 12.0;
}

# Set parameters from standard input
/width/ {
    width = $2 + 0.0;
    if ( width <= 0.0 ) {
	printf "width must be positive\n";
	exit 1;
    }
}
/height/ {
    height = $2 + 0.0;
    if ( height <= 0.0 ) {
	printf "height must be positive\n";
	exit 1;
    }
}
/top/ {
    top = $2 + 0.0;
    if ( top <= 0.0 ) {
	printf "top margin must be positive\n";
	exit 1;
    }
}
/right/ {
    right = $2 + 0.0;
    if ( right <= 0.0 ) {
	printf "right margin must be positive\n";
	exit 1;
    }
}
/bottom/ {
    bottom = $2 + 0.0;
    if ( bottom <= 0.0 ) {
	printf "bottom margin must be positive\n";
	exit 1;
    }
}
/left/ {
    left = $2 + 0.0;
    if ( left <= 0.0 ) {
	printf "left margin must be positive\n";
	exit 1;
    }
}
/x0/ {
    x0 = $2 + 0.0;
}
/dx/ {
    dx = $2 + 0.0;
}
/y0/ {
    y0 = $2 + 0.0;
}
/dy/ {
    dy = $2 + 0.0;
}
/font_sz/ {
    font_sz = $2 + 0.0;
    if ( font_sz <= 0.0 ) {
	printf "font size must be positive\n";
	exit 1;
    }
}
/x_label/ {
    $1 = "";
    x_label = $0;
}
/x_fmt/ {
    x_fmt = $2;
}
/y_label/ {
    $1 = "";
    y_label = $0;
}
/y_fmt/ {
    y_fmt = $2;
}
/caption/ {
    $1 = "";
    caption = $0;
}

# Print SVG that initializes document and plot area. Start plotting.
/start_plot/ {
    if ( x0 == "nan" ) {
	printf "x0 not set\n";
	exit 1;
    }
    if ( dx == "nan" ) {
	printf "dx not set\n";
	exit 1;
    }
    if ( dx == 0.0 ) {
	printf "Plot width must be non-zero\n";
	exit 1;
    }
    if ( y0 == "nan" ) {
	printf "y0 not set\n";
	exit 1;
    }
    if ( dy == "nan" ) {
	printf "dy not set\n";
	exit 1;
    }
    if ( dy == 0.0 ) {
	printf "Plot height must be non-zero\n";
	exit 1;
    }
    if ( height == "nan" ) {
	height = width * dy / dx;
    }

    printf "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n";
    printf "<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.0//EN\"\n";
    printf "    \"http://www.w3.org/TR/2001/REC-SVG-20010904/DTD/svg10.dtd\"";
    printf ">\n";
    printf "<svg \n";
    printf "    width=\"%.1f\" height=\"%.1f\"\n",
	   left + width + right, top + height + bottom;
    printf "    xmlns=\"http://www.w3.org/2000/svg\"\n";
    printf "    xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n";
    printf ""

    printf "<svg \n";
    printf "    x=\"%.1f\" y=\"%.1f\"\n", left, top;
    printf "    width=\"%.1f\" height=\"%.1f\"\n", width, height;
    printf "    viewBox=\"0.0 0.0 %.1f %.1f\"\n", dx, dy;
    printf "    preserveAspectRatio=\"none\"\n>\n";

    printf "<clipPath id=\"PlotArea\">\n";
    printf "    <rect x=\"%.1f\" y=\"%.1f\"\n", x0, y0;
    printf "            width=\"%.1f\" height=\"%.1f\" />\n", dx, dy;
    printf "</clipPath>"
    printf "<g transform=\"matrix(1 0 0 -1 %.1f %.1f)\"", -x0, y0 + dy;
    printf " clip-path=\"url(#PlotArea)\">"

    $0 = "";
    printing = 1;
}

# Done plotting. Terminate plot area. Draw axes and labels.
/end_plot/ {
    printf "</g>\n";
    printf "</svg>\n";
    printf "<rect x=\"%.1f\" y=\"%.1f\"\n", left, top
    printf "    width=\"%.1f\" height=\"%.1f\"\n", width, height
    printf "    fill=\"none\" stroke=\"black\" />\n"

#   Draw and label x axis
    y_px = top + height + font_sz;
    px_per_m = width / dx;
    axis_lbl(x0, x0 + dx, x_fmt, width / font_sz + 1, labels);
    for (x in labels) {
	x_px = left + (x - x0) * px_per_m;
	printf "<text\n";
	printf "    x=\"%.1f\" y=\"%.1f\"\n", x_px, y_px;
	printf "    font-size=\"%.0f\"\n", font_sz;
	printf "    text-anchor=\"middle\"\n";
	printf "    dominant-baseline=\"hanging\">";
	printf "%s", labels[x];
	printf "</text>\n";
    }
    x_px = left + width / 2;
    y_px = top + height + 5 * font_sz;
    printf "<text\n";
    printf "    x=\"%.1f\" y=\"%.1f\"\n", x_px, y_px;
    printf "    font-size=\"%.0f\"\n", font_sz;
    printf "    text-anchor=\"middle\">";
    printf "%s", x_label;
    printf "</text>\n";

#   Draw and label y axis
    x_px = left - font_sz;
    px_per_m = height / dy;
    y1 = y0 + dy;
    longest = 6;
    axis_lbl(y0, y1, y_fmt, height / font_sz + 1, labels);
    for (y in labels) {
	y_px = top + (y1 - y) * px_per_m;
	printf "<text\n";
	printf "    x=\"%.1f\" y=\"%.1f\"\n", x_px, y_px;
	printf "    font-size=\"%.0f\"\n", font_sz;
	printf "    text-anchor=\"end\"\n";
	printf "    dominant-baseline=\"mathematical\">";
	printf "%s", labels[y];
	printf "</text>\n";
	len = length(labels[y]);
	if ( len > longest ) {
	    longest = len;
	}
    }
    x_px = left - longest * font_sz;
    y_px = top + height / 2;
    printf "<g transform=\"matrix(0.0, -1.0, 1.0, 0.0,"
    printf " %.1f, %.1f)\">\n", x_px, y_px;
    printf "    <text\n";
    printf "        x=\"0.0\" y=\"0.0\"\n";
    printf "        font-size=\"%.0f\"\n", font_sz;
    printf "        text-anchor=\"middle\">";
    printf "%s", y_label;
    printf "</text>\n";
    printf "</g>\n"

#   Figure caption
    x_px = left + width / 2;
    y_px = top + height + 8.5 * font_sz;
    printf "<text\n";
    printf "    x=\"%.1f\" y=\"%.1f\"\n", x_px, y_px;
    printf "    font-size=\"%.0f\"\n", font_sz;
    printf "    text-anchor=\"middle\">";
    printf "%s", caption;
    printf "</text>\n";

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
    printf "</svg>\n";
}
