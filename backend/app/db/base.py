"""SQLAlchemy declarative base.

The trailing import of `app.db.models` is intentional: SQLAlchemy's
`Base.metadata` only knows about tables whose model classes have been
imported by the time autogenerate or `create_all` runs. Importing the
models module at the bottom of this file guarantees they are registered
whenever anything imports `Base`.
"""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


# Import models so they register on Base.metadata.
# This import MUST come after the Base class is defined.
from app.db import models  # noqa: E402,F401