
import bcrypt
from jose import jwt, JWTError
from datetime import datetime, timedelta, timezone
from typing import Optional
import os
from dotenv import load_dotenv


load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
DATABASE_URL = os.getenv("DATABASE_URL")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

def get_password_hash(password: str) -> str:
    """
        Takes a plain password, turns it into bytes, hashes it,
        and returns the hash as a string for the database.
    """
    pwd_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(pwd_bytes, salt)
    return hashed_password.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
        just verifying if the plain password matches the hashed password.
    """
    password_byte_enc = plain_password.encode("utf-8")
    hashed_password_byte_enc= hashed_password.encode("utf-8")
    return bcrypt.checkpw(password_byte_enc, hashed_password_byte_enc)


"""
A JSON Web Token (JWT) is a secure way to send information between two parties. It is like a digital passport. It has three parts separated by dots
Header.Payload.Signature
Header: Contains information about the type of token (JWT) and the hashing algorithm used to create it.
Payload: Contains information about the subject of the token (the user in this case) and any other claims we want to include.
Signature: Is an encrypted hash of the header and payload using a secret as the key. This signature is used to verify the token's integrity.
The JWT is signed by the server using the secret key, and verified by the client using the public key.
"""


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    # Takes {"sub": "user@example.com"}
    # Returns "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." (JWT token)
    # Uses python-jose with SECRET_KEY from .env file in the backend directory
    to_encode = data.copy() #Protect original data from being modified
    if expires_delta:
        #if expected time is requested, use it (like a "Remember Me" feature)"
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        #otherwise, use default ACCESS_TOKEN_EXPIRE_MINUTES
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    # "exp" is a reserved keyword in JWT. The library looks for this specific key
    # to automatically handle token expiration checks later.
    to_encode.update({"exp": expire})

    #jwt.encode() takes the data (payload), the secret password (key), and the
    #math rule (algorithm) to crush them into a single encrypted string.
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    #return long string to user
    return encoded_jwt

def verify_token(token: str) -> dict | None:
    # We wrap everything in a try/except block because decoding is risky.
    # If the token is fake, expired, or tampered with, the library will crash (raise an error).
    try:
        #decode and verify the token
        # Checks if the signature matches our SECRET_KEY (Anti-tamper).
        # Checks if the token is expired (Anti-replay).
        # Decodes the messy string back into a Python dictionary.
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        #extra check, does it have the 'sub' subject field?
        # even if the token is valid, it might be empty or missing the user's ID.
        if payload.get("sub") is None:
            return None
        # Return the dictionary (e.g., {"sub": "danny@example.com", "exp": 1735689600}) if all goes well(no errors)
        return payload

    # - catches all our token problems:
    # - ExpiredSignatureError (Token is too old)
    # - JWTClaimsError (Token claims are wrong)
    # -PyJWTError (Token format is garbage)
    except JWTError:
        return None

#Use to test JWT:
#test_data = create_access_token({"sub": "test_subject"})
#print(test_data)

#output ex: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0X3N1YmplY3QiLCJleHAiOjE3NzE2MDYwOTR9.Jy3JGuTXFqRL_RSvCfyH3C3kiEw-8SHSPV5op5Wxovs"