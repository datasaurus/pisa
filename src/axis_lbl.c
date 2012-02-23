/*
   -	axis_lbl.c --
   -		Suggest labels for an axis
   -
   .	Usage:
   .		axis_lbl x_min x_max n [fmt]
   .	If successful, program will print a list of at least n values
   .	from x_min to x_max at intervals suitable for labeling an axis.
   .	If given, output will be in printf style format fmt.
   .
 */

#include <stdlib.h>
#include <string.h>
#include <stdio.h>
#include <math.h>
#include <float.h>

/*
   This function returns the next power of 10 greater than or equal to the
   magnitude of x.
 */

double pow10(double);
double pow10(double x) {
    int n = (x == 0.0) ? DBL_MIN_10_EXP : ceil(log10(fabs(x)));
    return exp(n * log(10.0));
}

int main(int argc, char *argv[])
{
    char *cmd = argv[0],
	 *x_min_s, *x_max_s, *n_lbl_s;	/* Command line arguments */
    double x_min, x_max;		/* Minimum and maximum x */
    double x;				/* Value along axis */
    double x0;				/* Location of first label */
    double dx;				/* Step between axis labels */
    char *fmt;				/* Output format */
    int n_lbl;				/* Desired number of labels */
    int n;				/* Proposed number of labels */

    /*
       Parse command line
     */

    if ( argc == 4 ) {
	x_min_s = argv[1];
	x_max_s = argv[2];
	n_lbl_s = argv[3];
	fmt = "%g";
    } else if ( argc == 5 ) {
	x_min_s = argv[1];
	x_max_s = argv[2];
	n_lbl_s = argv[3];
	fmt = argv[4];
    } else {
	fprintf(stderr, "%s x_min x_max n [fmt]\n", cmd);
	exit(EXIT_FAILURE);
    }
    if ( sscanf(x_min_s, "%lf", &x_min) != 1 ) {
	fprintf(stderr, "%s: expected float value for x_min, got %s\n",
		cmd, x_min_s);
	exit(EXIT_FAILURE);
    }
    if ( sscanf(x_max_s, "%lf", &x_max) != 1 ) {
	fprintf(stderr, "%s: expected float value for x_max, got %s\n",
		cmd, x_max_s);
	exit(EXIT_FAILURE);
    }
    if ( sscanf(n_lbl_s, "%d", &n_lbl) != 1 ) {
	fprintf(stderr, "%s: expected integer for number of labels, got %s\n",
		cmd, n_lbl_s);
	exit(EXIT_FAILURE);
    }
    if ( !(x_max > x_min) ) {
	fprintf(stderr, "%s: x_max must be greater than x_min.\n", cmd);
	exit(EXIT_FAILURE);
    }

    /*
       Determine step between labels. Start with the power of 10 larger
       than the interval, then decrease steps until there are at least
       the desired number of labels.
     */

    dx = pow10(x_max - x_min);
    while (1) {
	n = ceil((x_max - x_min) / dx);
	if ( n >= n_lbl ) {
	    break;
	}
	dx *= 0.5;	/* Step by fives */
	n = ceil((x_max - x_min) / dx);
	if ( n >= n_lbl ) {
	    break;
	}
	dx *= 0.4;	/* Step by twos */
	n = ceil((x_max - x_min) / dx);
	if ( n >= n_lbl ) {
	    break;
	}
	dx *= 0.5;	/* Step by ones => drop to next power of ten */
    }

    /*
       Print output
     */

    for (n_lbl = n, n = 0, x0 = floor(x_min / dx) * dx; n <= n_lbl; n++) {
	x = x0 + n * dx;
	if ( x >= x_min && x <= x_max ) {
	    printf(fmt, x);
	    printf(" ");
	}
    }
    printf("\n");

    return EXIT_SUCCESS;
}
