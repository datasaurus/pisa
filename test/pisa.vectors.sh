#!/bin/sh

printf '
stroke-width 0.005
scale 0.02
p 0.5 0.0 2.0 0.0
p 0.5 1.0 1.0 1.0
' \
| naki.awk							\
| pisa -d "Vectors" -l 40 -r 40 -t 40 -b 40 -w 1400 -f 12	\
    -p prefix.svg -s suffix.svg -y pisa.css			\
    -X "The abscissa" -Y "The ordinate"				\
    -- -1.2 1.2 -1.2 1.2

