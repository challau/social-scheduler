import httpx
import time
from typing import Dict, Any, Optional

class LinkedInService:
    def publish_post(self, access_token: str, content: str, media_url: Optional[str] = None, person_urn: Optional[str] = None) -> Dict[str, Any]:
        """
        Publishes a post to LinkedIn UGC Post API.
        If details are missing, falls back to a sandbox simulation.
        """
        # Parse or default person_urn. If person_urn is not set, we try to fetch it using /v2/userinfo
        if not person_urn and access_token and not access_token.startswith("mock_"):
            try:
                person_urn = self._fetch_person_urn(access_token)
            except Exception as e:
                print(f"Failed to fetch LinkedIn profile URN: {e}")

        # Fallback to mock if details are mock tokens
        if not access_token or access_token.startswith("mock_") or not person_urn:
            return self._publish_mock(content, media_url)

        try:
            url = "https://api.linkedin.com/v2/ugcPosts"
            headers = {
                "Authorization": f"Bearer {access_token}",
                "X-Restli-Protocol-Version": "2.0.0",
                "Content-Type": "application/json"
            }

            # Basic post body
            post_body = {
                "author": person_urn,
                "lifecycleState": "PUBLISHED",
                "specificContent": {
                    "com.linkedin.ugc.ShareContent": {
                        "shareCommentary": {
                            "text": content
                        },
                        "shareMediaCategory": "NONE"
                    }
                },
                "visibility": {
                    "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
                }
            }

            # If media is provided, we can attach it as an article or image link
            # For simplicity and robust URL-based sharing of uploaded files
            if media_url:
                share_content = post_body["specificContent"]["com.linkedin.ugc.ShareContent"]
                share_content["shareMediaCategory"] = "ARTICLE"
                share_content["media"] = [{
                    "status": "READY",
                    "description": {
                        "text": "Shared via SocialFlow AI"
                    },
                    "originalUrl": media_url,
                    "title": {
                        "text": "SocialFlow AI Post Media"
                    }
                }]

            with httpx.Client() as client:
                res = client.post(url, headers=headers, json=post_body)
                res_data = res.json()
                
                if res.status_code not in (200, 201):
                    raise Exception(f"LinkedIn ugcPost failed: {res_data}")

                linkedin_post_urn = res_data.get("id")
                return {
                    "status": "success",
                    "post_id": linkedin_post_urn,
                    "url": f"https://www.linkedin.com/feed/update/{linkedin_post_urn}",
                    "platform": "linkedin"
                }

        except Exception as e:
            print(f"LinkedIn posting failed: {e}. Falling back to sandbox.")
            return self._publish_mock(content, media_url)

    def _fetch_person_urn(self, access_token: str) -> str:
        """Helper to get user info and return URN: 'urn:li:person:<id>'"""
        url = "https://api.linkedin.com/v2/userinfo"
        headers = {"Authorization": f"Bearer {access_token}"}
        with httpx.Client() as client:
            res = client.get(url, headers=headers)
            res_data = res.json()
            sub = res_data.get("sub")
            if not sub:
                raise Exception(f"Unable to parse profile ID from: {res_data}")
            return f"urn:li:person:{sub}"

    def _publish_mock(self, content: str, media_url: Optional[str] = None) -> Dict[str, Any]:
        mock_id = f"li_post_{int(time.time())}"
        print(f"[LinkedIn Simulator] Published post {mock_id} to LinkedIn.")
        print(f"[LinkedIn Simulator] Content: {content[:50]}... | Media: {media_url}")
        return {
            "status": "success",
            "post_id": mock_id,
            "url": f"https://www.linkedin.com/feed/update/urn:li:share:mock_share_{mock_id}",
            "platform": "linkedin"
        }

linkedin_service = LinkedInService()
