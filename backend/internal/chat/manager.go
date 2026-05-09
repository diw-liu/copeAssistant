package chat

import (
	"context"
	"log"
)

type AIResponder interface {
	GenerateReply(ctx context.Context, userMessage string) (string, error)
}

type inboundMessage struct {
	client  *Client
	message string
}

type ChatManager struct {
	clients    map[*Client]bool
	register   chan *Client
	unregister chan *Client
	broadcast  chan []byte
	inbound    chan inboundMessage
	ai         AIResponder
}

func NewChatManager(ai AIResponder) *ChatManager {
	return &ChatManager{
		clients:    make(map[*Client]bool),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		broadcast:  make(chan []byte),
		inbound:    make(chan inboundMessage),
		ai:         ai,
	}
}

func (m *ChatManager) Register(client *Client) {
	m.register <- client
}

func (m *ChatManager) Unregister(client *Client) {
	m.unregister <- client
}

func (m *ChatManager) HandleUserMessage(client *Client, message string) {
	m.inbound <- inboundMessage{client: client, message: message}
}

func (m *ChatManager) Run() {
	for {
		select {
		case client := <-m.register:
			m.clients[client] = true
		case client := <-m.unregister:
			if _, ok := m.clients[client]; ok {
				delete(m.clients, client)
				close(client.send)
			}
		case message := <-m.broadcast:
			for client := range m.clients {
				select {
				case client.send <- message:
				default:
					close(client.send)
					delete(m.clients, client)
				}
			}
		case msg := <-m.inbound:
			go m.respondAndBroadcast(msg)
		}
	}
}

func (m *ChatManager) respondAndBroadcast(msg inboundMessage) {
	reply, err := m.ai.GenerateReply(context.Background(), msg.message)
	if err != nil {
		log.Printf("ai response error: %v", err)
		reply = "I hear you. Let's take this one step at a time and focus on actions you can control today."
	}
	m.broadcast <- []byte(reply)
}
