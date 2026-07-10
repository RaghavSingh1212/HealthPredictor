from motor.motor_asyncio import AsyncIOMotorClient
from config import settings
import logging

class MongoDB:
    client: AsyncIOMotorClient = None
    db = None

db_helper = MongoDB()

async def connect_to_mongo():
    if settings.USE_IN_MEMORY_DB:
        from mongomock_motor import AsyncMongoMockClient
        db_helper.client = AsyncMongoMockClient()
        db_helper.db = db_helper.client["med_db"]
        logging.info("Using in-memory MongoDB (local dev). Set USE_IN_MEMORY_DB=false for real MongoDB.")
    else:
        db_helper.client = AsyncIOMotorClient(settings.MONGO_URI, maxPoolSize=50, minPoolSize=10)
        db_helper.db = db_helper.client.get_default_database()
    # Optimize patient and triage review workflows.
    await db_helper.db.patients.create_index([("patient_id", 1)], unique=True)
    await db_helper.db.patients.create_index([("name", 1)])
    await db_helper.db.triage_cases.create_index([("patient_id", 1)])
    await db_helper.db.triage_cases.create_index([("created_at", -1)])
    await db_helper.db.triage_cases.create_index([("status", 1)])
    logging.info("Connected to MongoDB and initialized indexes.")

async def close_mongo_connection():
    db_helper.client.close()
    logging.info("Closed MongoDB connection.")
