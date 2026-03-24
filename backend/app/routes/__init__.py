# routes package
from app.routes.api import include_api_routers


def include_all_routers(app):
    include_api_routers(app)
