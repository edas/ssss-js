pnpm:
	pnpm install --no-optional

test: pnpm
	pnpm test

html:
	git rev-parse --verify --short HEAD > version.txt
	./node_modules/vite/bin/vite.js build
	rm -f version.txt

all: test html

.DEFAULT_GOAL := all
.PHONY: all test pnpm
