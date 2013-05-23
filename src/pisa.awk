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
#	width svg_length
#	top svg_length
#	right svg_length
#	bottom svg_length
#	left svg_length
#	font_sz size
#	start_plot
#	end_plot
#
# Standard input may also include:
#
#	height svg_length
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
#	y_label		y axis label, centered below the y axis
#	caption		more text, centered below the x label.
#	start_plot	tells the process to just pass input to output.
#			Input should be SVG code for items in the plot.
#	end_plot	indicates no more plot input. The process prints
#			SVG code to finish the plot. Then it resumes
#			passing input to output, allowing additional
#			SVG elements.
#	end		indicates no more input. The process prints
#			SVG code to finish the document, and exits.

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

# floor and ceiling
function floor(x) {
    return (x > 0) ? int(x) : int(x) - 1;
}
function ceil(x) {
    return (x > 0) ? int(x) + 1 : int(x);
}

# Find at least n_min values from x_min to x_max with intervals suitable for
# axis labels.
#
# Initialize the interval dx to a power of 10 larger than the interval from
# x_max - x_min, then try smaller steps until there are at least n_lbl label
# points. The interval will be a multiple of 10, 5, or 2 times some power of 10.
#
# Return the points to label.

function axis_nlbl(x_min, x_max, n_min)
{
    x_min = $1;
    x_max = $2;
    n_lbl = $3;
    dx = pow10(x_max - x_min);
    while (1) {
	n = ceil((x_max - x_min) / dx);
	if ( n > n_lbl ) {
	    break;
	}
	dx *= 0.5;
	n = ceil((x_max - x_min) / dx);
	if ( n > n_lbl ) {
	    break;
	}
	dx *= 0.4;
	n = ceil((x_max - x_min) / dx);
	if ( n > n_lbl ) {
	    break;
	}
	dx *= 0.5;
    }
    n_lbl = n;
    x0 = floor(x_min / dx) * dx;
    x_min -= dx / 4;
    x_max += dx / 4;
    r = "";
    for (n = 0; n <= n_lbl; n++) {
	x = x0 + n * dx;
	if ( x >= x_min && x <= x_max ) {
	    r = r + sprintf(" %g\n", x);
	}
    }
    return r;
}

BEGIN {
    FS = "=";
    plotting = 0;
    width = "nan";
    height = "nan";
    top = "nan";
    right = "nan";
    bottom = "nan";
    left = "nan";
    x0 = "nan";
    dx = "nan";
    y0 = "nan";
    dy = "nan";
    font_size = "nan";
}
/width/ {
    width = $2;
}
/height/ {
    height = $2;
}
/top/ {
    top = $2;
}
/right/ {
    right = $2;
}
/bottom/ {
    bottom = $2;
}
/left/ {
    left = $2;
}
/x0/ {
    x0 = $2;
}
/dx/ {
    dx = $2;
}
/y0/ {
    y0 = $2;
}
/dy/ {
    dy = $2;
}
/font_sz/ {
    font_size = $2;
}
/x_label/ {
    $1 = "";
    x_label = $0;
}
/y_label/ {
    $1 = "";
    y_label = $0;
}
/caption/ {
    $1 = "";
    caption = $0;
}
/start_plot/ {
    if ( top == "nan" ) {
	print "top not set\n";
	exit 1;
    }
    if ( right == "nan" ) {
	print "right not set\n";
	exit 1;
    }
    if ( bottom == "nan" ) {
	print "bottom not set\n";
	exit 1;
    }
    if ( left == "nan" ) {
	print "left not set\n";
	exit 1;
    }
    if ( x0 == "nan" ) {
	print "x0 not set\n";
	exit 1;
    }
    if ( dx == "nan" ) {
	print "dx not set\n";
	exit 1;
    }
    if ( y0 == "nan" ) {
	print "y0 not set\n";
	exit 1;
    }
    if ( dy == "nan" ) {
	print "dy not set\n";
	exit 1;
    }
    if ( font_size == "nan" ) {
	print "font_size not set\n";
	exit 1;
    }
    if ( width == "nan" ) {
	print "width not set\n";
	exit 1;
    }
    if ( height == "nan" ) {
	height = width * dy / dx;
    }

    print "<?xml version=\"1.0\" encoding=\"UTF-8\"?>";
    print "<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.0//EN\"";
    print "    \"http://www.w3.org/TR/2001/REC-SVG-20010904/DTD/svg10.dtd\">";
    print "<svg ";
    printf "    width=\"%.1f\" height=\"%.1f\"\n",
	   left + width + right, top + height + bottom;
    print "    xmlns=\"http://www.w3.org/2000/svg\"";
    print "    xmlns:xlink=\"http://www.w3.org/1999/xlink\">";
    print ""

    print "<svg ";
    printf "    x=\"%.1f\" y=\"%.1f\"\n", left, top;
    printf "    width=\"%.1f\" height=\"%.1f\"\n", width, height;
    printf "    viewBox=\"0.0 0.0 %.1f %.1f\"\n", dx, dy;
    printf "    preserveAspectRatio=\"none\"\n>\n";

    printf "<clipPath id=\"PlotArea\">\n";
    printf "    <rect x=\"%.1f\" y=\"%.1f\"\n", x0, y0;
    printf "            width=\"%.1f\" height=\"%.1f\" />\n", dx, dy;
    print "</clipPath>"
    printf "<g transform=\"matrix(1 0 0 -1 %.1f %.1f)\"", -x0, y0 + dy;
    print " clip-path=\"url(#PlotArea)\">"

    $0 = "";
    plotting = 1;
}
/end_plot/ {
    print "</g>";
    print "</svg>";
    printf "<rect x=\"%.1f\" y=\"%.1f\"\n", left, top
    printf "    width=\"%.1f\" height=\"%.1f\"\n", width, height
    printf "    fill=\"none\" stroke=\"black\" />\n"
    $0 = "";
    plotting = 0;
}
/end/ {
    print "</svg>";
}
{
    if ( plotting ) {
	print;
    }
}
