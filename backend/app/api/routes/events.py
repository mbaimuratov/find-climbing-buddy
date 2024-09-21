import uuid
from typing import Any

from fastapi import APIRouter, HTTPException, status
from sqlmodel import func, select

from app.api.deps import CurrentUser, SessionDep
from app.models import Event, EventCreate, EventPublic, EventsPublic, EventUpdate, EventRegistration, EventRegistrationPublic, Message

router = APIRouter()


@router.get("/", response_model=EventsPublic)
def read_events(
    session: SessionDep, skip: int = 0, limit: int = 100
) -> Any:
    """
    Retrieve all events.
    """
    count_statement = select(func.count()).select_from(Event)
    count = session.exec(count_statement).one()
    statement = select(Event).offset(skip).limit(limit)
    events = session.exec(statement).all()

    return EventsPublic(data=events, count=count)


@router.get("/registered", response_model=EventsPublic)
def get_user_registered_events(
    *,
    current_user: CurrentUser,
) -> Any:
    """
    Get the list of events a user is registered for.
    """
    registrations = current_user.registrations
    events = [registration.event for registration in registrations]
    
    return EventsPublic(data=events, count=len(events))


@router.get("/{id}", response_model=EventPublic)
def read_event(session: SessionDep, id: uuid.UUID) -> Any:
    """
    Get event by ID.
    """
    event = session.get(Event, id)
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    return event


@router.post("/", response_model=EventPublic)
def create_event(
    *, session: SessionDep, current_user: CurrentUser, event_in: EventCreate
) -> Any:
    """
    Create a new event.
    """
    event = Event.model_validate(event_in, update={"organizer_id": current_user.id})
    session.add(event)
    session.commit()
    session.refresh(event)
    return event


@router.put("/{id}", response_model=EventPublic)
def update_event(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
    event_in: EventUpdate,
) -> Any:
    """
    Update an event.
    """
    event = session.get(Event, id)
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    if event.organizer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Not enough permissions")
    update_dict = event_in.model_dump(exclude_unset=True)
    event.sqlmodel_update(update_dict)
    session.add(event)
    session.commit()
    session.refresh(event)
    return event


@router.delete("/{id}")
def delete_event(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Message:
    """
    Delete an event.
    """
    event = session.get(Event, id)
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    if event.organizer_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Not enough permissions")
    session.delete(event)
    session.commit()
    return Message(message="Event deleted successfully")


@router.post("/{event_id}/register", response_model=EventRegistrationPublic)
def register_for_event(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    event_id: uuid.UUID,
) -> Any:
    """
    Register the current user for an event.
    """
    event = session.get(Event, event_id)
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Event not found"
        )

    # Check if the user is already registered for the event
    existing_registration = session.exec(
        select(EventRegistration).where(
            EventRegistration.event_id == event_id,
            EventRegistration.user_id == current_user.id
        )
    ).first()
    
    if existing_registration:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="User is already registered for this event"
        )

    # Create a new registration
    registration = EventRegistration(
        user_id=current_user.id,
        event_id=event_id
    )

    session.add(registration)
    session.commit()
    session.refresh(registration)
    return registration


@router.delete("/{event_id}/unregister")
def unregister_from_event(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    event_id: uuid.UUID
) -> Message:
    """
    Unregister the current user from an event.
    """
    statement = select(EventRegistration).where(
        EventRegistration.user_id == current_user.id, 
        EventRegistration.event_id == event_id
    )
    registration = session.exec(statement).first()
    if not registration:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Registration not found")
    
    session.delete(registration)
    session.commit()
    return Message(message="Successfully unregistered from event")