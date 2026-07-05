import asyncio
from app.db.session import AsyncSessionLocal
from sqlalchemy import text
import datetime

async def run_queries():
    async with AsyncSessionLocal() as db:
        print("Testing logs query...")
        try:
            sql = """
                SELECT h.id, s.user_id, h.content as query_text, h.created_at, s.project_id
                FROM graphrag.chat_history h
                JOIN graphrag.chat_sessions s ON h.session_id = s.id
                WHERE h.role = 'user'
            """
            res = await db.execute(text(sql))
            rows = res.fetchall()
            print(f"Logs query OK, found {len(rows)} rows.")
        except Exception as e:
            print("Logs query failed:", e)

        print("Testing stats query 2...")
        try:
            sql_domain = """
                SELECT p.name as project_name, COUNT(h.id) as cnt
                FROM graphrag.chat_sessions s
                JOIN graphrag.projects p ON s.project_id = p.id
                LEFT JOIN graphrag.chat_history h ON h.session_id = s.id AND h.role = 'user'
                GROUP BY p.name
                ORDER BY cnt DESC
            """
            res = await db.execute(text(sql_domain))
            rows = res.fetchall()
            print(f"Stats query 2 OK, found {len(rows)} rows.")
        except Exception as e:
            print("Stats query 2 failed:", e)

        print("Testing stats query 3...")
        try:
            sql_detail = """
                SELECT 
                    p.name as project_name,
                    COUNT(h.id) as total_req
                FROM graphrag.chat_sessions s
                JOIN graphrag.projects p ON s.project_id = p.id
                LEFT JOIN graphrag.chat_history h ON h.session_id = s.id AND h.role = 'user'
                GROUP BY p.name
                ORDER BY total_req DESC
            """
            res = await db.execute(text(sql_detail))
            rows = res.fetchall()
            print(f"Stats query 3 OK, found {len(rows)} rows.")
        except Exception as e:
            print("Stats query 3 failed:", e)

asyncio.run(run_queries())
