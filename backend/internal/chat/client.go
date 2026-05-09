package chat

import (
	"encoding/json"
	"log"
	"strings"
	"time"

	"github.com/gorilla/websocket"
)

const (
	writeWait      = 10 * time.Second
	pongWait       = 60 * time.Second
	pingPeriod     = (pongWait * 9) / 10
	maxMessageSize = 1024
)

type Client struct {
	manager *ChatManager
	conn    *websocket.Conn
	send    chan []byte
}

type inboundPayload struct {
	Type    string `json:"type"`
	Content string `json:"content"`
	Mood    string `json:"mood"`
}

func NewClient(manager *ChatManager, conn *websocket.Conn) *Client {
	return &Client{
		manager: manager,
		conn:    conn,
		send:    make(chan []byte, 256),
	}
}

func (c *Client) ReadPump() {
	defer func() {
		c.manager.Unregister(c)
		_ = c.conn.Close()
	}()

	c.conn.SetReadLimit(maxMessageSize)
	_ = c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error {
		return c.conn.SetReadDeadline(time.Now().Add(pongWait))
	})

	for {
		_, message, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("websocket read error: %v", err)
			}
			break
		}

		var payload inboundPayload
		if err := json.Unmarshal(message, &payload); err != nil {
			c.manager.HandleProtocolError(c, "Invalid websocket payload. Expected JSON.")
			continue
		}

		msgType := strings.TrimSpace(payload.Type)
		switch msgType {
		case "message":
			content := strings.TrimSpace(payload.Content)
			if content == "" {
				c.manager.HandleProtocolError(c, "Message content cannot be empty.")
				continue
			}
			c.manager.HandleUserMessage(c, content)
		case "context":
			mood := strings.TrimSpace(payload.Mood)
			if mood == "" {
				c.manager.HandleProtocolError(c, "Context mood cannot be empty.")
				continue
			}
			c.manager.HandleContextSelection(c, mood)
		default:
			c.manager.HandleProtocolError(c, "Unknown message type.")
		}
	}
}

func (c *Client) WritePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		_ = c.conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.send:
			_ = c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				_ = c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			if err := c.conn.WriteMessage(websocket.TextMessage, message); err != nil {
				return
			}
		case <-ticker.C:
			_ = c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}
