#!/usr/bin/awk -f
#
# axis_lbl --
#	This program suggests labels for an axis.
#	It reads x_min x_max n_min from standard input.
#	If successful, program will print a list of at least n values
#	from x_min to x_max at intervals suitable for labeling an axis.

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

# Seek step that will be a multiple of 10, 5, or 2.
# Start with the power of 10 larger than the interval from x_min to x_max, then
# try smaller steps until there are at least n_lbl label points.
/[0-9e.-]+ [0-9e.-]+ [0-9]+/ {
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
    for (n = 0; n <= n_lbl; n++) {
	x = x0 + n * dx;
	if ( x >= x_min && x <= x_max ) {
	    printf("%g\n", x);
	}
    }
}
