from backend.utils.base_agent import BaseAgent
import json
from pathlib import Path
import re


class WriterAgent(BaseAgent):
    def __init__(self):
        super().__init__()
        self.default_affiliate_url = "https://amazon.com"
        self.affiliate_links = {
            "controller": "https://amazon.com",
            "sensor": "https://amazon.com",
            "moisture": "https://amazon.com",
            "light": "https://amazon.com",
            "grow": "https://amazon.com",
            "irrigation": "https://linkwise.net",
            "πότισμα": "https://linkwise.net",
            "ποτίσματος": "https://linkwise.net",
            "γλάστρα": "https://linkwise.net",
            "planters": "https://linkwise.net",
            "fertilizers": "https://linkwise.net",
            "λιπάσματα": "https://linkwise.net",
        }

    def _format_research(self, research_data):
        summary = research_data.get("research_summary") or research_data.get("research", "")
        if not summary:
            return ""

        sections = [str(summary).strip()]
        focus = research_data.get("focus_keyword")
        if focus:
            sections.append(f"Focus keyword: {focus}")

        secondary = research_data.get("secondary_keywords") or []
        if secondary:
            sections.append("Secondary keywords: " + ", ".join(map(str, secondary)))

        pain_points = research_data.get("audience_pain_points") or []
        if pain_points:
            sections.append("Audience pain points:\n- " + "\n- ".join(map(str, pain_points)))

        products = research_data.get("trending_products") or []
        if products:
            lines = []
            for p in products:
                if isinstance(p, dict):
                    lines.append(f"- {p.get('name', 'Product')}: {p.get('why_trending', '')}")
                else:
                    lines.append(f"- {p}")
            sections.append("Trending products:\n" + "\n".join(lines))

        angles = research_data.get("content_angles") or []
        if angles:
            lines = []
            for a in angles:
                if isinstance(a, dict):
                    lines.append(f"- {a.get('heading', 'Section')}")
                    lines.extend(f"  - {p}" for p in (a.get("key_points") or []))
                else:
                    lines.append(f"- {a}")
            sections.append("Suggested content angles:\n" + "\n".join(lines))

        affiliates = research_data.get("affiliate_opportunities") or []
        if affiliates:
            lines = []
            for item in affiliates:
                if isinstance(item, dict):
                    lines.append(f"- {item.get('product_name', 'Product')}: {item.get('placement_hint', '')}")
                else:
                    lines.append(f"- {item}")
            sections.append("Affiliate opportunities:\n" + "\n".join(lines))

        competitor = research_data.get("competitor_notes")
        if competitor:
            sections.append(f"Competitor notes: {competitor}")

        return "\n\n".join(sections)

    def _inject_affiliate_links(self, text):
        pattern = r"\[AFFILIATE_LINK:\s*([^\]]+)\]"
        for label in re.findall(pattern, text):
            clean = label.replace("—", "-").strip()
            target = self.default_affiliate_url
            for keyword, link in self.affiliate_links.items():
                if keyword.lower() in label.lower():
                    target = link
                    break
            md = f"[{clean}]({target})"
            text = text.replace(f"[AFFILIATE_LINK: {label}]", md)
            text = text.replace(f"[AFFILIATE_LINK:{label}]", md)
        return text

    def run(self, research_file=None):
        files = list(self.output.glob("*.json"))
        if not files:
            print("❌ Δεν βρέθηκε καμία έρευνα.")
            return None

        latest = Path(research_file) if research_file else max(files, key=lambda f: f.stat().st_mtime)
        print(f"📝 Using research data from: {latest.name}")

        with open(latest, "r", encoding="utf-8") as f:
            research_data = json.load(f)

        prompt = self.load_prompt("writer.txt")
        prompt = prompt.replace("{research}", self._format_research(research_data))
        prompt = prompt.replace("{topic}", str(research_data.get("topic", "το θέμα του άρθρου")))

        print("🚀 Generating long-form article in Greek...")
        article = self.ask_ai(prompt, max_output_tokens=5500, task_name="Article writer")

        word_count = len(re.findall(r"\b[\wΆ-ώΑ-ΩΪΫϊϋΐΰ'-]+\b", article))
        print(f"📏 Article length: {word_count} words")
        if word_count < 2200:
            print("⚠️ WARNING: Article is below 2,200 words.")

        article_file = self.output / f"{latest.stem}.md"
        article_file.write_text(self._inject_affiliate_links(article), encoding="utf-8")
        print(f"✅ Article generated and saved: {article_file.name}")
        return article_file
