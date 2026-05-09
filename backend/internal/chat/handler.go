package chat

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

type WSHandler struct {
	manager  *ChatManager
	upgrader websocket.Upgrader
}

func NewWSHandler(manager *ChatManager) *WSHandler {
	return &WSHandler{
		manager: manager,
		upgrader: websocket.Upgrader{
			ReadBufferSize:  1024,
			WriteBufferSize: 1024,
			CheckOrigin: func(r *http.Request) bool {
				return true
			},
		},
	}
}

func (h *WSHandler) Handle(c *gin.Context) {
	conn, err := h.upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "websocket upgrade failed"})
		return
	}

	client := NewClient(h.manager, conn)
	h.manager.Register(client)

	go client.WritePump()
	go client.ReadPump()
}
