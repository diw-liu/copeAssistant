APP_NAME=copassistant

.PHONY: build run tidy swagger

build:
	mkdir -p bin
	go build -o bin/$(APP_NAME) ./cmd/server

run:
	go run ./cmd/server

tidy:
	go mod tidy

swagger:
	go run github.com/swaggo/swag/cmd/swag@v1.16.6 init -g main.go -d cmd/server,internal/chat,internal/server -o docs
