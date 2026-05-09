package server

import (
	"copassistant/internal/chat"

	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

func NewRouter(manager *chat.ChatManager) *gin.Engine {
	router := gin.Default()

	wsHandler := chat.NewWSHandler(manager)
	router.GET("/ws", wsHandler.Handle)
	router.GET("/healthz", Healthz)
	router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	return router
}
