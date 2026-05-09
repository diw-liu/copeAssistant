package chat

import (
	"context"
	"encoding/json"
	"log"
	"strings"
)

type AIResponder interface {
	GenerateReply(ctx context.Context, userMessage string, mood string) (string, error)
}

type inboundMessage struct {
	client  *Client
	content string
}

type outboundMessage struct {
	Type    string `json:"type"`
	Content string `json:"content"`
}

type inboundContext struct {
	client *Client
	mood   string
}

type ChatManager struct {
	clients       map[*Client]bool
	clientContext map[*Client]string
	register      chan *Client
	unregister    chan *Client
	inbound       chan inboundMessage
	contextUpdate chan inboundContext
	protocolError chan inboundMessage
	ai            AIResponder
}

func NewChatManager(ai AIResponder) *ChatManager {
	return &ChatManager{
		clients:       make(map[*Client]bool),
		clientContext: make(map[*Client]string),
		register:      make(chan *Client),
		unregister:    make(chan *Client),
		inbound:       make(chan inboundMessage),
		contextUpdate: make(chan inboundContext),
		protocolError: make(chan inboundMessage),
		ai:            ai,
	}
}

func (m *ChatManager) Register(client *Client) {
	m.register <- client
}

func (m *ChatManager) Unregister(client *Client) {
	m.unregister <- client
}

func (m *ChatManager) HandleUserMessage(client *Client, message string) {
	m.inbound <- inboundMessage{client: client, content: message}
}

func (m *ChatManager) HandleContextSelection(client *Client, mood string) {
	m.contextUpdate <- inboundContext{client: client, mood: mood}
}

func (m *ChatManager) HandleProtocolError(client *Client, details string) {
	m.protocolError <- inboundMessage{client: client, content: details}
}

func (m *ChatManager) Run() {
	for {
		select {
		case client := <-m.register:
			m.clients[client] = true
			m.sendServerMessage(client, "status", "Connected to Copassistant.")
		case client := <-m.unregister:
			if _, ok := m.clients[client]; ok {
				delete(m.clients, client)
				delete(m.clientContext, client)
				close(client.send)
			}
		case ctx := <-m.contextUpdate:
			if _, ok := m.clients[ctx.client]; ok {
				m.clientContext[ctx.client] = ctx.mood
				m.sendServerMessage(ctx.client, "status", "Context set to "+ctx.mood+".")
			}
		case msg := <-m.protocolError:
			m.sendServerMessage(msg.client, "error", msg.content)
		case msg := <-m.inbound:
			mood := m.clientContext[msg.client]
			go m.respondToClient(msg.client, msg.content, mood)
		}
	}
}

func (m *ChatManager) respondToClient(client *Client, userMessage string, mood string) {
	reply, err := m.ai.GenerateReply(context.Background(), userMessage, mood)
	if err != nil {
		log.Printf("ai response error: %v", err)
		reply = "I hear you. Let's take this one step at a time and focus on actions you can control today."
	}

	m.sendServerMessage(client, "assistant", reply)
}

func (m *ChatManager) sendServerMessage(client *Client, msgType string, content string) {
	if client == nil {
		return
	}

	trimmed := strings.TrimSpace(content)
	if trimmed == "" {
		return
	}

	payload, err := json.Marshal(outboundMessage{
		Type:    msgType,
		Content: trimmed,
	})
	if err != nil {
		log.Printf("marshal websocket payload error: %v", err)
		return
	}

	select {
	case client.send <- payload:
	default:
		close(client.send)
		delete(m.clients, client)
		delete(m.clientContext, client)
	}
}
