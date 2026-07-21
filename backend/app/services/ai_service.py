import json
import re
from typing import Dict, Any, Optional
from ..config import settings

class AIService:
    def __init__(self):
        self.client = None
        if settings.OPENAI_API_KEY and not settings.MOCK_MODE:
            try:
                from openai import OpenAI
                self.client = OpenAI(api_key=settings.OPENAI_API_KEY)
            except Exception as e:
                print(f"Failed to initialize OpenAI client: {e}")

    def generate_social_content(self, text_prompt: str, media_url: Optional[str] = None) -> Dict[str, Any]:
        """
        Generates tailored social posts for Instagram, LinkedIn, and Twitter/X
        based on a text prompt and/or an uploaded image/video.
        """
        # If OpenAI client is not available, run in Mock mode
        if not self.client:
            return self._generate_mock_content(text_prompt, media_url)

        try:
            # We use gpt-4o-mini as it is fast, cost-effective, and supports vision.
            model = "gpt-4o-mini"
            
            system_instruction = (
                "You are an expert AI social media manager. Analyze the user's input "
                "(text prompt and optionally an image) and generate high-engagement posts for "
                "Instagram, LinkedIn, and Twitter/X.\n"
                "You MUST respond ONLY with a raw JSON object matching this schema:\n"
                "{\n"
                "  \"instagram\": {\n"
                "    \"caption\": \"Instagram caption (engaging, emojis, spacing)\",\n"
                "    \"hashtags\": [\"tag1\", \"tag2\"],\n"
                "    \"story_idea\": \"A creative idea for a companion Instagram Story\"\n"
                "  },\n"
                "  \"linkedin\": {\n"
                "    \"caption\": \"LinkedIn post (professional, paragraph style, value-oriented)\",\n"
                "    \"summary\": \"Brief summary of the LinkedIn post\"\n"
                "  },\n"
                "  \"twitter\": {\n"
                "    \"caption\": \"Twitter/X tweet (viral, high impact, under 280 characters)\",\n"
                "    \"hashtags\": [\"tag1\", \"tag2\"]\n"
                "  },\n"
                "  \"title\": \"Catchy title for the post campaign\",\n"
                "  \"recommended_platform\": \"Instagram/LinkedIn/Twitter\",\n"
                "  \"best_posting_time\": \"10:00 AM or 5:00 PM (explain why briefly)\"\n"
                "}"
            )

            messages = [
                {"role": "system", "content": system_instruction}
            ]

            user_content = []
            if text_prompt:
                user_content.append({"type": "text", "text": f"User prompt: {text_prompt}"})
            else:
                user_content.append({"type": "text", "text": "Analyze the attached image and generate social media content."})

            if media_url:
                # If it's a video, vision models can't analyze it directly over URL easily,
                # but we can pass it as a URL and OpenAI will try, or we fall back.
                # Assuming images for vision.
                user_content.append({
                    "type": "image_url",
                    "image_url": {
                        "url": media_url
                    }
                })

            messages.append({"role": "user", "content": user_content})

            response = self.client.chat.completions.create(
                model=model,
                messages=messages,
                response_format={"type": "json_object"},
                max_tokens=1000,
                temperature=0.7
            )

            result_text = response.choices[0].message.content or ""
            return json.loads(result_text)

        except Exception as e:
            print(f"OpenAI API call failed: {e}. Falling back to mock generation.")
            return self._generate_mock_content(text_prompt, media_url)

    def _generate_mock_content(self, text_prompt: str, media_url: Optional[str] = None) -> Dict[str, Any]:
        """
        Generates realistic simulated social media copies when OpenAI is disabled.
        Recognizes keywords like 'hackathon', 'launch', 'design', etc.
        """
        combined = f"{text_prompt} {media_url or ''}".lower()
        
        # 1. Hackathon Scenario
        if "hackathon" in combined or "coding" in combined or "developer" in combined:
            title = "Building the Future at the Hackathon"
            inst_caption = "Building the future with innovation! 🚀 Endless coffee, lines of code, and building something game-changing with an incredible team."
            inst_tags = ["Hackathon", "AI", "Developers", "BuildInPublic", "Coding Life"]
            inst_story = "Record a quick 15-second panning shot of the team coding, tagging the event organizer with a countdown sticker!"
            
            link_caption = (
                "Excited to participate in this week's innovative technology hackathon! 💻 "
                "Our team is focusing on building AI-powered scheduling tools that automate cross-platform publishing.\n\n"
                "Collaborating under tight timelines teaches us the importance of clean architecture, modular codebases, "
                "and quick prototyping. Proud of the progress we're making and grateful to the mentors who guided us today."
            )
            link_summary = "Reflections on team collaboration and building an AI SaaS prototype under pressure at a local hackathon."
            
            tw_caption = "Building. Learning. Creating. 🚀 Hacking away at the next generation of social media automation tools."
            tw_tags = ["BuildInPublic", "Hackathon", "Coding"]
            
            rec_platform = "LinkedIn"
            best_time = "Thursday at 2:00 PM (Technical audience is highly active mid-week during afternoons)"

        # 2. Product Launch Scenario
        elif "launch" in combined or "announcement" in combined or "startup" in combined:
            title = "SocialFlow AI Official Launch"
            inst_caption = "It's official: SocialFlow AI is live! 🎉 Say goodbye to spending hours copy-pasting posts. Generate, customize, and schedule cross-platform posts in seconds."
            inst_tags = ["SaaSLaunch", "ProductLaunch", "SocialFlowAI", "MarketingTools"]
            inst_story = "Show a screen-record tutorial of the 'Create Post' page generating text in real-time, overlaying a Link sticker to sign up!"
            
            link_caption = (
                "Today, we are thrilled to announce the official launch of SocialFlow AI! 🚀\n\n"
                "Managing social media should not feel like manual labor. With our new AI Engine, "
                "you can upload an image or draft a single prompt, and instantly preview optimized versions for "
                "LinkedIn, Instagram, and Twitter/X with tailored captions, hashtags, and summaries.\n\n"
                "Try it free today and let us know your feedback!"
            )
            link_summary = "Product launch announcement explaining how SocialFlow AI automates cross-platform social media posting."
            
            tw_caption = "SocialFlow AI is officially LIVE! 🎉 Upload once. Generate platform-specific posts with AI. Schedule instantly."
            tw_tags = ["Startup", "MarketingTech", "Launch"]
            
            rec_platform = "Twitter"
            best_time = "Tuesday at 9:00 AM (Tech and startup product launches perform best early morning EST)"

        # 3. Default Scenario
        else:
            cleaned_prompt = text_prompt if text_prompt else "our new content workflow"
            title = f"Enhancing Content Strategy"
            inst_caption = f"Leveling up our social content workflow! 📈 {cleaned_prompt}. Small daily improvements lead to big long-term results."
            inst_tags = ["GrowthMindset", "ContentStrategy", "SaaSLife", "SocialMediaManager"]
            inst_story = "Share a behind-the-scenes photo of the workspace with a 'Poll' sticker asking: 'Do you automate your social posting?'"
            
            link_caption = (
                "Efficiency is the ultimate competitive advantage for small teams. "
                "By optimizing how we distribute our content—focusing on: "
                f"'{cleaned_prompt}'—we can remain consistent without burning out.\n\n"
                "How is your team managing content distribution this quarter? Are you using automation tools or manual workflows?"
            )
            link_summary = "An analysis of workflow efficiency and the importance of content distribution automation for small teams."
            
            tw_caption = f"Consistency > Intensity. Streamlining our content strategy around: {cleaned_prompt} ⚡️"
            tw_tags = ["ContentMarketing", "Productivity"]
            
            rec_platform = "Instagram"
            best_time = "Wednesday at 12:00 PM (Mid-day scrolling peaks mid-week for professional lifestyle content)"

        return {
            "instagram": {
                "caption": inst_caption,
                "hashtags": inst_tags,
                "story_idea": inst_story
            },
            "linkedin": {
                "caption": link_caption,
                "summary": link_summary
            },
            "twitter": {
                "caption": tw_caption,
                "hashtags": tw_tags
            },
            "title": title,
            "recommended_platform": rec_platform,
            "best_posting_time": best_time
        }

ai_service = AIService()
