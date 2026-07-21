"""
Standalone entrypoint for the scheduler worker.

Run as a separate process (Render background worker / Railway service):

    python -m app.workers.run_worker

Uses a blocking scheduler so the process stays alive on its own, instead of
piggybacking on the FastAPI web process. This keeps scheduled publishing
reliable even when the web service restarts, scales, or idles.
"""
import signal
import sys

from apscheduler.schedulers.blocking import BlockingScheduler

from .scheduler_worker import publish_scheduled_posts

def main():
    scheduler = BlockingScheduler()
    scheduler.add_job(publish_scheduled_posts, "interval", seconds=10)

    def shutdown(signum, frame):
        print("[Worker] Received shutdown signal, stopping scheduler.")
        scheduler.shutdown(wait=False)
        sys.exit(0)

    signal.signal(signal.SIGTERM, shutdown)
    signal.signal(signal.SIGINT, shutdown)

    print("[Worker] Starting standalone scheduler worker (10s intervals).")
    scheduler.start()

if __name__ == "__main__":
    main()
