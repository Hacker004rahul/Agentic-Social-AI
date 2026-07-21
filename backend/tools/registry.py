from typing import Dict, Any

class ToolRegistry:
    def __init__(self):
        self._tools: Dict[str, Any] = {}

    def register(self, name: str, tool):
        self._tools[name] = tool

    def get(self, name: str):
        return self._tools.get(name)

tool_registry = ToolRegistry()
