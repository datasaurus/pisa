#!/usr/bin/awk -f
#
# axis_dlbl --
#	This program suggests labels for an axis.
#	It reads x_min x_max dx from standard input.
#	If successful, program will print a list of values
#	containing x_min and x_max at interval dx

function floor(x) {
    return (x > 0) ? int(x) : int(x) - 1;
}

# Seek step that will be a multiple of 10, 5, or 2.
# Start with the power of 10 larger than the interval from x_min to x_max, then
# try smaller steps until there are at least n_lbl label points.
/[0-9e.-]+ [0-9e.-]+ [0-9]+/ {
    x_min = $1;
    x_max = $2;
    dx = $3;
    for (x = floor(x_min / dx) * dx; x < x_max + 0.125 * dx; x += dx) {
	if ( x >= x_min && x <= x_max ) {
	    printf("%g\n", x);
	}
    }
}
