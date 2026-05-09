APP_NAME=copassistant

.PHONY: build run tidy

build:
	mkdir -p bin
	go build -o bin/$(APP_NAME) ./cmd/server

run:
	go run ./cmd/server

tidy:
	go mod tidy
