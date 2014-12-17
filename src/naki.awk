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
# xlink namespace must be invoked.
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

/^\s*stroke-width\s+/ {
    if ( NF != 2 ) {
	printf "No value given for line width.\n" > err;
	exit 1;
    }
    stroke_width = $2;
}

/^\s*scale\s+/ {
    if ( stroke_width == 0.0 ) {
	printf "Stroke width must be given before scale.\n" > err;
	exit 1;
    }
    if ( NF != 2 ) {
	printf "No value given for scale\n" > err;
	exit 1;
    }
    scale = $2;
    printf "<symbol\n";
    printf "    id=\"arrow\">\n";
    printf "  <g\n";
    printf "      class=\"arrow\"\n";
    printf "      stroke=\"black\"\n";
    printf "      stroke-width=\"%f\">\n", stroke_width;
    printf "    <line\n";
    printf "        x1=\"%f\"\n", -0.5 * scale;
    printf "        y1=\"%f\"\n", 0.0;
    printf "        x2=\"%f\"\n", 0.5 * scale;
    printf "        y2=\"%f\" />\n", 0.0;
    printf "    <line\n";
    printf "        x1=\"%f\"\n", 0.5 * scale;
    printf "        y1=\"%f\"\n", 0.0;
    printf "        x2=\"%f\"\n", 0.0;
    printf "        y2=\"%f\" />\n", 0.25 * scale;
    printf "    <line\n";
    printf "        x1=\"%f\"\n", 0.5 * scale;
    printf "        y1=\"%f\"\n", 0.0;
    printf "        x2=\"%f\"\n", 0.0;
    printf "        y2=\"%f\" />\n", -0.25 * scale;
    printf "  </g>\n";
    printf "</symbol>\n";
}

/^\s*p\s+/ {
    if ( NF != 5 ) {
	printf "Point must have x y u v\n" > err;
	exit 1;
    }
    x = $2;
    y = $3;
    u = $4;
    v = $5;
    printf "<use\n";
    printf "    xlink:href=\"#arrow\"\n";
    printf "    x=\"%f\"\n", x;
    printf "    y=\"%f\"\n", y;
    printf "    transform=\"matrix(%f %f %f %f %f %f)\" />\n",
	   u, v, -v, u, 0.0, 0.0;
}
