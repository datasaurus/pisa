#!/usr/bin/awk -f
#
#	naki.awk --
#		Create SVG code for vector arrows
#
################################################################################
#
# Copyright (c) 2014, Gordon D. Carrie. All rights reserved.
# 
# Redistribution and use in source and binary forms, with or without
# modification, are permitted provided that the following conditions
# are met:
# 
#     * Redistributions of source code must retain the above copyright
#     notice, this list of conditions and the following disclaimer.
#     * Redistributions in binary form must reproduce the above copyright
#     notice, this list of conditions and the following disclaimer in the
#     documentation and/or other materials provided with the distribution.
# 
# THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
# "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
# LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
# A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
# HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
# SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED
# TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
# PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
# LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
# NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
# SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
#
# Please send feedback to dev0@trekix.net
#
# $Revision: $ $Date: $
#
################################################################################
#
# Standard input must include:
#
#	scale float
#	p float float float float
#
# where:
#	scale	specifies SVG units per vector unit.
#	p	identifies a point. Must be followed by x y u v as floats.
#		x y specify SVG coordinates. u and v specify horizontal
#		and vertical vector components.
#
################################################################################

# Initialize parameters with bogus values or reasonable defaults
BEGIN {
    scale = 1.0;
    stroke_width = -1.0;
    err = "/dev/stderr";
}

/^[ 	]*stroke-width[ 	]+/ {
    if ( NF != 2 ) {
	printf "No value given for line width.\n" > err;
	exit 1;
    }
    stroke_width = $2;
}

/^[ 	]*scale[ 	]+/ {
    if ( stroke_width == 0.0 ) {
	printf "Stroke width must be given before scale.\n" > err;
	exit 1;
    }
    if ( NF != 2 ) {
	printf "No value given for scale\n" > err;
	exit 1;
    }
    scale = $2;
    printf "<defs>\n";
    printf "  <marker\n";
    printf "      id=\"arrow\" class=\"arrow\"\n";
    printf "      viewBox=\"0 0 10 10\"\n";
    printf "      refX=\"0\"\n";
    printf "      refY=\"5\"\n";
    printf "      orient=\"auto\">\n";
    printf "      <path d=\"M 0 0 L 10 5 L 0 10 z\" />\n";
    printf "  </marker>\n";
    printf "</defs>\n\n";
}

/^[ 	]*p[ 	]+/ {
    if ( NF != 5 ) {
	printf "Point must have x y u v\n" > err;
	exit 1;
    }
    x = $2;
    y = $3;
    u = $4;
    v = $5;
    printf "<line\n";
    printf "    x1=\"%f\"\n", x - 0.5 * scale * u;
    printf "    y1=\"%f\"\n", y - 0.5 * scale * v;
    printf "    x2=\"%f\"\n", x + 0.5 * scale * u;
    printf "    y2=\"%f\"\n", y + 0.5 * scale * v;
    printf "    stroke=\"black\"";
    printf "    stroke-width=\"%f\"", stroke_width;
    printf "    marker-end=\"url(#arrow)\"";
    printf " />\n";
}
