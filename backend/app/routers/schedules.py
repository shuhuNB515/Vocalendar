from fastapi import APIRouter, Depends, HTTPException, Header, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from datetime import datetime, timedelta
from typing import Optional

from ..database import get_db
from ..models import Schedule, User
from ..schemas import ScheduleCreate, ScheduleUpdate, ScheduleOut
from ..routers.auth import verify_token

router = APIRouter()


async def get_user_id(authorization: str = Header(None)) -> int:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="未提供认证凭据")
    token = authorization.split(" ")[1]
    return verify_token(token)


@router.get("", response_model=list[ScheduleOut])
async def list_schedules(
    date: Optional[str] = None,
    range: Optional[str] = None,
    user_id: int = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
):
    query = select(Schedule).where(Schedule.user_id == user_id)

    if date:
        target_date = datetime.fromisoformat(date)
        if range == "week":
            start = target_date - timedelta(days=target_date.weekday())
            end = start + timedelta(days=7)
            query = query.where(and_(Schedule.start_time >= start, Schedule.start_time < end))
        else:
            next_day = target_date + timedelta(days=1)
            query = query.where(and_(Schedule.start_time >= target_date, Schedule.start_time < next_day))

    query = query.order_by(Schedule.start_time)
    result = await db.execute(query)
    schedules = result.scalars().all()

    return [
        ScheduleOut(
            id=s.id,
            user_id=s.user_id,
            title=s.title,
            description=s.description,
            location=s.location,
            start_time=s.start_time.isoformat(),
            end_time=s.end_time.isoformat() if s.end_time else None,
            reminder_minutes=s.reminder_minutes,
            created_at=s.created_at.isoformat() if s.created_at else "",
            updated_at=s.updated_at.isoformat() if s.updated_at else "",
        )
        for s in schedules
    ]


@router.post("", response_model=ScheduleOut)
async def create_schedule(
    req: ScheduleCreate,
    user_id: int = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
):
    schedule = Schedule(
        user_id=user_id,
        title=req.title,
        description=req.description,
        location=req.location,
        start_time=datetime.fromisoformat(req.start_time),
        end_time=datetime.fromisoformat(req.end_time) if req.end_time else None,
        reminder_minutes=req.reminder_minutes,
    )
    db.add(schedule)
    await db.commit()
    await db.refresh(schedule)

    return ScheduleOut(
        id=schedule.id,
        user_id=schedule.user_id,
        title=schedule.title,
        description=schedule.description,
        location=schedule.location,
        start_time=schedule.start_time.isoformat(),
        end_time=schedule.end_time.isoformat() if schedule.end_time else None,
        reminder_minutes=schedule.reminder_minutes,
        created_at=schedule.created_at.isoformat() if schedule.created_at else "",
        updated_at=schedule.updated_at.isoformat() if schedule.updated_at else "",
    )


@router.put("/{schedule_id}", response_model=ScheduleOut)
async def update_schedule(
    schedule_id: int,
    req: ScheduleUpdate,
    user_id: int = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Schedule).where(and_(Schedule.id == schedule_id, Schedule.user_id == user_id))
    )
    schedule = result.scalar_one_or_none()
    if not schedule:
        raise HTTPException(status_code=404, detail="日程不存在")

    update_data = req.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        if key in ("start_time", "end_time") and value:
            value = datetime.fromisoformat(value)
        setattr(schedule, key, value)

    await db.commit()
    await db.refresh(schedule)

    return ScheduleOut(
        id=schedule.id,
        user_id=schedule.user_id,
        title=schedule.title,
        description=schedule.description,
        location=schedule.location,
        start_time=schedule.start_time.isoformat(),
        end_time=schedule.end_time.isoformat() if schedule.end_time else None,
        reminder_minutes=schedule.reminder_minutes,
        created_at=schedule.created_at.isoformat() if schedule.created_at else "",
        updated_at=schedule.updated_at.isoformat() if schedule.updated_at else "",
    )


@router.delete("/{schedule_id}")
async def delete_schedule(
    schedule_id: int,
    user_id: int = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Schedule).where(and_(Schedule.id == schedule_id, Schedule.user_id == user_id))
    )
    schedule = result.scalar_one_or_none()
    if not schedule:
        raise HTTPException(status_code=404, detail="日程不存在")

    await db.delete(schedule)
    await db.commit()
    return {"success": True, "message": "日程已删除"}
