#!/bin/sh
#
#	xyplot.sh --
#		Produce svg code for a image with a plot area.
#
# If prints the start of a svg file to standard output. The svg code
# defines an image with a plot area, axes, and captions.
#
# The following environment variables describe the plot area. Final image will
# have plot area plus axes, labels, and margins, so final image area will be
# larger than plot area.
# PLOT_X0_M		- real world x coordinate of plot origin, meters
# PLOT_Y0_M		- real world y coordinate of plot origin, meters
# PLOT_WIDTH_M		- distance in real world meters corresponding to
#			  PLOT_WIDTH_PX.
# PLOT_WIDTH_PX		- width of the plot on the screen, pixels.
# PLOT_HEIGHT_PX	- height of the plot on the screen, pixels.
#			  Thus, scale = PLOT_WIDTH_M / PLOT_WIDTH_PX
#
# The following environment variables describe elements around the plot area.
# FONT_SZ		- font size for labels and captions, in pixels
# DLBL			- axis label spacing, meters
# NLBL			- minimum number of axis labels. If present,
#			  overrides DLBL.
# X_LABEL		- label for x axis, will go under x axis.
# Y_LABEL		- label for y axis, will go to left of y axis, rotated.
# CAPTION		- caption, at bottom of plot
#
# axis_dlbl.awk or axis_nlbl.awk must be in command search path.
#
########################################################################

# Margins
left=120
top=80

if test -z $PLOT_X0_M
then
    echo $0: PLOT_X0_M not set
    exit 1
fi
if test -z $PLOT_Y0_M
then
    echo $0: PLOT_Y0_M not set
    exit 1
fi
if test -z $PLOT_WIDTH_M
then
    echo $0: PLOT_WIDTH_M not set
    exit 1
fi
if test -z $PLOT_WIDTH_PX
then
    echo $0: PLOT_WIDTH_PX not set
    exit 1
fi
if test -z $PLOT_HEIGHT_PX
then
    echo $0: PLOT_HEIGHT_PX not set
    exit 1
fi
if test -z $DLBL$NLBL
then
    echo $0: Must set either DLBL or NLBL
    exit 1
fi

plot_height_m=`echo "$PLOT_HEIGHT_PX / $PLOT_WIDTH_PX * $PLOT_WIDTH_M" | bc -l`
px_per_m=`echo "$PLOT_WIDTH_PX / $PLOT_WIDTH_M" | bc -l`

########################################################################
#    Create SVG element for the image (plot area + labels + margins)   #
########################################################################

svg_width=`echo "$left + $PLOT_WIDTH_PX + 32 * $FONT_SZ + 40" | bc -l`
svg_height=`echo "$top + $PLOT_HEIGHT_PX + 9 * $FONT_SZ" | bc -l`

printf '<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.0//EN"
    "http://www.w3.org/TR/2001/REC-SVG-20010904/DTD/svg10.dtd">
<svg width="%.1f" height="%.1f"
    xmlns="http://www.w3.org/2000/svg"
    xmlns:xlink="http://www.w3.org/1999/xlink">\n\n' $svg_width $svg_height

printf '<desc>
This is the outermost svg element. It contains the plot, axes, labels,
and margins.
</desc>
'

########################################################################
#               Create SVG element for the plot area                   #
########################################################################

printf '
<svg
    x="%.1f" y="%.1f"
    width="%.1f" height="%.1f"
    viewBox="%.1f %.1f %.1f %.1f"\n\n>'		\
    $left $top					\
    $PLOT_WIDTH_PX $PLOT_HEIGHT_PX		\
    $PLOT_X0_M $PLOT_Y0_M $PLOT_WIDTH_M $plot_height_m
printf '<desc>This element contains the plotted area.</desc>'
printf '<g transform="matrix(1 0 0 -1 0 %.1f)">\n' $plot_height_m
printf '<!-- Start contents of plot area -->'
printf '<!-- End contents of plot area -->'
printf '</g>\n'
printf '</svg>\n'

########################################################################
#                       Make labels and axes                           #
########################################################################

printf '<rect x="%.1f" y="%.1f" width="%.1f" height="%.1f" '\
'fill="none" stroke="black" />\n' $left $top $PLOT_WIDTH_PX $PLOT_HEIGHT_PX

# If present, use DLBL.
if test $DLBL
then
    DLBL=`echo "$DLBL" | bc -l`
else
    n_label=${NLBL:-"3"}
fi

# Label x axis
plot_x1_m=`echo "$PLOT_X0_M + $PLOT_WIDTH_M" | bc -l`
{
    if test $DLBL
    then
	echo Plotting axes with DLBL
	echo $PLOT_X0_M $plot_x1_m $DLBL | axis_dlbl.awk
    else
	echo Plotting axes with NLBL
	echo $PLOT_X0_M $plot_x1_m $n_label | axis_nlbl.awk
    fi
} | awk -v left=$left -v top=$top			\
	-v PLOT_HEIGHT_PX=$PLOT_HEIGHT_PX		\
	-v px_per_m=$px_per_m				\
	-v x0_m=$PLOT_X0_M				\
	-v FONT_SZ=$FONT_SZ '
    {
	x_m = $0
	printf "<text "
	printf "x=\"%.1f\" ", left + (x_m - x0_m) * px_per_m
	printf "y=\"%.1f\" ",
		top + ENVIRON["PLOT_HEIGHT_PX"] + ENVIRON["FONT_SZ"] / 2
	printf "font-size=\"%.0f\" ", FONT_SZ
	printf "text-anchor=\"middle\" "
	printf "dominant-baseline=\"hanging\">"
	printf "%.1f", x_m / 1000
	printf "</text>\n"
    }
'
x=`echo "$left + $PLOT_WIDTH_PX / 2" | bc -l`
y=`echo "$top + $PLOT_HEIGHT_PX + 4 * $FONT_SZ" | bc -l`
printf '<text x="%.1f" y="%.1f" ' $x $y
printf 'font-size="%.0f" ' $FONT_SZ
printf 'text-anchor="middle">'
printf '%s' "$X_LABEL"
printf '</text>\n'

# Caption
x=`echo "$left + $PLOT_WIDTH_PX / 2" | bc -l`
y=`echo "$top + $PLOT_HEIGHT_PX + 7 * $FONT_SZ" | bc -l`
printf '<text x="%.1f" y="%.1f" ' $x $y
printf 'font-size="%.0f" ' $FONT_SZ
printf 'text-anchor="middle">' $x $y
printf '%s\n' $CAPTION
printf '</text>'
y=`echo "$top + $PLOT_HEIGHT_PX + 8.5 * $FONT_SZ" | bc -l`
printf '<text x="%.1f" y="%.1f" ' $x $y
printf 'font-size="%.0f" ' $FONT_SZ
printf 'text-anchor="middle">' $x $y
printf '%s' "$CAPTION"
printf '</text>'

# Label y axis
plot_y1_m=`echo "$PLOT_Y0_M + $plot_height_m" | bc -l`
{
    if test $DLBL
    then
	echo $PLOT_Y0_M $plot_y1_m $DLBL | axis_dlbl.awk
    else
	echo $PLOT_Y0_M $plot_y1_m $n_label | axis_nlbl.awk
    fi
} | awk -v left=$left -v top=$top			\
	-v px_per_m=$px_per_m				\
	-v y_max_m=$plot_y1_m				\
	-v FONT_SZ=$FONT_SZ '
    {
	y_m = $0
	printf "<text "
	printf "x=\"%.1f\" ", left - FONT_SZ / 2
	printf "y=\"%.1f\" ", top + (y_max_m - y_m) * px_per_m
	printf "font-size=\"%.0f\" ", FONT_SZ
	printf "text-anchor=\"end\" "
	printf "dominant-baseline=\"mathematical\">"
	printf "%.1f", y_m / 1000
	printf "</text>\n"
    }
'
x=`echo "$left - 4 * $FONT_SZ" | bc -l`
y=`echo "$top + $PLOT_HEIGHT_PX / 2" | bc -l`
printf '<text x="0" y="0" '
printf 'font-size="%.0f" ' $FONT_SZ
printf 'transform="translate(%.1f,%.1f) rotate(-90.0)">' $x $y
printf '%s' "$Y_LABEL"
printf '</text>\n'

########################################################################
#                   End SVG element for entire image                   #
########################################################################

printf "</svg>\n"
exit 0
