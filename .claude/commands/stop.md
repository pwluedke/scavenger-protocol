# /stop local
Stop whatever is running on port 5199.

```bash
kill -9 $(lsof -t -i:5199) 2>/dev/null && echo "Server stopped" || echo "No server running on port 5199"
```
