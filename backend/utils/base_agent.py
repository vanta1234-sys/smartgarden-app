from pathlib import Path
from openai import OpenAI
from dotenv import load_dotenv
import os

load_dotenv()


class BaseAgent:
    def __init__(self):
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.prompts = Path("backend/prompts")
        self.output = Path("backend/output")
        self.output.mkdir(parents=True, exist_ok=True)

    def load_prompt(self, filename):
        with open(self.prompts / filename, "r", encoding="utf-8") as f:
            return f.read()

    def ask_ai(self, prompt, max_output_tokens=None, task_name=None):
        kwargs = {"model": "gpt-5-mini", "input": prompt}
        if max_output_tokens is not None:
            kwargs["max_output_tokens"] = max_output_tokens
        return self.client.responses.create(**kwargs).output_text
