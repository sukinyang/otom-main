"""
Logging utility for Otom AI Consultant
Provides consistent logging across all modules
"""

import os
import sys
import logging
from logging.handlers import RotatingFileHandler, TimedRotatingFileHandler
from datetime import datetime
import json
from typing import Optional

# Create logs directory if it doesn't exist
LOG_DIR = os.getenv("LOG_DIR", "logs")
os.makedirs(LOG_DIR, exist_ok=True)

# Log levels
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

class CustomFormatter(logging.Formatter):
    """Custom formatter with colors for console output"""

    # Color codes
    grey = "\x1b[38;21m"
    blue = "\x1b[34m"
    green = "\x1b[32m"
    yellow = "\x1b[33m"
    red = "\x1b[31m"
    bold_red = "\x1b[31;1m"
    reset = "\x1b[0m"

    # Format string
    format_str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

    FORMATS = {
        logging.DEBUG: grey + format_str + reset,
        logging.INFO: blue + format_str + reset,
        logging.WARNING: yellow + format_str + reset,
        logging.ERROR: red + format_str + reset,
        logging.CRITICAL: bold_red + format_str + reset
    }

    def format(self, record):
        log_fmt = self.FORMATS.get(record.levelno)
        formatter = logging.Formatter(log_fmt, datefmt='%Y-%m-%d %H:%M:%S')
        return formatter.format(record)

class JSONFormatter(logging.Formatter):
    """JSON formatter for structured logging"""

    def format(self, record):
        log_obj = {
            'timestamp': datetime.utcnow().isoformat(),
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
            'module': record.module,
            'function': record.funcName,
            'line': record.lineno
        }

        # Add exception info if present
        if record.exc_info:
            log_obj['exception'] = self.formatException(record.exc_info)

        # Add extra fields if present
        if hasattr(record, 'extra_fields'):
            log_obj.update(record.extra_fields)

        return json.dumps(log_obj)

def setup_logger(name: str, log_level: str = None) -> logging.Logger:
    """
    Set up a logger with consistent configuration

    Args:
        name: Logger name (usually module name)
        log_level: Override log level for this logger

    Returns:
        Configured logger instance
    """
    logger = logging.getLogger(name)

    # Don't add handlers if they already exist
    if logger.handlers:
        return logger

    # Set log level
    level = getattr(logging, log_level or LOG_LEVEL.upper())
    logger.setLevel(level)

    # Console handler with custom formatter
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(level)

    # Use colored output for development, plain for production
    if os.getenv("ENV", "development") == "development":
        console_handler.setFormatter(CustomFormatter())
    else:
        console_handler.setFormatter(
            logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        )

    logger.addHandler(console_handler)

    # File handler with rotation
    file_handler = RotatingFileHandler(
        os.path.join(LOG_DIR, f"{name}.log"),
        maxBytes=10 * 1024 * 1024,  # 10MB
        backupCount=5
    )
    file_handler.setLevel(level)
    file_handler.setFormatter(
        logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    )
    logger.addHandler(file_handler)

    # JSON file handler for structured logs
    json_handler = RotatingFileHandler(
        os.path.join(LOG_DIR, f"{name}.json"),
        maxBytes=10 * 1024 * 1024,  # 10MB
        backupCount=5
    )
    json_handler.setLevel(level)
    json_handler.setFormatter(JSONFormatter())
    logger.addHandler(json_handler)

    # Error file handler (only errors and above)
    error_handler = TimedRotatingFileHandler(
        os.path.join(LOG_DIR, "errors.log"),
        when="midnight",
        interval=1,
        backupCount=30
    )
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(
        logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s\n%(pathname)s:%(lineno)d'
        )
    )
    logger.addHandler(error_handler)

    return logger

def log_api_call(logger: logging.Logger, method: str, endpoint: str,
                 status_code: int = None, duration_ms: float = None,
                 error: str = None):
    """Log API call with structured data"""
    extra_fields = {
        'api_method': method,
        'api_endpoint': endpoint,
        'api_status_code': status_code,
        'api_duration_ms': duration_ms
    }

    if error:
        extra_fields['api_error'] = error
        logger.error(f"API call failed: {method} {endpoint}", extra={'extra_fields': extra_fields})
    else:
        logger.info(f"API call: {method} {endpoint} - {status_code}", extra={'extra_fields': extra_fields})

def log_consultation_event(logger: logging.Logger, session_id: str,
                          event_type: str, phase: str = None,
                          metadata: dict = None):
    """Log consultation-related events"""
    extra_fields = {
        'session_id': session_id,
        'event_type': event_type,
        'phase': phase
    }

    if metadata:
        extra_fields.update(metadata)

    logger.info(f"Consultation event: {event_type}", extra={'extra_fields': extra_fields})

def log_workflow_event(logger: logging.Logger, company_id: str,
                      event_type: str, metrics: dict = None):
    """Log workflow mapping events"""
    extra_fields = {
        'company_id': company_id,
        'event_type': event_type
    }

    if metrics:
        extra_fields['metrics'] = metrics

    logger.info(f"Workflow event: {event_type}", extra={'extra_fields': extra_fields})

def get_logger_stats() -> dict:
    """Get logging statistics"""
    stats = {
        'log_directory': LOG_DIR,
        'log_level': LOG_LEVEL,
        'log_files': []
    }

    # List all log files with sizes
    if os.path.exists(LOG_DIR):
        for filename in os.listdir(LOG_DIR):
            filepath = os.path.join(LOG_DIR, filename)
            if os.path.isfile(filepath):
                stats['log_files'].append({
                    'name': filename,
                    'size_bytes': os.path.getsize(filepath),
                    'modified': datetime.fromtimestamp(os.path.getmtime(filepath)).isoformat()
                })

    return stats

# Create main application logger
main_logger = setup_logger("otom_main")

def log_startup():
    """Log application startup"""
    main_logger.info("=" * 60)
    main_logger.info("Otom AI Consultant Starting")
    main_logger.info(f"Environment: {os.getenv('ENV', 'development')}")
    main_logger.info(f"Log Level: {LOG_LEVEL}")
    main_logger.info(f"Log Directory: {LOG_DIR}")
    main_logger.info("=" * 60)

def log_shutdown():
    """Log application shutdown"""
    main_logger.info("=" * 60)
    main_logger.info("Otom AI Consultant Shutting Down")
    main_logger.info("=" * 60)