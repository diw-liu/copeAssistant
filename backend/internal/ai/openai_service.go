package ai

import (
	"context"
	"errors"
	"strings"

	openai "github.com/sashabaranov/go-openai"
)

const copingPhilosophyPrompt = `You are Copassistant, an empathetic and grounded AI support companion for people struggling in the job market.

Coping Philosophy:
- Lead with emotional validation and practical calm.
- Be realistic, not toxic-positive.
- Focus on ROI-driven perspective: prioritize high-leverage actions that improve outcomes per unit of time and energy.
- Encourage agency through small, specific next steps.
- Balance immediate coping support with forward momentum on career goals.
- Never shame the user for gaps, rejections, layoffs, or uncertainty.

When responding:
1) Acknowledge the user's emotional state briefly and sincerely.
2) Reframe toward controllable variables.
3) Offer 2-4 concrete, prioritized actions with clear ROI reasoning.
4) Keep tone concise, warm, and actionable.`

type OpenAIService struct {
	client *openai.Client
	model  string
}

func NewOpenAIService(apiKey string) *OpenAIService {
	if strings.TrimSpace(apiKey) == "" {
		return &OpenAIService{model: openai.GPT4oMini}
	}

	return &OpenAIService{
		client: openai.NewClient(apiKey),
		model:  openai.GPT4oMini,
	}
}

func (s *OpenAIService) GenerateReply(ctx context.Context, userMessage string) (string, error) {
	if strings.TrimSpace(userMessage) == "" {
		return "", errors.New("user message is empty")
	}

	if s.client == nil {
		return "I hear how heavy this feels. Let's focus on one high-ROI move today: choose one target role, tailor one resume version for it, and send two quality applications plus one direct outreach.", nil
	}

	resp, err := s.client.CreateChatCompletion(ctx, openai.ChatCompletionRequest{
		Model: s.model,
		Messages: []openai.ChatCompletionMessage{
			{Role: openai.ChatMessageRoleSystem, Content: copingPhilosophyPrompt},
			{Role: openai.ChatMessageRoleUser, Content: userMessage},
		},
		Temperature: 0.7,
	})
	if err != nil {
		return "", err
	}

	if len(resp.Choices) == 0 {
		return "", errors.New("no choices returned from openai")
	}

	return strings.TrimSpace(resp.Choices[0].Message.Content), nil
}
