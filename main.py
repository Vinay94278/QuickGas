
from fastapi import FastAPI
from app.api import auth_controller,dashboard_controller , company_controller, gas_controller, order_controller, order_item_controller, health_controller, order_status_controller, user_controller, role_controller
from app.core.config import settings
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

def create_app():
    app = FastAPI(title=settings.APP_NAME)

    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.mount("/frontend", StaticFiles(directory="frontend"), name="frontend")

    # Include routers
    app.include_router(auth_controller.router, prefix="/api/auth", tags=["auth"])
    app.include_router(dashboard_controller.router, prefix="/api/dashboard", tags=["dashboard"])
    app.include_router(company_controller.router, prefix="/api", tags=["companies"])
    app.include_router(role_controller.router, prefix="/api", tags=["roles"])
    app.include_router(gas_controller.router, prefix="/api", tags=["gases"])
    app.include_router(order_controller.router, prefix="/api", tags=["orders"])
    app.include_router(order_item_controller.router, prefix="/api", tags=["order-items"])
    app.include_router(health_controller.router, prefix="/api/health", tags=["health"])
    app.include_router(user_controller.router, prefix="/api", tags=["users"])
    app.include_router(order_status_controller.router, prefix="/api", tags=["order_statuses"])

    @app.get("/")
    async def read_index():
        return FileResponse('frontend/home_page.html')

    return app

app = create_app()
