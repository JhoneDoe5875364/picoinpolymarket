import logging
from logging.handlers import RotatingFileHandler
import os

LOG_FILE = "server.log"
LOGGER_NAME = "predictpix"


def setup_logger():
    logger = logging.getLogger(LOGGER_NAME)
    logger.setLevel(logging.INFO)

    if logger.handlers:
        return logger  # Prevent duplication if already set

    formatter = logging.Formatter(
        "%(asctime)s [%(levelname)s] [%(name)s] %(message)s"
    )

    # Console Handler
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)

    # File Handler
    file_handler = RotatingFileHandler(
        LOG_FILE,
        maxBytes=5 * 1024 * 1024,  # 5MB
        backupCount=1,
        encoding="utf-8"
    )
    file_handler.setFormatter(formatter)

    logger.addHandler(console_handler)
    logger.addHandler(file_handler)

    logger.propagate = False

    return logger


def get_logger():
    return logging.getLogger(LOGGER_NAME)
