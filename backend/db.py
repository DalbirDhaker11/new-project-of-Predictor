"""
Port of src/server/db.ts to Python (using Motor, the async MongoDB driver).

Fully optional: if MONGODB_URI is not set (or the connection fails), the app
silently falls back to in-memory storage — nothing else needs to change or
check for this. When MONGODB_URI *is* set and reachable, employee records
uploaded via /api/train are persisted, and are automatically reloaded the
next time the server starts.
"""

from __future__ import annotations

import os
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any

from model import Employee

try:
    from motor.motor_asyncio import AsyncIOMotorClient
except ImportError:  # motor may not be installed if MongoDB isn't being used at all
    AsyncIOMotorClient = None  # type: ignore

_client: Optional["AsyncIOMotorClient"] = None
_connected = False


async def connect_db() -> bool:
    """Attempts to connect to MongoDB using MONGODB_URI. Safe to call even if
    the env var is missing or motor isn't installed — resolves to False in
    that case. Never raises."""
    global _client, _connected

    if _connected:
        return True

    uri = os.environ.get("MONGODB_URI")
    if not uri:
        print("[db] MONGODB_URI not set — using in-memory storage only.")
        return False

    if AsyncIOMotorClient is None:
        print("[db] motor package not installed — using in-memory storage only.")
        return False

    try:
        client = AsyncIOMotorClient(uri, serverSelectionTimeoutMS=8000)
        # Force a round-trip to confirm the connection actually works.
        await client.admin.command("ping")
        _client = client
        _connected = True
        print("[db] Connected to MongoDB.")
        await seed_db_users()
        return True
    except Exception as err:  # noqa: BLE001 - intentionally broad, must never crash startup
        print(f"[db] Failed to connect to MongoDB, falling back to in-memory storage: {err}")
        _connected = False
        return False


def is_db_connected() -> bool:
    return _connected


def _db():
    assert _client is not None
    return _client.get_default_database(default="employee_resignation_predictor")


def _employee_to_doc(e: Employee) -> Dict[str, Any]:
    doc = e.to_dict()
    doc["employeeId"] = doc.pop("id")
    return doc


def _doc_to_employee(doc: Dict[str, Any]) -> Employee:
    d = dict(doc)
    d["id"] = d.get("employeeId")
    d.pop("employeeId", None)
    d.pop("_id", None)
    return Employee.from_dict(d)


async def save_employees(employees: List[Employee]) -> None:
    """Replaces the entire employees collection with the given list."""
    if not is_db_connected():
        return
    coll = _db()["employees"]
    await coll.delete_many({})
    if employees:
        await coll.insert_many([_employee_to_doc(e) for e in employees], ordered=False)


async def load_employees() -> List[Employee]:
    """Loads all employees currently stored in MongoDB, if any."""
    if not is_db_connected():
        return []
    coll = _db()["employees"]
    docs = await coll.find({}).to_list(length=None)
    return [_doc_to_employee(d) for d in docs]


async def record_import(file_name: str, row_count: int, status: str, message: Optional[str] = None) -> None:
    if not is_db_connected():
        return
    coll = _db()["import_history"]
    await coll.insert_one({
        "fileName": file_name,
        "rowCount": row_count,
        "importedAt": datetime.now(timezone.utc),
        "status": status,
        "message": message,
    })


async def get_import_history(limit: int = 50) -> List[Dict[str, Any]]:
    if not is_db_connected():
        return []
    coll = _db()["import_history"]
    cursor = coll.find({}).sort("importedAt", -1).limit(limit)
    docs = await cursor.to_list(length=limit)
    for d in docs:
        d["_id"] = str(d["_id"])
        if isinstance(d.get("importedAt"), datetime):
            d["importedAt"] = d["importedAt"].isoformat()
    return docs


# --------------------------------------------------------------------------
# Authentication & User Management Section
# --------------------------------------------------------------------------
import hashlib
import secrets

def hash_password(password: str, salt: Optional[str] = None) -> tuple[str, str]:
    """Hashes a password with a salt using PBKDF2 HMAC SHA-256."""
    if not salt:
        salt = secrets.token_hex(16)
    hashed = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        100000
    ).hex()
    return hashed, salt

def verify_password(password: str, hashed: str, salt: str) -> bool:
    """Verifies a password against its hash and salt."""
    test_hash, _ = hash_password(password, salt)
    return test_hash == hashed


# In-memory user store
_users_in_memory: Dict[str, Dict[str, Any]] = {}
# In-memory failed logins
_failed_logins_in_memory: List[Dict[str, Any]] = []

# Pre-seeded users
DEFAULT_USERS = [
    {
        "email": "admin@errp.ai",
        "name": "HR Admin User",
        "role": "admin",
        "password_raw": "password123"
    },
    {
        "email": "manager@errp.ai",
        "name": "HR Manager User",
        "role": "manager",
        "password_raw": "password123"
    }
]

def seed_in_memory_users():
    """Seeds default users in-memory."""
    for u in DEFAULT_USERS:
        email = u["email"]
        if email not in _users_in_memory:
            hashed, salt = hash_password(u["password_raw"])
            _users_in_memory[email] = {
                "email": email,
                "name": u["name"],
                "role": u["role"],
                "password_hash": hashed,
                "salt": salt,
                "createdAt": datetime.now(timezone.utc).isoformat()
            }

# Always seed in-memory users on module load
seed_in_memory_users()


async def seed_db_users():
    """Seeds default users in MongoDB if they don't exist yet."""
    if not is_db_connected():
        return
    coll = _db()["users"]
    for u in DEFAULT_USERS:
        existing = await coll.find_one({"email": u["email"]})
        if not existing:
            hashed, salt = hash_password(u["password_raw"])
            await coll.insert_one({
                "email": u["email"],
                "name": u["name"],
                "role": u["role"],
                "password_hash": hashed,
                "salt": salt,
                "createdAt": datetime.now(timezone.utc)
            })


async def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    """Finds user details by email address."""
    email_clean = email.strip().lower()
    if is_db_connected():
        coll = _db()["users"]
        doc = await coll.find_one({"email": email_clean})
        if doc:
            doc["_id"] = str(doc["_id"])
            if isinstance(doc.get("createdAt"), datetime):
                doc["createdAt"] = doc["createdAt"].isoformat()
            return doc
        return None
    
    # In-memory fallback
    user = _users_in_memory.get(email_clean)
    if user:
        return dict(user)
    return None


async def create_user(email: str, name: str, role: str, password: Optional[str] = None, is_sso: bool = False) -> Dict[str, Any]:
    """Creates a new user account."""
    email_clean = email.strip().lower()
    
    # Generate password hash/salt if a password was provided (standard signup)
    password_hash = None
    salt = None
    if password:
        password_hash, salt = hash_password(password)

    user_data = {
        "email": email_clean,
        "name": name,
        "role": role,
        "password_hash": password_hash,
        "salt": salt,
        "is_sso": is_sso,
        "createdAt": datetime.now(timezone.utc)
    }

    if is_db_connected():
        coll = _db()["users"]
        # Delete existing to prevent duplicate email issues if re-creating
        await coll.delete_many({"email": email_clean})
        await coll.insert_one(user_data)
        user_data["_id"] = str(user_data["_id"])
        user_data["createdAt"] = user_data["createdAt"].isoformat()
        return user_data
    
    # In-memory storage
    mem_data = dict(user_data)
    mem_data["createdAt"] = mem_data["createdAt"].isoformat()
    _users_in_memory[email_clean] = mem_data
    return mem_data


async def log_failed_login(email: str, ip_address: str, reason: str) -> None:
    """Logs a failed login attempt."""
    email_clean = email.strip().lower()
    log_data = {
        "email": email_clean,
        "ipAddress": ip_address,
        "reason": reason,
        "attemptedAt": datetime.now(timezone.utc)
    }
    
    if is_db_connected():
        coll = _db()["failed_logins"]
        await coll.insert_one(log_data)
    else:
        mem_data = dict(log_data)
        mem_data["attemptedAt"] = mem_data["attemptedAt"].isoformat()
        _failed_logins_in_memory.append(mem_data)

