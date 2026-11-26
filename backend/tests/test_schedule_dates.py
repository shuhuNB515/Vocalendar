import unittest
from datetime import datetime

from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base, get_db
from app.models import Schedule, User
from app.routers.auth import create_access_token
from app.routers.schedules import router


class ScheduleDateTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.engine = create_async_engine("sqlite+aiosqlite:///:memory:")
        async with self.engine.begin() as connection:
            await connection.run_sync(Base.metadata.create_all)
        sessions = sessionmaker(self.engine, class_=AsyncSession, expire_on_commit=False)

        async def database():
            async with sessions() as session:
                yield session

        app = FastAPI()
        app.include_router(router, prefix="/api/schedules")
        app.dependency_overrides[get_db] = database
        self.client = AsyncClient(
            transport=ASGITransport(app=app, raise_app_exceptions=False),
            base_url="http://test",
            headers={"Authorization": "Bearer " + create_access_token({"sub": "1"})},
        )
        async with sessions() as session:
            session.add_all([
                User(id=1, email="owner@example.test", password_hash="unused"),
                User(id=2, email="other@example.test", password_hash="unused"),
            ])
            await session.flush()
            for title, time, owner in [
                ("previous-week", "2026-11-22T23:59:59", 1),
                ("week-start", "2026-11-23T00:00:00", 1),
                ("day-start", "2026-11-25T00:00:00", 1),
                ("day-end", "2026-11-25T23:59:59", 1),
                ("next-day", "2026-11-26T00:00:00", 1),
                ("next-week", "2026-11-30T00:00:00", 1),
                ("other-owner", "2026-11-25T12:00:00", 2),
            ]:
                session.add(Schedule(user_id=owner, title=title, start_time=datetime.fromisoformat(time)))
            await session.commit()

    async def asyncTearDown(self):
        await self.client.aclose()
        await self.engine.dispose()

    async def test_invalid_dates_are_client_errors(self):
        for date in ["not-a-date", "2026-02-30", "2026-13-01"]:
            with self.subTest(date=date):
                response = await self.client.get("/api/schedules", params={"date": date})
                self.assertEqual(response.status_code, 422)
                self.assertIn("detail", response.json())

    async def test_unrepresentable_end_boundaries_are_client_errors(self):
        for range in ["day", "week"]:
            with self.subTest(range=range):
                response = await self.client.get(
                    "/api/schedules", params={"date": "9999-12-31", "range": range}
                )
                self.assertEqual(response.status_code, 422)

    async def test_day_includes_midnight_but_excludes_next_day_and_other_users(self):
        response = await self.client.get("/api/schedules", params={"date": "2026-11-25"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual([s["title"] for s in response.json()], ["day-start", "day-end"])

    async def test_week_starts_monday_and_excludes_following_monday(self):
        response = await self.client.get(
            "/api/schedules", params={"date": "2026-11-25", "range": "week"}
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            [s["title"] for s in response.json()],
            ["week-start", "day-start", "day-end", "next-day"],
        )

    async def test_missing_date_keeps_all_owned_schedules(self):
        response = await self.client.get("/api/schedules")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 6)
        self.assertNotIn("other-owner", [s["title"] for s in response.json()])

    async def test_missing_authentication_is_rejected(self):
        self.client.headers.pop("Authorization")
        response = await self.client.get("/api/schedules", params={"date": "2026-11-25"})
        self.assertEqual(response.status_code, 401)


if __name__ == "__main__":
    unittest.main()
