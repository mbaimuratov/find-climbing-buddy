import uuid

from pydantic import EmailStr
from sqlmodel import Field, Relationship, SQLModel

from datetime import datetime

from typing import List


# Shared properties
class UserBase(SQLModel):
    email: EmailStr = Field(unique=True, index=True, max_length=255)
    is_active: bool = True
    is_superuser: bool = False
    full_name: str | None = Field(default=None, max_length=255)


# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=40)


class UserRegister(SQLModel):
    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=8, max_length=40)
    full_name: str | None = Field(default=None, max_length=255)


# Properties to receive via API on update, all are optional
class UserUpdate(UserBase):
    email: EmailStr | None = Field(default=None, max_length=255)  # type: ignore
    password: str | None = Field(default=None, min_length=8, max_length=40)


class UserUpdateMe(SQLModel):
    full_name: str | None = Field(default=None, max_length=255)
    email: EmailStr | None = Field(default=None, max_length=255)


class UpdatePassword(SQLModel):
    current_password: str = Field(min_length=8, max_length=40)
    new_password: str = Field(min_length=8, max_length=40)


# Database model, database table inferred from class name
class User(UserBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    hashed_password: str
    items: list["Item"] = Relationship(back_populates="owner", cascade_delete=True)
    organized_events: list["Event"] = Relationship(back_populates="organizer", cascade_delete=True)
    registrations: list["EventRegistration"] = Relationship(back_populates="user", cascade_delete=True)


# Properties to return via API, id is always required
class UserPublic(UserBase):
    id: uuid.UUID


class UsersPublic(SQLModel):
    data: list[UserPublic]
    count: int


# Shared properties
class ItemBase(SQLModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=255)


# Properties to receive on item creation
class ItemCreate(ItemBase):
    pass


# Properties to receive on item update
class ItemUpdate(ItemBase):
    title: str | None = Field(default=None, min_length=1, max_length=255)  # type: ignore


# Database model, database table inferred from class name
class Item(ItemBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    title: str = Field(max_length=255)
    owner_id: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )
    owner: User | None = Relationship(back_populates="items")


# Properties to return via API, id is always required
class ItemPublic(ItemBase):
    id: uuid.UUID
    owner_id: uuid.UUID


class ItemsPublic(SQLModel):
    data: list[ItemPublic]
    count: int


# Generic message
class Message(SQLModel):
    message: str


# JSON payload containing access token
class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"


# Contents of JWT token
class TokenPayload(SQLModel):
    sub: str | None = None


class NewPassword(SQLModel):
    token: str
    new_password: str = Field(min_length=8, max_length=40)


# Shared properties for Event
class EventBase(SQLModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=255)
    date: datetime
    location: str = Field(min_length=1, max_length=255)

# Properties to receive on event creation
class EventCreate(EventBase):
    pass

# Properties to receive on event update
class EventUpdate(EventBase):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=255)
    date: datetime | None = Field(default=None)
    location: str | None = Field(default=None, min_length=1, max_length=255)

# Database model for Event
class Event(EventBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    organizer_id: uuid.UUID = Field(foreign_key="user.id", nullable=False)
    organizer: User | None = Relationship(back_populates="organized_events")
    registrations: list["EventRegistration"] = Relationship(back_populates="event", cascade_delete=True)

# Properties to return via API for Event
class EventPublic(EventBase):
    id: uuid.UUID
    organizer_id: uuid.UUID

# Model to return a list of events with a count
class EventsPublic(SQLModel):
    data: List[EventPublic]
    count: int

# Shared properties for EventRegistration
class EventRegistrationBase(SQLModel):
    user_id: uuid.UUID = Field(foreign_key="user.id", nullable=False)
    event_id: uuid.UUID = Field(foreign_key="event.id", nullable=False)
    registration_date: datetime = Field(default_factory=datetime.now)

# Properties to receive on event registration
class EventRegistrationCreate(EventRegistrationBase):
    pass

# Database model for EventRegistration
class EventRegistration(EventRegistrationBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user: User | None = Relationship(back_populates="registrations")
    event: Event | None = Relationship(back_populates="registrations")

# Properties to return via API for EventRegistration
class EventRegistrationPublic(SQLModel):
    id: uuid.UUID
    user_id: uuid.UUID
    event_id: uuid.UUID
    registration_date: datetime