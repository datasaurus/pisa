#!/bin/sh
#
#	xyplot.head.sh --
#		Print svg code setting up an image with a plot area
#		to standard output. This output should be followed by
#		SVG code for the plot, and then output from xyplot.tail.sh.
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
# FONT_SZ		- font size for labels and captions, in pixels
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
if test -z $FONT_SZ
then
    echo $0: FONT_SZ not set
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
printf '<!-- Start contents of plot area -->\n'
exit 0
