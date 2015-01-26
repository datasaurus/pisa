#!/bin/sh

awk 'BEGIN {
    pi = atan2(0.0, -1.0);
    dx = 2.0 * pi / 500;
    for (x = -3.0 * pi; x <= 3.0 * pi; x += dx) {
	printf "%f %f\n", x, sin(x * x);
    }
}' \
| polyline 'id="sinx2" stroke="black" stroke-width="0.01" fill="none"'	\
| pisa -d "Plot sin(x^2)" -l 40 -r 40 -t 40 -b 40 -w 1400 -f 12		\
    -p prefix.svg -s pisa.buttons.svg -s suffix.svg -y pisa.css		\
    -X "The abscissa" -Y "The ordinate"					\
    -- -3.1415927 3.1415927 -1.2 1.2

