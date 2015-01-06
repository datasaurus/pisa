PREFIX = /usr/local/
BIN_DIR = ${PREFIX}/bin
EXECS = polyline pisa pisa.awk naki.awk

install : ${EXECS}
	mkdir -p ${BIN_DIR}
	for f in ${EXECS};do rm -f ${BIN_DIR}/$f;done
	cp -p ${EXECS} ${BIN_DIR}

clean :
	
