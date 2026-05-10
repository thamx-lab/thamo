from fastapi import FastAPI, Header, HTTPException, UploadFile, File, Form, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic_settings import BaseSettings
from supabase import create_client, Client
import uuid

class Settings(BaseSettings):
    supabase_url: str = "http://localhost:8000" # Placeholder, update via .env
    supabase_anon_key: str = "placeholder_key" # Placeholder, update via .env

settings = Settings()
supabase: Client = create_client(settings.supabase_url, settings.supabase_anon_key)

app = FastAPI(title="Forum API")

# Add CORS so React frontend can call this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def get_user(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Unauthorized")
    token = authorization.replace("Bearer ", "")
    try:
        user_response = supabase.auth.get_user(token)
        if user_response and user_response.user:
            return user_response.user
        else:
            raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Unauthorized: {str(e)}")

@app.get("/posts")
def get_posts():
    """Retrieve posts from Supabase"""
    try:
        response = supabase.table("posts").select("*").order("created_at", desc=True).execute()
        return response.data
    except Exception as e:
        print(f"Error fetching posts: {e}")
        # Returning fake data if Supabase isn't reachable yet
        return [
            {"id": "1", "title": "Check out this placeholder meme", "image_url": "https://placehold.co/600x400/png", "user_id": "system"},
            {"id": "2", "title": "Placeholder photo 2", "image_url": "https://placehold.co/600x400/png", "user_id": "system"}
        ]

@app.post("/posts")
async def create_post(
    title: str = Form(...),
    image: UploadFile = File(None),
    user = Depends(get_user)
):
    """Create a new post using the user's Supabase JWT"""
    image_url = ""
    
    if image:
        # Upload image to Supabase Storage
        file_ext = image.filename.split(".")[-1]
        file_name = f"{uuid.uuid4()}.{file_ext}"
        try:
            file_contents = await image.read()
            supabase.storage.from_("forum-images").upload(file_name, file_contents, {"content-type": image.content_type})
            
            # Get public URL
            public_url = supabase.storage.from_("forum-images").get_public_url(file_name)
            image_url = public_url
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Image upload failed: {str(e)}")
            
    try:
        # Insert post record
        data = {
            "title": title,
            "image_url": image_url,
            "user_id": user.id
        }
        res = supabase.table("posts").insert(data).execute()
        return res.data[0] if res.data else {}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cannot reach Supabase: {str(e)}")

@app.get("/health")
def health_check():
    return {"status": "ok"}
