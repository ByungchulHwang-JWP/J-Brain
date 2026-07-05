import asyncio
from langchain_openai import OpenAIEmbeddings
from app.core.config import settings

async def test():
    print("starting embedding test")
    embedder = OpenAIEmbeddings(model="text-embedding-3-small", api_key=settings.OPENAI_API_KEY)
    try:
        vec = await embedder.aembed_query("Hello world")
        print("embedded:", len(vec))
    except Exception as e:
        print("Error:", e)

asyncio.run(test())
