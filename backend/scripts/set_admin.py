"""Grant or revoke admin privileges from a trusted local shell."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.db.session import SessionLocal  # noqa: E402
from app.services.auth import get_user_by_email  # noqa: E402


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("email")
    parser.add_argument(
        "--member",
        action="store_true",
        help="remove administrator privileges from the account",
    )
    args = parser.parse_args()
    if "@" not in args.email:
        parser.error("enter a valid account email")
    role = "member" if args.member else "admin"
    if role == "member":
        confirmation = input(f"Demote {args.email} to member? [y/N] ").strip().lower()
        if confirmation != "y":
            print("No changes made.")
            return 1
    with SessionLocal() as db:
        user = get_user_by_email(db, args.email)
        if user is None or not user.is_active:
            print("No active account exists with that email.", file=sys.stderr)
            return 1
        user.role = role
        db.commit()
        print(f"Set {user.email} role to {role}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
