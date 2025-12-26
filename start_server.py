#!/usr/bin/env python3
"""Start the Otom server with the correct port."""
import os
import uvicorn

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    print(f"Starting Otom on port {port}...")
    uvicorn.run("main:app", host="0.0.0.0", port=port)
