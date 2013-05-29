# This function finds determines axis labels.
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

function axis_lbl(x_min, x_max, fmt, n_max, labels)
{
    # Put a tentative number of labels into l0.
    # Put more labels into l1. If l1 would need more than n_max
    # characters, return l0. Otherwise, copy l1 to l0 and try
    # a more populated l1.

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
	if ( mk_lbl(x_min, x_max, dx, fmt, l1) > n_max ) {
	    copy_arr(labels, l0);
	    return;
	} else {
	    copy_arr(l0, l1);
	}
    }
}

# Print labels from x_min to x_max with separation dx and print format fmt
# to a string. Assign the label coordinates and label strings to the labels
# array.  Each index in labels array will be an x coordinate. Array value will
# be the label to print there. Return the length of the string.
function mk_lbl(x_min, x_max, dx, fmt, labels)
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
