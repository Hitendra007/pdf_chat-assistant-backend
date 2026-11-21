import asyncio
from app.services.llm_bot import client

# Tried in this order. Edit this list when Google retires a model.
MODELS = [
    "gemini-3.8-flash",
    "gemini-3.5-flash-lite",
    "gemini-3.1-flash-lite",
    "gemini-flash-lite-latest",
]

COOLDOWN_SECONDS = 60
_cooldown_until = {}  # model -> loop time until which it is skipped


async def stream_with_fallback(messages):
    """Yields text pieces. Switches to the next model if one fails before answering."""
    loop = asyncio.get_running_loop()

    for model in MODELS:
        if _cooldown_until.get(model, 0) > loop.time():
            continue  # failed recently, skip it for a minute

        started = False
        try:
            stream = await client.chat.completions.create(
                model=model,
                messages=messages,
                stream=True,
            )
            async for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    started = True
                    yield chunk.choices[0].delta.content
            return  # finished successfully

        except Exception as e:
            print(f"Model {model} failed: {type(e).__name__}: {e}")
            _cooldown_until[model] = loop.time() + COOLDOWN_SECONDS
            if started:
                return  # can't switch in the middle of an answer

    raise RuntimeError("All models unavailable")