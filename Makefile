.PHONY: etl fixtures check test

etl:        ## run the whole data pipeline
	python etl/run_all.py

fixtures:   ## regenerate SYNTHETIC fixtures
	python fixtures/make_fixtures.py

check:      ## what CI runs
	python -m compileall -q etl fixtures
	python fixtures/check_fixtures.py

test:       ## unit tests (once etl/tests/ exists)
	python -m pytest etl/tests
