package main

import (
	"log"
	"os"

	"copassistant/internal/ai"
	"copassistant/internal/chat"
	"copassistant/internal/server"
)

func main() {
	apiKey := os.Getenv("OPENAI_API_KEY")

	aiService := ai.NewOpenAIService(apiKey)
	manager := chat.NewChatManager(aiService)
	go manager.Run()

	router := server.NewRouter(manager)
	if err := router.Run(":8080"); err != nil {
		log.Fatalf("server failed to start: %v", err)
	}
}
