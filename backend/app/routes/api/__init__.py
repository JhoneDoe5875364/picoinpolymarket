# Make this a package. Routers live in sibling modules.
# routes package
from app.routes.api import users, account, admin, auth_pi, pi, markets, positions, suggestions, geo, attestation, health


def include_api_routers(app):
    app.include_router(users.router, prefix="/api")
    app.include_router(account.router, prefix="/api")
    app.include_router(admin.router, prefix="/api")
    app.include_router(auth_pi.router, prefix="/api")
    app.include_router(pi.router, prefix="/api")
    app.include_router(markets.router, prefix="/api")
    app.include_router(positions.router, prefix="/api")
    app.include_router(suggestions.router, prefix="/api")
    app.include_router(geo.router, prefix="/api")
    app.include_router(attestation.router, prefix="/api")
    app.include_router(health.router, prefix="/api")
