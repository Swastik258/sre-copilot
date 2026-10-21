"""Local log analysis endpoints.

No raw log content is persisted or sent to an external model by this route. The
response contains redacted, grouped signatures and evidence references.
"""

from __future__ import annotations

from fastapi import APIRouter

from app.schemas.logs import LogAnalyzeRequest, LogAnalyzeResponse
from app.services.log_analysis import analyze_logs

router = APIRouter(prefix="/logs", tags=["logs"])


@router.post("/analyze", response_model=LogAnalyzeResponse)
def analyze(request: LogAnalyzeRequest) -> LogAnalyzeResponse:
    return analyze_logs(request)
