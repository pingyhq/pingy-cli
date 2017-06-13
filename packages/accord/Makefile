build:
	cp -R lib src
	./node_modules/coffee-script/bin/coffee -c lib
	find lib -iname "*.coffee" -exec rm '{}' ';'

unbuild:
	rm -rf lib
	mv src lib

publish:
	make build
	npm publish .
	make unbuild
