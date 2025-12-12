"""
Celery Configuration for Otom
Handles background task processing
"""

import os
from celery import Celery
from kombu import Exchange, Queue

# Create Celery instance
celery_app = Celery(
    'otom',
    broker=os.getenv('CELERY_BROKER_URL', 'redis://localhost:6379/0'),
    backend=os.getenv('CELERY_RESULT_BACKEND', 'redis://localhost:6379/1')
)

# Celery configuration
celery_app.conf.update(
    # Task settings
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,

    # Worker settings
    worker_prefetch_multiplier=4,
    worker_max_tasks_per_child=1000,

    # Result backend settings
    result_expires=3600,  # 1 hour

    # Task routing
    task_routes={
        'otom.tasks.email.*': {'queue': 'email'},
        'otom.tasks.report.*': {'queue': 'reports'},
        'otom.tasks.workflow.*': {'queue': 'workflow'},
        'otom.tasks.research.*': {'queue': 'research'},
    },

    # Queue configuration
    task_queues=(
        Queue('default', Exchange('default'), routing_key='default'),
        Queue('email', Exchange('email'), routing_key='email'),
        Queue('reports', Exchange('reports'), routing_key='reports'),
        Queue('workflow', Exchange('workflow'), routing_key='workflow'),
        Queue('research', Exchange('research'), routing_key='research'),
    ),

    # Beat schedule for periodic tasks
    beat_schedule={
        'monthly-workflow-updates': {
            'task': 'otom.tasks.workflow.update_workflows',
            'schedule': 30 * 24 * 60 * 60,  # 30 days in seconds
        },
        'daily-email-check': {
            'task': 'otom.tasks.email.process_pending_emails',
            'schedule': 24 * 60 * 60,  # 24 hours
        },
    },

    # Error handling
    task_reject_on_worker_lost=True,
    task_acks_late=True,

    # Performance optimizations
    broker_connection_retry_on_startup=True,
    broker_pool_limit=10,
)

# Auto-discover tasks from all apps
celery_app.autodiscover_tasks([
    'otom.core.tasks',
    'otom.interfaces.email',
    'otom.core.workflow',
    'otom.core.research',
    'otom.core.deliverables',
])