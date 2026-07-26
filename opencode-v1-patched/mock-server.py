#!/usr/bin/env python3
"""
Shadow Core Mock Server
يحاكي OpenAI-compatible API بدون key حقيقي
يُستخدم كـ fallback عندما لا يوجد provider
"""

import json
import sys
from http.server import HTTPServer, BaseHTTPRequestHandler

PORT = 4444

class MockHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass  # صمت

    def do_GET(self):
        if self.path == "/v1/models":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            models = {
                "object": "list",
                "data": [
                    {
                        "id": "shadow-core",
                        "object": "model",
                        "type": "llm",
                        "max_context_length": 128000,
                        "loaded_context_length": 128000
                    }
                ]
            }
            self.wfile.write(json.dumps(models).encode())
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length) if content_length else b""

        if "/chat/completions" in self.path:
            self.send_response(200)
            self.send_header("Content-Type", "text/event-stream")
            self.send_header("Cache-Control", "no-cache")
            self.end_headers()

            # SSE streaming response
            chunk = {
                "id": "shadow-0001",
                "object": "chat.completion.chunk",
                "model": "shadow-core",
                "choices": [{
                    "index": 0,
                    "delta": {"role": "assistant", "content": "⚠️  Shadow Core: لم يتم تكوين AI provider. يرجى إعداد API key عبر: /connect\n"},
                    "finish_reason": None
                }]
            }
            self.wfile.write(f"data: {json.dumps(chunk)}\n\n".encode())

            done = {
                "id": "shadow-0001",
                "object": "chat.completion.chunk",
                "model": "shadow-core",
                "choices": [{"index": 0, "delta": {}, "finish_reason": "stop"}]
            }
            self.wfile.write(f"data: {json.dumps(done)}\n\n".encode())
            self.wfile.write(b"data: [DONE]\n\n")
        else:
            self.send_response(404)
            self.end_headers()

if __name__ == "__main__":
    server = HTTPServer(("127.0.0.1", PORT), MockHandler)
    print(f"[Shadow Core] Mock server running on port {PORT}", file=sys.stderr)
    server.serve_forever()
