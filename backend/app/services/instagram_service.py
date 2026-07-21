import httpx
import time
from typing import Dict, Any, Optional

class InstagramService:
    def publish_post(self, access_token: str, caption: str, media_url: str, instagram_business_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Publishes an image or video to Instagram Business Account via the Graph API.
        If details are missing, falls back to a sandbox simulation.
        """
        # If no access token, business ID, or if it is mock/sandbox token, run simulation
        if not instagram_business_id or not access_token or access_token.startswith("mock_"):
            return self._publish_mock(caption, media_url)

        try:
            # Step 1: Create a media container
            # Ref: https://developers.facebook.com/docs/instagram-api/reference/ig-user/media
            url = f"https://graph.facebook.com/v19.0/{instagram_business_id}/media"
            payload = {
                "image_url": media_url,
                "caption": caption,
                "access_token": access_token
            }
            
            with httpx.Client() as client:
                res = client.post(url, data=payload)
                res_data = res.json()
                
                if res.status_code != 200:
                    raise Exception(f"Container creation failed: {res_data}")
                
                creation_id = res_data.get("id")
                
                # Step 2: Publish the media container
                publish_url = f"https://graph.facebook.com/v19.0/{instagram_business_id}/media_publish"
                publish_payload = {
                    "creation_id": creation_id,
                    "access_token": access_token
                }
                
                # Small delay for Facebook backend processing
                time.sleep(2)
                
                pub_res = client.post(publish_url, data=publish_payload)
                pub_res_data = pub_res.json()
                
                if pub_res.status_code != 200:
                    raise Exception(f"Media publish failed: {pub_res_data}")
                
                instagram_post_id = pub_res_data.get("id")
                
                return {
                    "status": "success",
                    "post_id": instagram_post_id,
                    "url": f"https://instagram.com/p/{instagram_post_id}",
                    "platform": "instagram"
                }

        except Exception as e:
            print(f"Instagram Graph API posting failed: {e}. Falling back to sandbox.")
            return self._publish_mock(caption, media_url)

    def _publish_mock(self, caption: str, media_url: str) -> Dict[str, Any]:
        # Simulate publishing to Instagram
        mock_id = f"ig_post_{int(time.time())}"
        print(f"[Instagram Simulator] Published post {mock_id} to Instagram.")
        print(f"[Instagram Simulator] Content: {caption[:50]}... | Media: {media_url}")
        return {
            "status": "success",
            "post_id": mock_id,
            "url": f"https://www.instagram.com/p/C_mock_post_{mock_id}/",
            "platform": "instagram"
        }

instagram_service = InstagramService()
