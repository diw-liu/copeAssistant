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

// Handle godoc
// @Summary WebSocket chat handshake
// @Description Upgrades HTTP connection to WebSocket for real-time chat messaging
// @Tags chat
// @Produce json
// @Success 101 {string} string "Switching Protocols"
// @Failure 400 {object} map[string]string
// @Router /ws [get]
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
