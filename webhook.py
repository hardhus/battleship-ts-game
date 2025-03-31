#!/usr/bin/env python3

from fastapi import FastAPI, status
from fastapi.responses import JSONResponse
from typing import Dict, Any
import uvicorn
import subprocess
import os

app = FastAPI()

# Genel webhook işleyicisi
def run_deploy_script(project_name: str):
    try:
        print(f"Running deploy script for {project_name}...")
        script_path = f"/home/hardhus/Desktop/WEB/{project_name}/deploy.sh"
        result_deploy = subprocess.run(
            ["/bin/bash", script_path],
            check=True,
            capture_output=True,
            text=True
        )
        print(f"Deploy output: {result_deploy.stdout}")
        return result_deploy.stdout
    except subprocess.CalledProcessError as e:
        print(f"Error during deploy: {e.stderr}")
        return e.stderr

# /jinx URL'si için webhook
@app.post("/jinx")
async def jinx_webhook(data: Dict[str, Any]):
    print(f"Received data: {data}")

    try:
        # deploy.sh script'ini çalıştır
        print("Running deploy.sh...")
        result_deploy = subprocess.run(
            ["/bin/bash", "/home/hardhus/Desktop/deploy.sh"],
            check=True,
            capture_output=True,
            text=True
        )
        print(f"Deploy output: {result_deploy.stdout}")

    except subprocess.CalledProcessError as e:
        print(f"Error during deploy: {e.stderr}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"message": "Deployment failed", "error": e.stderr}
        )

    return JSONResponse(
        status_code=status.HTTP_202_ACCEPTED,
        content={"message": "Webhook received and deployment started"}
    )

# /battleship URL'si için webhook
@app.post("/battleship")
async def battleship_webhook(data: Dict[str, Any]):
    print(f"Received data for battleship: {data}")
    deploy_output = run_deploy_script("battleship-ts-game")
    if "Error" in deploy_output:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"message": "Deployment failed for battleship", "error": deploy_output}
        )
    return JSONResponse(
        status_code=status.HTTP_202_ACCEPTED,
        content={"message": "Webhook received for battleship and deployment started"}
    )

# /battleshipserver URL'si için webhook
@app.post("/battleshipserver")
async def battleshipserver_webhook(data: Dict[str, Any]):
    print(f"Received data for battleshipserver: {data}")
    deploy_output = run_deploy_script("battleship-ts-server")
    if "Error" in deploy_output:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"message": "Deployment failed for battleshipserver", "error": deploy_output}
        )
    return JSONResponse(
        status_code=status.HTTP_202_ACCEPTED,
        content={"message": "Webhook received for battleshipserver and deployment started"}
    )

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5000)
