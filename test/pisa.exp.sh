#!/bin/sh

awk 'BEGIN {
    dx = 3.0 / 500;
    for (x = -3.0; x <= 6.0; x += dx) {
	printf "%f %f\n", x, exp(-x);
    }
}' \
| polyline 'id="expm" stroke="black" stroke-width="0.01" fill="none"'	\
| pisa -d "Plot exp(-x)" -l 40 -r 40 -t 40 -b 40 -w 800 -f 12		\
    -p prefix.svg -s suffix.svg -y pisa.css -X 'x' -Y 'exp(-x)'	\
    -- 0.0 3.0 1.0 -1.0

