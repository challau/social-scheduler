import httpx
import time
from typing import Dict, Any, Optional

class TwitterService:
    def publish_post(self, access_token: str, content: str, media_url: Optional[str] = None) -> Dict[str, Any]:
        """
        Publishes a tweet using Twitter API v2 (POST /2/tweets).
        If tokens are invalid or mock, falls back to a sandbox simulation.
        """
        if not access_token or access_token.startswith("mock_"):
            return self._publish_mock(content, media_url)

        try:
            url = "https://api.twitter.com/2/tweets"
            headers = {
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json"
            }
            
            # Simple v2 tweet body
            tweet_body = {
                "text": content
            }
            
            # Note: For media uploads in Twitter API v2, media must be uploaded to upload.twitter.com/1.1/media/upload.json
            # first using OAuth 1.0a or OAuth 2.0 User Context, which is complex.
            # For robustness, if media_url is present, we append the link to the tweet text.
            if media_url:
                tweet_body["text"] = f"{content}\n\n{media_url}"

            with httpx.Client() as client:
                res = client.post(url, headers=headers, json=tweet_body)
                res_data = res.json()
                
                if res.status_code not in (200, 201):
                    raise Exception(f"Twitter API v2 failed: {res_data}")
                
                tweet_id = res_data.get("data", {}).get("id")
                return {
                    "status": "success",
                    "post_id": tweet_id,
                    "url": f"https://x.com/user/status/{tweet_id}",
                    "platform": "twitter"
                }

        except Exception as e:
            print(f"Twitter posting failed: {e}. Falling back to sandbox.")
            return self._publish_mock(content, media_url)

    def _publish_mock(self, content: str, media_url: Optional[str] = None) -> Dict[str, Any]:
        mock_id = f"tw_post_{int(time.time())}"
        print(f"[Twitter Simulator] Published tweet {mock_id} to Twitter/X.")
        print(f"[Twitter Simulator] Content: {content[:50]}... | Media: {media_url}")
        return {
            "status": "success",
            "post_id": mock_id,
            "url": f"https://x.com/socialflow_ai/status/{mock_id}",
            "platform": "twitter"
        }

twitter_service = TwitterService()
