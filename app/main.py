import json
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.docs import get_swagger_ui_html
from fastapi.responses import HTMLResponse

from app.api.health import router as health_router
from app.api.boards import router as boards_router
from app.api.issues import router as issues_router
from app.api.webhooks import router as webhooks_router

SWAGGER_X_API_KEY = os.getenv("SWAGGER_X_API_KEY", "")

app = FastAPI(
    title="Kanban Backend POC",
    description=(
        "Supabase-backed Kanban API.\n\n"
        "Required environment variables:\n"
        "- SUPABASE_URL\n"
        "- SUPABASE_SERVICE_ROLE_KEY\n\n"
        "Protected endpoints use `X-API-Key` (via Swagger Authorize)."
    ),
    docs_url=None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router, prefix="", tags=["health"])
app.include_router(boards_router, prefix="/boards", tags=["boards"])
app.include_router(issues_router, prefix="", tags=["issues"])
app.include_router(webhooks_router, prefix="/webhooks", tags=["webhooks"])


@app.get("/docs", include_in_schema=False)
def custom_swagger_ui_html() -> HTMLResponse:
    swagger_html = get_swagger_ui_html(
        openapi_url=app.openapi_url,
        title=f"{app.title} - Swagger UI",
        swagger_ui_parameters={"persistAuthorization": True},
    )

    if not SWAGGER_X_API_KEY:
        return swagger_html

    injected_script = f"""
<script>
window.addEventListener("load", function () {{
  if (window.ui && window.ui.preauthorizeApiKey) {{
    window.ui.preauthorizeApiKey("APIKeyHeader", {json.dumps(SWAGGER_X_API_KEY)});
  }}
}});
</script>
"""

    body = swagger_html.body.decode("utf-8").replace("</body>", f"{injected_script}</body>")
    return HTMLResponse(content=body, status_code=swagger_html.status_code)
