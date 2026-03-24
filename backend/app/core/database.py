import psycopg2


def _conn():
    return psycopg2.connect("")
