package server

import (
	"copassistant/internal/chat"

	"github.com/gin-gonic/gin"
)

func NewRouter(manager *chat.ChatManager) *gin.Engine {
	router := gin.Default()

	wsHandler := chat.NewWSHandler(manager)
	router.GET("/ws", wsHandler.Handle)
	router.GET("/healthz", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	return router
}
