from fastapi import APIRouter

from app.schemas.session import (
    SessionCreateRequest,
    SessionFavoriteResponse,
    SessionState,
    SessionUpdateRequest,
)
from app.services.session_service import (
    add_favorite,
    create_session,
    get_session,
    remove_favorite,
    update_session,
)

router = APIRouter(prefix="/sessions", tags=["sessions"])


@router.post("", response_model=SessionState)
def create_browser_session(payload: SessionCreateRequest) -> SessionState:
    return create_session(payload.name)


@router.get("/{session_id}", response_model=SessionState)
def get_browser_session(session_id: str) -> SessionState:
    return get_session(session_id)


@router.patch("/{session_id}", response_model=SessionState)
def patch_browser_session(session_id: str, payload: SessionUpdateRequest) -> SessionState:
    return update_session(session_id, payload)


@router.post("/{session_id}/favorites/{planet_name}", response_model=SessionFavoriteResponse)
def create_favorite(session_id: str, planet_name: str) -> SessionFavoriteResponse:
    return SessionFavoriteResponse(session_id=session_id, favorites=add_favorite(session_id, planet_name))


@router.delete("/{session_id}/favorites/{planet_name}", response_model=SessionFavoriteResponse)
def delete_favorite(session_id: str, planet_name: str) -> SessionFavoriteResponse:
    return SessionFavoriteResponse(
        session_id=session_id,
        favorites=remove_favorite(session_id, planet_name),
    )
