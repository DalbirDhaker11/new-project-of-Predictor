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
