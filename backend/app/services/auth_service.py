import bcrypt


def hash_password(password: str) -> str:
    # Use bcrypt directly to avoid passlib compatibility issues in Python 3.10+
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    # Use bcrypt directly to avoid passlib compatibility issues in Python 3.10+
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8")
        )
    except Exception:
        return False