#!/bin/sh
# Make an interactive web page with pisa and pisa.js.

printf '<!DOCTYPE html>
<html>
<head>
<title>Plot sin(x^2)</title>
<meta charset="UTF-8">
<script src="pisa.js"></script>
</head>
<body>
'

awk 'BEGIN {
    pi = atan2(0.0, -1.0);
    dx = 2.0 * pi / 500;
    for (x = -3.0 * pi; x <= 3.0 * pi; x += dx) {
	printf "%f %f\n", x, sin(x * x);
    }
}' \
| polyline 'id="sinx2" stroke="black" stroke-width="0.01" fill="none"'	\
| pisa -d "inline" -l 40 -r 40 -t 40 -b 40 -w 1400 -f 12		\
    -s suffix.svg -y pisa.css -X "The abscissa" -Y "The ordinate"	\
    -- -3.1415927 3.1415927 -1.2 1.2

printf '
<div>
<label>ZOOM</label>
<button id="zoom_in">IN</button>
<button id="zoom_out">OUT</button>
</div>
<p id="cursor_loc">Cursor: 0 0</p>

'

printf '
</body>
</html>
'
